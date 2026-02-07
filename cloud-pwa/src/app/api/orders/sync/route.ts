import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import { parseOrderText } from '@/lib/ai';
import { matchTemplate, formatMetadataValue } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow longer timeout for sync

export async function POST() {
    try {
        // 1. Fetch All Active Stores
        const stores = await prisma.store.findMany();
        const settings = await prisma.settings.findMany();
        const aiKey = settings.find(s => s.key === 'OPENAI_API_KEY')?.value;

        if (stores.length === 0) {
            return NextResponse.json({ error: 'Žiadne e-shopy nie sú nakonfigurované.' }, { status: 400 });
        }

        let totalSynced = 0;
        let storeResults = [];

        for (const store of stores) {
            try {
                const WooCommerce = new WooCommerceRestApi({
                    url: store.url,
                    consumerKey: store.consumer_key,
                    consumerSecret: store.consumer_secret,
                    version: "wc/v3"
                });

                console.log(`Syncing orders from ${store.name} (${store.url})...`);

                const response = await WooCommerce.get("orders", {
                    status: "processing",
                    per_page: 20
                });

                const orders = response.data;
                let storeSynced = 0;

                for (const wooOrder of orders) {
                    try {
                        const { id, billing, date_created, line_items, customer_note } = wooOrder;
                        const customerName = `${billing.first_name} ${billing.last_name}`;

                        // 3. Upsert Order Header
                        const savedOrder = await prisma.order.upsert({
                            where: { woo_id_store_id: { woo_id: id, store_id: store.id } },
                            update: { customer_name: customerName },
                            create: {
                                woo_id: id,
                                store_id: store.id,
                                customer_name: customerName,
                                created_at: new Date(date_created)
                            }
                        });

                        // 4. Process Line Items
                        if (line_items && line_items.length > 0) {
                            for (const item of line_items) {
                                const productName = item.name || '';
                                const matchedKey = matchTemplate(productName);

                                // Only process items that match a template or we want to track
                                // For now, we sync ALL items to the order_items table for visibility

                                let itemMetaText = [];
                                if (item.meta_data && Array.isArray(item.meta_data)) {
                                    for (const meta of item.meta_data) {
                                        const formatted = formatMetadataValue(meta.key, meta.value);
                                        if (formatted) itemMetaText.push(`${meta.key}: ${formatted}`);
                                    }
                                }

                                const sourceText = `Produkt: ${productName}\n${itemMetaText.join('\n')}\nPoznámka: ${customer_note || ''}`;

                                const savedItem = await prisma.orderItem.upsert({
                                    where: { id: `${savedOrder.id}-${item.id}` }, // Simplified unique ID
                                    update: {
                                        template_key: matchedKey,
                                        source_text: sourceText,
                                        quantity: item.quantity
                                    },
                                    create: {
                                        id: `${savedOrder.id}-${item.id}`,
                                        order_id: savedOrder.id,
                                        woo_item_id: item.id,
                                        product_name_raw: productName,
                                        template_key: matchedKey,
                                        source_text: sourceText,
                                        quantity: item.quantity,
                                        status: matchedKey !== 'UNKNOWN' ? 'AI_READY' : 'PENDING'
                                    }
                                });

                                // 5. Automatic AI Processing for the item
                                if (savedItem.status === 'AI_READY' && !savedItem.ai_data && aiKey) {
                                    try {
                                        const aiData = await parseOrderText(sourceText, matchedKey, aiKey);
                                        if (aiData) {
                                            await prisma.orderItem.update({
                                                where: { id: savedItem.id },
                                                data: { ai_data: JSON.stringify(aiData) }
                                            });
                                        }
                                    } catch (aiErr) {
                                        console.error(`AI extraction failed for item ${item.id} in order ${id}:`, aiErr);
                                    }
                                }
                            }
                        }

                        storeSynced++;
                        totalSynced++;
                    } catch (err) {
                        console.error(`Error processing order ${wooOrder.id} from ${store.name}:`, err);
                    }
                }

                storeResults.push({ name: store.name, count: storeSynced });
            } catch (err) {
                console.error(`Failed to sync from store ${store.name}:`, err);
            }
        }

        return NextResponse.json({
            success: true,
            total: totalSynced,
            details: storeResults,
            message: `Synchronizácia dokončená. Spolu ${totalSynced} objednávok z ${storeResults.length} obchodov.`
        });

    } catch (error) {
        console.error('Multi-Store Sync Failed:', error);
        return NextResponse.json({ error: 'MegaSync failed: ' + (error as any).message }, { status: 502 });
    }
}
