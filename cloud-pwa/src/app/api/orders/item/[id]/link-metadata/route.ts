import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const { metadataId } = await request.json();

        if (!metadataId) {
            return NextResponse.json({ error: 'Missing metadataId' }, { status: 400 });
        }

        const updatedItem = await prisma.orderItem.update({
            where: { id: params.id },
            data: {
                product_metadata_id: metadataId
            }
        });

        return NextResponse.json({ success: true, item: updatedItem });
    } catch (error) {
        console.error('Failed to link metadata:', error);
        return NextResponse.json({ error: 'Failed to link metadata' }, { status: 500 });
    }
}
