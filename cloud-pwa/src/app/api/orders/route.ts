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
                        status: true,
                        quantity: true,
                        preview_url: true,
                        format: true,
                        material: true,
                        sku: true,
                        product_metadata: {
                            select: {
                                id: true,
                                pricing_json: true,
                                image_url: true,
                                csv_title: true,
                                sku: true
                            }
                        },
                        template: {
                            select: {
                                pricing_json: true,
                                product_metadata: {
                                    select: {
                                        pricing_json: true,
                                        image_url: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json(orders);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
