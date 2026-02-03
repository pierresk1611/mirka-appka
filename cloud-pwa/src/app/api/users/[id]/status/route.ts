import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH: Zmena statusu
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        if (!['ACTIVE', 'INACTIVE'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { status },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}
