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

        // Update status to GENERATING
        // This implicitly signals the Local Agent (via GET /api/agent/jobs) to pick it up
        const updatedOrder = await prisma.order.update({
            where: { id: Number(orderId) },
            data: { status: 'GENERATING' }
        });

        return NextResponse.json({ success: true, order: updatedOrder });
    } catch (error) {
        console.error('Job Trigger Error:', error);
        return NextResponse.json({ error: 'Failed to trigger job' }, { status: 500 });
    }
}
