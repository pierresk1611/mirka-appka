import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Skúsime vytiahnuť obchody
        const stores = await prisma.store.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(stores || []);
    } catch (error: any) {
        console.error("STORES API ERROR:", error);
        // Aj pri chybe vrátime prázdne pole, aby UI nezamrzlo
        return NextResponse.json([], { status: 200 }); 
    }
}