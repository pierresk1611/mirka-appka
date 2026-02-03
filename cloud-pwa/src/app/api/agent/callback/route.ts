import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST: Agent hlási výsledok (Callback)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { order_id, status, preview_url, log } = body;

        if (!order_id || !status) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Update local DB
        const updatedOrder = await prisma.order.update({
            where: { id: order_id },
            data: {
                status: status, // DONE / ERROR
                preview_url: preview_url,
                agent_log: log ? JSON.stringify(log) : undefined
            }
        });

        // If DONE, trigger WooCommerce completion (Mocked for now)
        if (status === 'DONE') {
            // await markWooOrderCompleted(order_id);
            console.log(`Order ${order_id} marked as COMPLETED in WooCommerce (Mock).`);
        }

        return NextResponse.json({ success: true, order: updatedOrder });

    } catch (error) {
        return NextResponse.json({ error: 'Callback failed' }, { status: 500 });
    }
}
