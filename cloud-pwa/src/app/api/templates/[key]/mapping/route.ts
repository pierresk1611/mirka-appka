import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeRequest } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
    const auth = await authorizeRequest(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const { key } = await params;
        const config = await prisma.templateConfig.findUnique({
            where: { key }
        });
        return NextResponse.json(config);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(request: Request, { params }: { params: Promise<{ key: string }> }) {
    const auth = await authorizeRequest(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const { key } = await params;
        const body = await request.json();
        const { mappings } = body;

        const updated = await prisma.templateConfig.upsert({
            where: { key },
            update: { mappings: JSON.stringify(mappings) },
            create: {
                key,
                manifest: '{}',
                mappings: JSON.stringify(mappings)
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Save mapping failed:', error);
        return NextResponse.json({ error: 'Failed to save mapping' }, { status: 500 });
    }
}
