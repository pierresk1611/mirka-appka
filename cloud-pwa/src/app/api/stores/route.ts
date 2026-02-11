import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid'; // Ak nemáš uuid, Peter nech ho nainštaluje: npm install uuid

export async function GET() {
    try {
        const stores = await prisma.store.findMany({ orderBy: { createdAt: 'desc' } });
        return NextResponse.json(stores);
    } catch (err) {
        return NextResponse.json([]);
    }
}

export async function POST(req: Request) {
    try {
        const { name, url, ck, cs } = await req.json();
        
        console.log("POST API: Skúšam vytvoriť obchod:", name);

        const store = await prisma.store.create({
            data: {
                id: uuidv4(), // Ručne vygenerujeme ID, aby sme predišli chybám
                name: name,
                url: url,
                consumer_key: ck,
                consumer_secret: cs,
            }
        });

        console.log("POST API: Obchod vytvorený úspešne!");
        return NextResponse.json(store);
    } catch (error: any) {
        console.error("POST API ERROR:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}