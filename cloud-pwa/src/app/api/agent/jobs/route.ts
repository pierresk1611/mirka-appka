import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: Agent si pýta prácu (Polling)
export async function GET(request: Request) {
    try {
        // Check Agent Secret (Simple Auth)
        const authHeader = request.headers.get('authorization');
        const AGENT_SECRET = process.env.AGENT_SECRET_TOKEN || 'default_secret'; // Should be in env

        if (authHeader !== `Bearer ${AGENT_SECRET}`) {
            // Allow dev mode bypass if needed, but strictly enforce in prod
            if (process.env.NODE_ENV === 'production') {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        // 1. Find orders allowed for generation
        const orderJobs = await prisma.order.findMany({
            where: { status: 'GENERATING' },
            select: {
                id: true,
                template_key: true,
                ai_data: true,
            }
        });

        // 2. Find templates allowed for scanning
        const templateJobs = await prisma.templateConfig.findMany({
            where: { status: 'SCANNING' },
            select: {
                key: true,
                // manifest is what we want to update, but maybe we don't send it? or we send key.
            }
        });

        // Format Jobs
        const formattedOrderJobs = orderJobs.map(job => ({
            type: 'ORDER_GENERATE',
            id: job.id,
            template_key: job.template_key,
            ai_data: job.ai_data ? JSON.parse(job.ai_data) : {},
        }));

        const formattedTemplateJobs = templateJobs.map(job => ({
            type: 'TEMPLATE_SCAN',
            id: job.key, // Use key as ID for template jobs
            template_key: job.key
        }));

        return NextResponse.json({ jobs: [...formattedOrderJobs, ...formattedTemplateJobs] });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }
}

// POST: Vytvorenie jobu (UI -> Frontend trigger)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
        }

        // Update status to GENERATING triggers the agent to pick it up
        const updatedOrder = await prisma.order.update({
            where: { id: Number(orderId) },
            data: { status: 'GENERATING' }
        });

        return NextResponse.json({ success: true, order: updatedOrder });
    } catch (error) {
        console.error('Job Create Error:', error);
        return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
    }
}
