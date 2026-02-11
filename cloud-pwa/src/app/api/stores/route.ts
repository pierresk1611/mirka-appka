import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const stores = await prisma.store.findMany();
        return NextResponse.json(stores);
    } catch (err) {
        return NextResponse.json([]);
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("LOG: Prijaté dáta pre nový store:", body);

        // Vytvorenie záznamu v DB
        const store = await prisma.store.create({
            data: {
                name: body.name,
                url: body.url,
                consumer_key: body.ck,
                consumer_secret: body.cs,
            }
        });

        console.log("LOG: Store úspešne vytvorený v DB:", store.id);
        return NextResponse.json(store);
    } catch (error: any) {
        console.error("LOG: CRITICAL ERROR V API STORES:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}