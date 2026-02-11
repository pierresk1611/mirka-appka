import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const auth = await authorizeRequest(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const templates = await prisma.templateConfig.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(templates);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }
}
