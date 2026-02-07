import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import { parseOrderText } from '@/lib/ai';
import { matchTemplate } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow longer timeout for sync

export async function POST() {
    try {
        // 1. Fetch Credentials from DB (Settings table)
        const settings = await prisma.settings.findMany({
            where: {
                key: { in: ['WOO_URL', 'WOO_CK', 'WOO_CS'] }
            }
        });

        const wooUrl = settings.find(s => s.key === 'WOO_URL')?.value;
        const wooCk = settings.find(s => s.key === 'WOO_CK')?.value;
        const wooCs = settings.find(s => s.key === 'WOO_CS')?.value;
        const aiKey = settings.find(s => s.key === 'OPENAI_API_KEY')?.value;

        if (!wooUrl || !wooCk || !wooCs) {
            return NextResponse.json({ error: 'Missing WooCommerce settings.' }, { status: 500 });
        }

        // 2. Initialize Woo Client
        const WooCommerce = new WooCommerceRestApi({
            url: wooUrl,
            consumerKey: wooCk,
            consumerSecret: wooCs,
            version: "wc/v3"
        });

        console.log(`Syncing orders from ${wooUrl}...`);

        // 2. Fetch "processing" orders
        const response = await WooCommerce.get("orders", {
            status: "processing",
            per_page: 20
        });

        const orders = response.data;
        let syncedCount = 0;

        for (const order of orders) {
            try {
                const { id, billing, date_created, customer_note, line_items } = order;
                const customerName = `${billing.first_name} ${billing.last_name}`;

                // --- MAPPING LOGIC ---
                // 1. Template Key from Line Items
                let templateKey = 'UNKNOWN';
                let allItemsText = [];

                // Simple Logic: Take first item's product name to match template
                if (line_items && line_items.length > 0) {
                    for (const item of line_items) {
                        const productName = item.name || '';
                        allItemsText.push(`Produkt: ${productName}`);

                        // Check Meta for "Extra Product Options" if available in item.meta_data
                        if (item.meta_data && Array.isArray(item.meta_data)) {
                            for (const meta of item.meta_data) {
                                let val = meta.value;

                                // Robust fix for [object Object] issue
                                if (val !== null && typeof val !== 'undefined') {
                                    if (typeof val === 'object' || Array.isArray(val)) {
                                        try {
                                            val = JSON.stringify(val);
                                        } catch (e) {
                                            val = String(val);
                                        }
                                    } else if (typeof val === 'string' && val.includes('[object Object]')) {
                                        // If we somehow got a string with [object Object], it's already corrupted
                                        val = '[JSON Serialization Error in Metadata]';
                                    }
                                }

                                allItemsText.push(`${meta.key}: ${val}`);
                            }
                        }

                        // Template Matching (Consistent with CSV import)
                        const matchedKey = matchTemplate(productName);
                        if (matchedKey !== 'UNKNOWN') {
                            templateKey = matchedKey;
                        } else if (templateKey === 'UNKNOWN') {
                            templateKey = productName; // Fallback
                        }
                    }
                }

                // --- NEW: Human Readable Source Text for AI ---
                const sourceText = `Poznámka zákazníka: ${customer_note || 'Žiadna'}\n\nProdukty a možnosti:\n${allItemsText.join('\n')}`;

                // 3. Upsert Order
                const savedOrder = await prisma.order.upsert({
                    where: { id: id },
                    update: {
                        template_key: templateKey,
                        source_text: sourceText,
                    },
                    create: {
                        id: id,
                        customer_name: customerName,
                        template_key: templateKey,
                        source_text: sourceText,
                        status: 'AI_READY',
                        created_at: new Date(date_created)
                    }
                });

                // 4. Trigger AI Extraction automatically
                // If it's AI_READY and has no ai_data yet (or re-syncing)
                if (savedOrder.status === 'AI_READY') {
                    try {
                        console.log(`AI Processing for Order #${id}...`);
                        const aiData = await parseOrderText(sourceText, templateKey, aiKey);
                        if (aiData) {
                            await prisma.order.update({
                                where: { id: id },
                                data: {
                                    ai_data: JSON.stringify(aiData),
                                    status: 'AI_READY'
                                }
                            });
                        }
                    } catch (aiErr) {
                        console.error(`AI extraction failed for Order #${id}:`, aiErr);
                    }
                }

                syncedCount++;
            } catch (err) {
                console.error(`Error processing order ${order.id}:`, err);
            }
        }

        return NextResponse.json({
            success: true,
            count: syncedCount,
            message: `Úspešne synchronizovaných ${syncedCount} objednávok.`
        });

    } catch (error) {
        console.error('Woo Sync Failed:', error);
        return NextResponse.json({ error: 'Sync failed: ' + (error as any).message }, { status: 502 });
    }
}
