import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const stores = await prisma.store.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(stores);
}

export async function POST(req: Request) {
    try {
        const { name, url, ck, cs } = await req.json();
        const store = await prisma.store.create({
            data: {
                name,
                url,
                consumer_key: ck,
                consumer_secret: cs,
            }
        });
        return NextResponse.json(store);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}