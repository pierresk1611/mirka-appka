import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const stores = await prisma.store.findMany({ orderBy: { createdAt: 'desc' } });
        return NextResponse.json(stores);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: Request) {
    try {
        const { name, url, ck, cs } = await req.json();
        const store = await prisma.store.create({
            data: { id: randomUUID(), name, url, consumer_key: ck, consumer_secret: cs }
        });
        return NextResponse.json(store);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}