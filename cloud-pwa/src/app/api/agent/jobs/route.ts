import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: Agent si pýta prácu (Polling)
export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        const AGENT_SECRET = process.env.AGENT_SECRET_TOKEN || 'default_secret';

        if (authHeader !== `Bearer ${AGENT_SECRET}`) {
            if (process.env.NODE_ENV === 'production') {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        // 1. Find orders marked for generation
        const orders = await prisma.order.findMany({
            where: { status: 'GENERATING' },
            include: {
                store: true,
                items: {
                    where: { status: 'GENERATING' }
                }
            }
        });

        // Fetch all relevant template configs for these orders to get mappings
        const templateKeys = Array.from(new Set(orders.flatMap(o => o.items.map(i => i.template_key)).filter(k => k !== null)));
        const templateConfigs = await prisma.templateConfig.findMany({
            where: { key: { in: templateKeys as string[] } }
        });

        const mappingMap = new Map();
        templateConfigs.forEach(tc => {
            if (tc.mappings) mappingMap.set(tc.key, JSON.parse(tc.mappings));
        });

        // 2. Find templates allowed for scanning
        const templateJobs = await prisma.templateConfig.findMany({
            where: { status: 'SCANNING' }
        });

        // Format Jobs
        const formattedOrderJobs = orders.map(order => ({
            type: 'ORDER_BATCH',
            id: order.id,
            woo_id: order.woo_id,
            customer_name: order.customer_name,
            store_name: order.store.name,
            items: order.items.map(item => ({
                id: item.id,
                template_key: item.template_key,
                ai_data: item.ai_data ? JSON.parse(item.ai_data) : {},
                product_name: item.product_name_raw,
                mappings: item.template_key ? (mappingMap.get(item.template_key) || {}) : {}
            }))
        }));

        const formattedTemplateJobs = templateJobs.map(job => ({
            type: 'TEMPLATE_SCAN',
            id: job.key,
            template_key: job.key
        }));

        return NextResponse.json({ jobs: [...formattedOrderJobs, ...formattedTemplateJobs] });
    } catch (error) {
        console.error('Fetch jobs error:', error);
        return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }
}

// POST: Job completion or update from Agent
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { jobId, status, resultPath, error, type } = body;

        if (!jobId) {
            return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
        }

        if (type === 'ORDER_BATCH') {
            // Update Order status
            await prisma.order.update({
                where: { id: jobId },
                data: {
                    status: status === 'completed' ? 'COMPLETED' : 'ERROR',
                }
            });

            // Update all items of this order to match
            await prisma.orderItem.updateMany({
                where: { order_id: jobId, status: 'GENERATING' },
                data: {
                    status: status === 'completed' ? 'DONE' : 'ERROR'
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Job result update error:', err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
