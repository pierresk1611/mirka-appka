import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ key: string }> }
) {
    try {
        const { key } = await params;
        const template = await prisma.templateConfig.findUnique({
            where: { key }
        });

        if (!template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        return NextResponse.json(template);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ key: string }> }
) {
    try {
        const { key } = await params;
        const body = await request.json();
        const { name, main_file, status, mappings } = body;

        const updated = await prisma.templateConfig.update({
            where: { key },
            data: {
                name,
                main_file,
                status,
                mappings: mappings ? JSON.stringify(mappings) : undefined
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Update template failed:', error);
        return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }
}
