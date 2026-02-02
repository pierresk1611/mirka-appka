import { NextResponse } from 'next/server';

// Mock Data Source - In production this would query WP or internal DB
let jobs = [
    {
        id: '1',
        orderId: '1001',
        productName: 'Svadobné oznámenie JSO 15',
        template: 'JSO_15',
        data: {
            'NAME_MAIN': 'Peter & Jana',
            'DATE_MAIN': '24.08.2026'
        },
        status: 'pending'
    },
    {
        id: '2',
        orderId: '1002',
        productName: 'Svadobné oznámenie WED 042',
        template: 'WED_042',
        data: {
            'NAME_MAIN': 'Martin & Elena',
            'DATE_MAIN': '15.09.2026'
        },
        status: 'pending'
    }
];

export async function GET() {
    return NextResponse.json({
        success: true,
        count: jobs.length,
        jobs: jobs
    });
}

export async function POST(request: Request) {
    // Agent reports status updates here
    const body = await request.json();
    const { jobId, status, resultPath } = body;

    console.log(`Job ${jobId} update: ${status} (${resultPath})`);

    // Update mock status
    const jobIndex = jobs.findIndex(j => j.id === jobId);
    if (jobIndex > -1) {
        if (status === 'completed') {
            // Remove from queue or mark completed
            jobs.splice(jobIndex, 1);
        }
    }

    return NextResponse.json({ success: true });
}
