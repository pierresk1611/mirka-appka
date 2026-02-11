import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { authorizeRequest } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const auth = await authorizeRequest(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true
            }
        });
        return NextResponse.json(users);
    } catch (error) {
        console.error('Fetch users error:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const auth = await authorizeRequest(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const body = await request.json();
        const { name, email, password, role } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password_hash,
                role: role || 'OPERATOR'
            }
        });

        // Remove hash from response
        const { password_hash: _, ...userWithoutPassword } = user;

        return NextResponse.json(userWithoutPassword);
    } catch (error: any) {
        console.error('Create user error:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const auth = await authorizeRequest(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const body = await request.json();
        const { id, status, role } = body;

        if (!id) return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });

        const updateData: any = {};
        if (status) updateData.status = status;
        if (role) updateData.role = role;

        const user = await prisma.user.update({
            where: { id },
            data: updateData
        });

        // Remove hash from response
        const { password_hash: _, ...userWithoutPassword } = user;

        return NextResponse.json(userWithoutPassword);
    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}
