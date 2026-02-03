import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT: Update užívateľa
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, email, role } = body;

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { name, email, role },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

// DELETE: Zmazanie užívateľa
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // Prevent deleting Super Admin (Mirka) - logic check can be improved with session auth later
        // For now, let's just check if it's NOT the seeded Super Admin if needed, or rely on Frontend logic.
        // In a real app, we check request.session.user.id !== id

        await prisma.user.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
