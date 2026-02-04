import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // 1. Update Local DB
        const updatedOrder = await prisma.order.update({
            where: { id: Number(id) },
            data: { status: 'COMPLETED' }
        });

        // 2. Call Woo Plugin to Complete Order
        const wooUrl = process.env.WOO_URL;
        const wooKey = process.env.WOO_API_KEY;

        if (wooUrl && wooKey) {
            try {
                console.log(`Closing order ${id} on WooCommerce...`);
                // Calls endpoint specified in control question: /wp-json/autodesign/v1/update-status
                const res = await fetch(`${wooUrl}/wp-json/autodesign/v1/update-status`, {
                    method: 'POST',
                    headers: {
                        'X-AutoDesign-Key': wooKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        order_id: id,
                        status: 'completed'
                    })
                });

                if (!res.ok) {
                    const txt = await res.text();
                    console.error('Woo Plugin Error:', txt);
                    // We don't fail the whole request effectively, but log it.
                } else {
                    console.log('Woo Order Closed Successfully.');
                }
            } catch (err) {
                console.error('Failed to call Woo Plugin:', err);
            }
        }

        return NextResponse.json({ success: true, order: updatedOrder });
    } catch (error) {
        console.error('Order Complete Error:', error);
        return NextResponse.json({ error: 'Failed to complete order' }, { status: 500 });
    }
}
