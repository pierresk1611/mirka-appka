import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const itemId = formData.get('itemId') as string;
        const file = formData.get('file') as File;

        if (!itemId || !file) {
            return NextResponse.json({ error: 'Missing itemId or file' }, { status: 400 });
        }

        // Save file to public directory
        const publicDir = path.join(process.cwd(), 'public', 'previews');
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }

        const fileName = `${itemId}_${Date.now()}.png`;
        const filePath = path.join(publicDir, fileName);
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, buffer);

        const previewUrl = `/previews/${fileName}`;

        // Update OrderItem with preview URL
        await prisma.orderItem.update({
            where: { id: itemId },
            data: {
                preview_url: previewUrl,
                status: 'GENERATED'
            }
        });

        return NextResponse.json({ success: true, previewUrl });
    } catch (error: any) {
        console.error('Preview upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
