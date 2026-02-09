import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ itemId: string }> }
) {
    try {
        const { itemId } = await params;

        if (!itemId) {
            return NextResponse.json({ error: 'Missing itemId' }, { status: 400 });
        }

        // Update item status to READY_FOR_PRINT
        const updatedItem = await prisma.orderItem.update({
            where: { id: itemId },
            data: { status: 'READY_FOR_PRINT' }
        });

        // TODO: Trigger Local Agent job for PDF/X-1a export
        // This will be handled by the Local Agent polling /api/agent/jobs

        return NextResponse.json({
            success: true,
            item: updatedItem,
            message: 'Item marked as ready for print. Local Agent will process PDF export.'
        });
    } catch (error) {
        console.error('Generate final data failed:', error);
        return NextResponse.json(
            { error: 'Failed to generate final data' },
            { status: 500 }
        );
    }
}
