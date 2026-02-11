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
    // 1. OVERENIE TOKENU
    const auth = await authorizeRequest(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        // 2. PARSOVANIE VSTUPU (Očakáva kľúče: name, url, ck, cs)
        const { name, url, ck, cs } = await req.json();

        // 3. VALIDÁCIA VSTUPU
        if (!name || !url || !ck || !cs) {
            return NextResponse.json({ error: "Missing required fields: name, url, ck (consumer_key), or cs (consumer_secret)." }, { status: 400 });
        }

        // 4. ZÁPIS DO DB (Používa názvy stĺpcov z tvojho schema.prisma)
        const store = await prisma.store.create({
            data: {
                id: randomUUID(), // Používame UUID, ako si mal v pôvodnom kóde
                name,
                url,
                consumer_key: ck,
                consumer_secret: cs
            }
        });
        return NextResponse.json(store, { status: 201 }); // 201 Created

    } catch (e: any) {
        console.error("DB POST Error:", e);
        // Toto vráti chybu 500, ak zlyhá DB prístup alebo migrácia
        return NextResponse.json({ error: `Database Write Failed: ${e.message}` }, { status: 500 });
    }
}