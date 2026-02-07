import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import { parseOrderText } from '@/lib/ai';
import { matchTemplate, formatMetadataValue } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params; // UUID

    try {
        // 1. Fetch Order and its linked Store
        const existingOrder = await prisma.order.findUnique({
            where: { id },
            include: { store: true }
        });

        if (!existingOrder) {
            return NextResponse.json({ error: 'Order not found in PWA' }, { status: 404 });
        }

        const store = existingOrder.store;
        const WooCommerce = new WooCommerceRestApi({
            url: store.url,
            consumerKey: store.consumer_key,
            consumerSecret: store.consumer_secret,
            version: "wc/v3"
        });

        // 2. Fetch specific order from WooCommerce
        const response = await WooCommerce.get(`orders/${existingOrder.woo_id}`);
        const order = response.data;

        // 3. Fetch AI Key from Settings
        const settings = await prisma.settings.findMany();
        const aiKey = settings.find(s => s.key === 'OPENAI_API_KEY')?.value;

        // 4. Sync Items to OrderItem table
        for (const item of order.line_items) {
            const productName = item.name || '';
            const allMetadata = item.meta_data.map((m: any) => `${m.key}: ${formatMetadataValue(m.key, m.value)}`).join('\n');
            const sourceText = `Produkt: ${productName}\n${allMetadata}\nPoznámka: ${order.customer_note || ''}`;
            const templateKey = matchTemplate(productName);

            const savedItem = await prisma.orderItem.upsert({
                where: {
                    id: `${existingOrder.id}-${item.id}` // Unique for this PWA order + Woo item
                },
                update: {
                    product_name_raw: productName,
                    template_key: templateKey,
                    source_text: sourceText,
                    quantity: item.quantity,
                    status: 'AI_READY'
                },
                create: {
                    id: `${existingOrder.id}-${item.id}`,
                    order_id: existingOrder.id,
                    woo_item_id: item.id,
                    product_name_raw: productName,
                    template_key: templateKey,
                    source_text: sourceText,
                    quantity: item.quantity,
                    status: 'AI_READY'
                }
            });

            // 5. Trigger AI Processing for this item
            const aiData = await parseOrderText(sourceText, templateKey, aiKey);
            if (aiData) {
                await prisma.orderItem.update({
                    where: { id: savedItem.id },
                    data: {
                        ai_data: JSON.stringify(aiData),
                        status: 'AI_READY'
                    }
                });

                // 6. Generate preview automatically
                try {
                    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
                    const previewRes = await fetch(`${baseUrl}/api/preview/generate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ itemId: savedItem.id })
                    });

                    if (previewRes.ok) {
                        // The preview API returns an image, so we need to construct the URL
                        const previewUrl = `${baseUrl}/api/preview/generate?itemId=${savedItem.id}`;
                        await prisma.orderItem.update({
                            where: { id: savedItem.id },
                            data: { preview_url: previewUrl }
                        });
                        console.log(`✅ Preview generated for item ${savedItem.id}`);
                    } else {
                        console.warn(`⚠️ Preview generation failed for item ${savedItem.id}`);
                    }
                } catch (previewError) {
                    console.error('Preview generation error:', previewError);
                    // Don't fail the whole sync if preview fails
                }
            }
        }

        return NextResponse.json({ success: true, message: 'Objednávka bola aktualizovaná.' });

    } catch (error: any) {
        console.error('Order Re-sync Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 502 });
    }
}
