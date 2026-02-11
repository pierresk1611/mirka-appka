import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Uisti sa, že cesta je správna
import { randomUUID } from 'crypto';



import { authorizeRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';


// --- GET (Načítanie uložených e-shopov) ---
export async function GET(req: Request) {
    // Odporúčam zabezpečiť aj GET, aby sa nedali čítať dáta bez autorizácie
    const auth = await authorizeRequest(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        // Očakáva, že model 'store' a 'createdAt' sú v poriadku
        const stores = await prisma.store.findMany({ orderBy: { createdAt: 'desc' } });
        return NextResponse.json(stores);
    } catch (e: any) {
        console.error("DB GET Error:", e);
        return NextResponse.json({ error: `Database Read Error: ${e.message}` }, { status: 500 });
    }
}

// --- POST (Uloženie nového e-shopu - Z Nastavení) ---
export async function POST(req: Request) {
    console.log("stores POST: Starting request processing...");

    // 1. OVERENIE TOKENU
    const auth = await authorizeRequest(req);
    if (!auth.ok) {
        console.error("stores POST: Auth failed", auth.error);
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        // 2. PARSOVANIE VSTUPU
        const body = await req.json();
        console.log("stores POST: Body received", JSON.stringify(body, null, 2));

        const { name, url, ck, cs } = body;

        // 3. VALIDÁCIA VSTUPU
        if (!name || !url || !ck || !cs) {
            console.error("stores POST: Missing fields", { name, url, ck: !!ck, cs: !!cs });
            return NextResponse.json({ error: "Missing required fields: name, url, ck (consumer_key), or cs (consumer_secret)." }, { status: 400 });
        }

        // 4. ZÁPIS DO DB
        console.log("stores POST: Creating DB record...");
        const store = await prisma.store.create({
            data: {
                id: randomUUID(),
                name,
                url,
                consumer_key: ck,
                consumer_secret: cs
            }
        });
        console.log("stores POST: Success", store.id);
        return NextResponse.json(store, { status: 201 });

    } catch (e: any) {
        console.error("DB POST Error:", e);
        return NextResponse.json({ error: `Database Write Failed: ${e.message}` }, { status: 500 });
    }
}