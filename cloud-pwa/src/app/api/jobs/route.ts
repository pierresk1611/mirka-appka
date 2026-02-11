import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const jobs = await prisma.job.findMany({
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'asc' }
        });

        return NextResponse.json({
            success: true,
            count: jobs.length,
            jobs: jobs
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Handle both creation and updates
        if (body.type && !body.jobId) {
            // 1. CREATE NEW JOB
            const job = await prisma.job.create({
                data: {
                    type: body.type,
                    payload: body.payload ? JSON.stringify(body.payload) : null,
                    template_key: body.templateKey,
                    woo_id: body.wooId,
                    status: 'PENDING'
                }
            });
            return NextResponse.json({ success: true, job });
        } else if (body.jobId) {
            // 2. UPDATE EXISTING JOB (Agent callback)
            const { jobId, status, resultPath, error } = body;

            const updatedJob = await prisma.job.update({
                where: { id: jobId },
                data: {
                    status: status.toUpperCase(),
                    result_path: resultPath,
                    error_message: error
                }
            });

            return NextResponse.json({ success: true, job: updatedJob });
        }

        return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
