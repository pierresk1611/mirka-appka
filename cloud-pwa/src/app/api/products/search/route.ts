import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
        return NextResponse.json([]);
    }

    const results = await prisma.productMetadata.findMany({
        where: {
            OR: [
                { csv_title: { contains: q, mode: 'insensitive' } },
                { sku: { contains: q, mode: 'insensitive' } }
            ]
        },
        take: 20,
        select: {
            id: true,
            csv_title: true,
            sku: true,
            pricing_json: true
        }
    });

    return NextResponse.json(results);
}
