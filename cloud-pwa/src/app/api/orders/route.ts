import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const auth = await authorizeRequest(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const orders = await prisma.order.findMany({
            take: 50, // Increased limit
            orderBy: { createdAt: 'desc' },
            include: {  // Include store name
                store: {
                    select: { name: true }
                },
                items: true // Include items for dashboard
            }
        });
        return NextResponse.json(orders);
    } catch (error) {
        console.error("API Orders: Error", error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
