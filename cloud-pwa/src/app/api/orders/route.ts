import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


export async function GET(request: Request) {
    try {
        console.log("API Orders: Fetching from DB...");
        const orders = await prisma.order.findMany({
            take: 20,
            orderBy: { date_created: 'desc' }
        });
        console.log("API Orders: Data sent!");
        return NextResponse.json(orders);
    } catch (error) {
        console.log("API Orders: Error", error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
