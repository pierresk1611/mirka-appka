import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ key: string }> }) {
    try {
        const { key } = await params;
        const decodedKey = decodeURIComponent(key);

        // Update status to SCANNING
        const updated = await prisma.templateConfig.update({
            where: { key: decodedKey },
            data: { status: 'SCANNING' }
        });

        return NextResponse.json({ success: true, template: updated });
    } catch (error) {
        console.error('Template Scan Trigger Error:', error);
        return NextResponse.json({ error: 'Failed to trigger scan' }, { status: 500 });
    }
}
