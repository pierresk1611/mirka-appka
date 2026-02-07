import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params; // UUID

        try {
            // 1. Fetch Order and linked Store
            const order = await prisma.order.findUnique({
                where: { id },
                include: { store: true }
            });

            if (!order) {
                return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            }

            // 2. Update Local DB
            await prisma.order.update({
                where: { id },
                data: { status: 'COMPLETED' }
            });

            // 3. Call Woo Plugin to Complete Order using Store credentials
            const store = order.store;

            if (store.url && store.api_key) {
                try {
                    console.log(`Closing order ${order.woo_id} on WooCommerce (${store.name})...`);
                    const res = await fetch(`${store.url}/wp-json/autodesign/v1/orders/${order.woo_id}/complete`, {
                        method: 'POST',
                        headers: {
                            'X-AutoDesign-Key': store.api_key,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!res.ok) {
                        const txt = await res.text();
                        console.error('Woo Plugin Error:', txt);
                    } else {
                        console.log('Woo Order Closed Successfully.');
                    }
                } catch (err) {
                    console.error('Failed to call Woo Plugin:', err);
                }
            }

            return NextResponse.json({ success: true, message: 'Objednávka bola označená ako vybavená.' });
        } catch (error) {
            console.error('Order Complete Error:', error);
            return NextResponse.json({ error: 'Failed to complete order' }, { status: 500 });
        }
    } catch (error) {
        console.error('Fatal API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
