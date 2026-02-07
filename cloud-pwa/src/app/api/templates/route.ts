import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const templates = await prisma.templateConfig.findMany({
            orderBy: { created_at: 'desc' }
        });
        return NextResponse.json(templates);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }
}
