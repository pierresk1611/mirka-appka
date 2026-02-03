import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

        // Find orders allowed for generation
        const jobs = await prisma.order.findMany({
            where: { status: 'GENERATING' },
            select: {
                id: true,
                template_key: true,
                ai_data: true,
                // In real app, we might return S3/Dropbox URLs for assets here
            }
        });

        // Parse AI Data for Agent convenience
        const formattedJobs = jobs.map(job => ({
            ...job,
            ai_data: job.ai_data ? JSON.parse(job.ai_data) : {}
        }));

        return NextResponse.json({ jobs: formattedJobs });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }
}
