import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: Fetch all settings
export async function GET() {
    try {
        const settings = await prisma.settings.findMany();
        // Convert array to object { key: value }
        const settingsMap = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
        return NextResponse.json(settingsMap);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

// POST: Update settings
export async function POST(request: Request) {
    try {
        const body = await request.json(); // Expect { key: "WOO_KEY", value: "..." } or Array

        // Handle single or bulk update
        const updates = Array.isArray(body) ? body : [body];

        for (const { key, value } of updates) {
            await prisma.settings.upsert({
                where: { key },
                update: { value },
                create: { key, value }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
