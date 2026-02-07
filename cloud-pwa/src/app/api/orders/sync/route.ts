import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import { parseOrderText } from '@/lib/ai';

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

        if (!wooUrl || !wooCk || !wooCs) {
            console.warn('Missing WooCommerce Credentials in DB. Using Mock/Empty.');
            // Logic to fall back to env or return empty?
            // Prompt says: "Settings: Použi premenné z databázy"
            if (process.env.WOO_URL && process.env.WOO_API_KEY) {
                // Fallback to Env for backward compat if needed, but SDK needs CK/CS
            }
            return NextResponse.json({ error: 'Missing Woo Credentials in Settings' }, { status: 500 });
        }

        // 2. Initialize Woo Client
        const WooCommerce = new WooCommerceRestApi({
            url: wooUrl,
            consumerKey: wooCk,
            consumerSecret: wooCs,
            version: "wc/v3"
        });

        console.log(`Syncing orders from ${wooUrl}...`);

        // 3. Fetch Processing Orders
        const response = await WooCommerce.get("orders", {
            status: "processing",
            per_page: 20 // Limit batch size
        });

        const orders = response.data;
        const result = { added: 0, updated: 0, errors: 0 };

        for (const order of orders) {
            try {
                const id = order.id;
                const customerName = `${order.billing.first_name} ${order.billing.last_name}`;

                // --- MAPPING LOGIC ---
                // 1. Template Key from Line Items
                let templateKey = 'UNKNOWN';
                let productName = 'UNKNOWN';
                let allItemsText = [];

                for (const item of order.line_items) {
                    productName = item.name || '';
                    allItemsText.push(`Produkt: ${productName}`);

                    // Check Meta for "Extra Product Options" if available in item.meta_data
                    if (item.meta_data && Array.isArray(item.meta_data)) {
                        for (const meta of item.meta_data) {
                            let value = meta.value;

                            // Fix [object Object] issue
                            if (typeof value === 'object' && value !== null) {
                                try {
                                    // If it's the tm_epo complex data, we could try to extract it 
                                    // but for source_text it's better to have a readable string
                                    value = JSON.stringify(value);
                                } catch (e) {
                                    value = '[Complex Data]';
                                }
                            }

                            allItemsText.push(`${meta.key}: ${value}`);
                        }
                    }

                    // Template Matching (Consistent with CSV import)
                    const lowerName = productName.toLowerCase();
                    if (lowerName.includes('pivo')) {
                        templateKey = 'BIR_PIVO';
                    } else if (lowerName.includes('svadobn') || lowerName.includes('wedding')) {
                        templateKey = 'WED_BASIC';
                    } else if (lowerName.includes('odtlač')) {
                        templateKey = 'FINGERPRINTS';
                    } else if (templateKey === 'UNKNOWN') {
                        templateKey = productName; // Fallback
                    }
                }

                // 2. Source Text (Customer Note + Items)
                const sourceText = JSON.stringify({
                    note: order.customer_note,
                    items: allItemsText
                }, null, 2);

                // --- SAVING ---
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
                        created_at: new Date(order.date_created)
                    }
                });

                // --- AI PROCESSING (Automatic) ---
                if (!savedOrder.ai_data || savedOrder.status === 'AI_READY') {
                    try {
                        console.log(`AI Processing for Order #${id}...`);
                        const parsedAiData = await parseOrderText(sourceText, templateKey);
                        if (parsedAiData) {
                            await prisma.order.update({
                                where: { id: id },
                                data: {
                                    ai_data: JSON.stringify(parsedAiData),
                                    status: 'AI_READY'
                                }
                            });
                        }
                    } catch (aiErr) {
                        console.error(`AI extraction failed for Order #${id}:`, aiErr);
                    }
                }

                result.added++;
            } catch (err) {
                console.error(`Error processing order ${order.id}:`, err);
                result.errors++;
            }
        }

        return NextResponse.json({ success: true, result });

    } catch (error) {
        console.error('Woo Sync Failed:', error);
        return NextResponse.json({ error: 'Sync failed: ' + (error as any).message }, { status: 502 });
    }
}
