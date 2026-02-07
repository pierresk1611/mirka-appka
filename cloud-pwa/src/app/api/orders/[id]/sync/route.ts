import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import { parseOrderText } from '@/lib/ai';
import { matchTemplate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const id = parseInt(params.id);

    try {
        // 1. Fetch Credentials
        const settings = await prisma.settings.findMany({
            where: {
                key: { in: ['WOO_URL', 'WOO_CK', 'WOO_CS'] }
            }
        });

        const wooUrl = settings.find(s => s.key === 'WOO_URL')?.value;
        const wooCk = settings.find(s => s.key === 'WOO_CK')?.value;
        const wooCs = settings.find(s => s.key === 'WOO_CS')?.value;

        if (!wooUrl || !wooCk || !wooCs) {
            return NextResponse.json({ error: 'Missing Woo Credentials' }, { status: 500 });
        }

        const WooCommerce = new WooCommerceRestApi({
            url: wooUrl,
            consumerKey: wooCk,
            consumerSecret: wooCs,
            version: "wc/v3"
        });

        // 2. Fetch specific order
        const response = await WooCommerce.get(`orders/${id}`);
        const order = response.data;

        const customerName = `${order.billing.first_name} ${order.billing.last_name}`;
        let templateKey = 'UNKNOWN';
        let allItemsText = [];

        for (const item of order.line_items) {
            const productName = item.name || '';
            allItemsText.push(`Produkt: ${productName}`);

            if (item.meta_data && Array.isArray(item.meta_data)) {
                for (const meta of item.meta_data) {
                    let val = meta.value;
                    if (val !== null && typeof val !== 'undefined') {
                        if (typeof val === 'object' || Array.isArray(val)) {
                            try { val = JSON.stringify(val); } catch (e) { val = String(val); }
                        } else if (typeof val === 'string' && val.includes('[object Object]')) {
                            val = '[JSON Serialization Error]';
                        }
                    }
                    allItemsText.push(`${meta.key}: ${val}`);
                }
            }

            const matchedKey = matchTemplate(productName);
            if (matchedKey !== 'UNKNOWN') {
                templateKey = matchedKey;
            } else if (templateKey === 'UNKNOWN') {
                templateKey = productName;
            }
        }

        const sourceText = JSON.stringify({
            note: order.customer_note,
            items: allItemsText
        }, null, 2);

        // 3. Force update in DB
        const savedOrder = await prisma.order.update({
            where: { id: id },
            data: {
                customer_name: customerName,
                template_key: templateKey,
                source_text: sourceText,
                status: 'AI_READY' // Reset status to trigger AI again if needed
            }
        });

        // 4. Trigger AI Processing immediately for this one
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

        return NextResponse.json({ success: true, order: savedOrder });

    } catch (error: any) {
        console.error('Order Re-sync Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 502 });
    }
}
