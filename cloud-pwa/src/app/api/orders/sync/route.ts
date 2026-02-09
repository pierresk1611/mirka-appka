import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import { parseOrderText } from '@/lib/ai';
import { matchTemplate, formatMetadataValue, extractTemplateId, extractQuantityFromMetadata, extractSku, extractFormat } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow longer timeout for sync

// Helper function to extract EPO data from meta_data
function extractEPOData(metaData: any[]) {
    if (!metaData || !Array.isArray(metaData)) {
        return { textContent: null, quantity: null, material: null };
    }

    const epoMeta = metaData.find(m => m.key === '_tmcartepo_data');
    if (!epoMeta || !epoMeta.value) {
        return { textContent: null, quantity: null, material: null };
    }

    const epoText = String(epoMeta.value);

    // Extract fields using regex
    const textMatch = epoText.match(/Text pozvánky:\s*([\s\S]+?)(?=\n(?:Počet|Kvalita)|$)/);
    const quantityMatch = epoText.match(/Počet pozvánok:\s*(\d+)/);
    const qualityMatch = epoText.match(/Kvalita:\s*(.+?)(?=\n|$)/);

    return {
        textContent: textMatch?.[1]?.trim() || null,
        quantity: quantityMatch?.[1] ? parseInt(quantityMatch[1]) : null,
        material: qualityMatch?.[1]?.trim() || null
    };
}

export async function POST(request: Request) {
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
                                const sku = extractSku(item);
                                const format = extractFormat(item);

                                let matchedKey = 'UNKNOWN';

                                // 1. Priority: SKU Direct Match
                                if (sku) {
                                    const skuMatch = await prisma.templateConfig.findFirst({
                                        where: {
                                            OR: [
                                                { sku: sku },
                                                { key: sku },
                                                { key: { contains: sku } }
                                            ]
                                        }
                                    });
                                    if (skuMatch) matchedKey = skuMatch.key;
                                }

                                // 2. Priority: Name Code (2025_110)
                                if (matchedKey === 'UNKNOWN') {
                                    const strictId = extractTemplateId(productName);
                                    if (strictId) {
                                        const strictMatch = await prisma.templateConfig.findFirst({
                                            where: {
                                                OR: [
                                                    { key: { contains: strictId } },
                                                    { name: { contains: strictId } }
                                                ]
                                            }
                                        });
                                        if (strictMatch) matchedKey = strictMatch.key;
                                    }
                                }

                                // 3. Priority: Keyword matching fallback
                                if (matchedKey === 'UNKNOWN') {
                                    matchedKey = matchTemplate(productName);
                                }

                                // --- METADATA MATCHING (Pricing) ---
                                let matchedMetadataId = null;
                                let matchedMetadataSku = null;

                                // A) Try by SKU first
                                if (sku) {
                                    const metaBySku = await prisma.productMetadata.findFirst({
                                        where: { sku: sku }
                                    });
                                    if (metaBySku) matchedMetadataId = metaBySku.id;
                                }

                                // B) Try by Strict ID in Name (e.g. 2025_110)
                                if (!matchedMetadataId) {
                                    const strictId = extractTemplateId(productName);
                                    if (strictId) {
                                        const metaById = await prisma.productMetadata.findFirst({
                                            where: { csv_title: { contains: strictId } }
                                        });
                                        if (metaById) matchedMetadataId = metaById.id;
                                    }
                                }
                                // -----------------------------------

                                let itemMetaText = [];
                                if (item.meta_data && Array.isArray(item.meta_data)) {
                                    for (const meta of item.meta_data) {
                                        const formatted = formatMetadataValue(meta.key, meta.value);
                                        if (formatted) itemMetaText.push(`${meta.key}: ${formatted}`);
                                    }
                                }

                                // Extract EPO data (Extra Product Options)
                                const epoData = extractEPOData(item.meta_data);
                                const actualQty = epoData.quantity || extractQuantityFromMetadata(item.meta_data, item.quantity);

                                // Use EPO text content if available, otherwise use metadata
                                const sourceText = epoData.textContent
                                    ? `Produkt: ${productName}\nText pozvánky: ${epoData.textContent}\nPoznámka: ${customer_note || ''}`
                                    : `Produkt: ${productName}\n${itemMetaText.join('\n')}\nPoznámka: ${customer_note || ''}`;

                                const savedItem = await (prisma.orderItem as any).upsert({
                                    where: { id: `${savedOrder.id}-${item.id}` }, // Simplified unique ID
                                    update: {
                                        template_key: matchedKey,
                                        product_metadata_id: matchedMetadataId,
                                        source_text: sourceText,
                                        quantity: actualQty,
                                        sku: sku,
                                        format: format,
                                        material: epoData.material
                                    },
                                    create: {
                                        id: `${savedOrder.id}-${item.id}`,
                                        order_id: savedOrder.id,
                                        woo_item_id: item.id,
                                        product_name_raw: productName,
                                        template_key: matchedKey,
                                        product_metadata_id: matchedMetadataId,
                                        source_text: sourceText,
                                        quantity: actualQty,
                                        sku: sku,
                                        format: format,
                                        material: epoData.material,
                                        status: matchedKey !== 'UNKNOWN' ? 'AI_READY' : 'PENDING'
                                    }
                                });

                                // 5. Automatic AI Processing for the item
                                if (savedItem.status === 'AI_READY' && aiKey) {
                                    // 5.1 Parse AI data if missing
                                    if (!savedItem.ai_data) {
                                        try {
                                            const aiData = await parseOrderText(sourceText, matchedKey, aiKey);
                                            if (aiData) {
                                                await prisma.orderItem.update({
                                                    where: { id: savedItem.id },
                                                    data: { ai_data: JSON.stringify(aiData) }
                                                });
                                            }
                                        } catch (aiErr) {
                                            console.error(`AI extraction failed for item ${item.id} in order ${wooOrder.id}:`, aiErr);
                                        }
                                    }

                                    // 5.2 Trigger preview generation if missing
                                    if (matchedKey !== 'UNKNOWN') {
                                        try {
                                            const protocol = request.headers.get('x-forwarded-proto') || 'http';
                                            const host = request.headers.get('host');
                                            const baseUrl = process.env.NEXT_PUBLIC_URL || `${protocol}://${host}`;

                                            // Call the preview generation endpoint
                                            console.log(`Triggering preview for ${savedItem.id} at ${baseUrl}/api/preview/generate`);
                                            fetch(`${baseUrl}/api/preview/generate`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ itemId: savedItem.id })
                                            }).then(r => {
                                                console.log(`Preview response for ${savedItem.id}: ${r.status}`);
                                            }).catch(e => console.error('Preview error:', e));
                                        } catch (e) {
                                            console.error('Failed to trigger preview:', e);
                                        }
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
