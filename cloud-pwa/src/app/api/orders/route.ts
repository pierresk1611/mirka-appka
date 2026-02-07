import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        // Build filter
        const where: any = {};
        if (status) {
            where.status = status;
        }

        const orders = await prisma.order.findMany({
            where,
            orderBy: { created_at: 'desc' },
            include: {
                store: {
                    select: { name: true }
                },
                items: {
                    select: {
                        id: true,
                        product_name_raw: true,
                        template_key: true,
                        status: true
                    }
                }
            }
        });

        return NextResponse.json(orders);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
