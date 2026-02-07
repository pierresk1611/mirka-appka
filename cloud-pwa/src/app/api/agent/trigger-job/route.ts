import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
        }

        // Update Order status to GENERATING
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status: 'GENERATING' }
        });

        // ALSO update all associated items to GENERATING
        await prisma.orderItem.updateMany({
            where: { order_id: orderId },
            data: { status: 'GENERATING' }
        });

        return NextResponse.json({ success: true, order: updatedOrder });
    } catch (error) {
        console.error('Job Trigger Error:', error);
        return NextResponse.json({ error: 'Failed to trigger job' }, { status: 500 });
    }
}
