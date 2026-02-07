import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const stores = await prisma.store.findMany({
            orderBy: { created_at: 'desc' }
        });
        return NextResponse.json(stores);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, url, consumer_key, consumer_secret, api_key } = body;

        if (!name || !url || !consumer_key || !consumer_secret) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const store = await prisma.store.create({
            data: {
                name,
                url,
                consumer_key,
                consumer_secret,
                api_key
            }
        });

        return NextResponse.json(store);
    } catch (error) {
        console.error('Failed to create store:', error);
        return NextResponse.json({ error: 'Failed to create store' }, { status: 500 });
    }
}
