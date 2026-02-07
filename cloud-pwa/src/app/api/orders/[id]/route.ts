import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Detail objednávky s položkami
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const order = await prisma.order.findUnique({
            where: { id: id },
            include: {
                store: true,
                items: {
                    orderBy: { woo_item_id: 'asc' }
                }
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json(order);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
    }
}

// PUT: Update Order Item AI Data
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params; // Order ID (UUID)
        const body = await request.json();
        const { itemId, ai_data, status } = body;

        if (!itemId) {
            return NextResponse.json({ error: 'Missing itemId' }, { status: 400 });
        }

        const dataToUpdate: any = {};
        if (ai_data) dataToUpdate.ai_data = JSON.stringify(ai_data);
        if (status) dataToUpdate.status = status;

        const updatedItem = await prisma.orderItem.update({
            where: { id: itemId },
            data: dataToUpdate
        });

        return NextResponse.json(updatedItem);
    } catch (error) {
        console.error('Update item failed:', error);
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }
}
