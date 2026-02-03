import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Detail objednávky
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const orderId = parseInt(id);

        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json(order);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
    }
}

// PUT: Update AI Data (Manuálny zásah operátora)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const orderId = parseInt(id);
        const body = await request.json();
        const { ai_data, status } = body;

        const dataToUpdate: any = {};
        if (ai_data) dataToUpdate.ai_data = JSON.stringify(ai_data); // Ensure stringified
        if (status) dataToUpdate.status = status;

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: dataToUpdate
        });

        return NextResponse.json(updatedOrder);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}
