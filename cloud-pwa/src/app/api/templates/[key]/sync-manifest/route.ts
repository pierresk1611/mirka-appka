import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Dropbox } from 'dropbox';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ key: string }> }
) {
    try {
        const { key } = await params;

        // 1. Fetch Template and Dropbox Token
        const [template, tokenSetting] = await Promise.all([
            prisma.templateConfig.findUnique({ where: { key } }),
            prisma.settings.findUnique({ where: { key: 'DROPBOX_ACCESS_TOKEN' } })
        ]);

        if (!template || !template.folder_path) {
            return NextResponse.json({ error: 'Template or folder path missing' }, { status: 404 });
        }

        const accessToken = tokenSetting?.value;
        if (!accessToken) {
            return NextResponse.json({ error: 'Dropbox Token missing' }, { status: 400 });
        }

        // 2. Construct Manifest
        // Using existing manifest or creating new one from mappings
        let manifest: any = {};
        try {
            manifest = JSON.parse(template.manifest || '{}');
        } catch (e) { }

        // Update manifest with current mappings and main file
        manifest.key = template.key;
        manifest.name = template.name || template.key;
        manifest.main_file = template.main_file?.split('/').pop();
        manifest.mappings = template.mappings ? JSON.parse(template.mappings) : {};

        // 3. Write to Dropbox
        const dbx = new Dropbox({ accessToken });
        const filePath = `${template.folder_path}/manifest.json`;

        console.log(`Syncing manifest to Dropbox: ${filePath}`);

        await dbx.filesUpload({
            path: filePath,
            contents: JSON.stringify(manifest, null, 2),
            mode: { '.tag': 'overwrite' }
        });

        // 4. Update status in DB
        await prisma.templateConfig.update({
            where: { key },
            data: {
                manifest: JSON.stringify(manifest),
                status: 'READY'
            }
        });

        return NextResponse.json({ success: true, path: filePath });

    } catch (error: any) {
        console.error('Manifest sync failed:', error);
        return NextResponse.json({
            error: 'Failed to sync to Dropbox',
            details: error.error?.error_summary || error.message
        }, { status: 502 });
    }
}
