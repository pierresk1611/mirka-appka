import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Dropbox } from 'dropbox';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const tokenQuery = searchParams.get('token');
        const pathQuery = searchParams.get('path');
        const isTest = searchParams.get('test') === 'true';

        // 1. Get Access Token (prefer query param for testing)
        let accessToken = tokenQuery;
        if (!accessToken) {
            const setting = await prisma.settings.findUnique({
                where: { key: 'DROPBOX_ACCESS_TOKEN' }
            });
            accessToken = setting?.value ?? null;
        }

        if (!accessToken) {
            console.warn('Missing DROPBOX_ACCESS_TOKEN');
            return NextResponse.json({ error: 'Missing Dropbox Token', templates: [] }, { status: 400 });
        }

        // 2. Get Root Path (prefer query param for testing)
        let dropboxPath = pathQuery;
        if (dropboxPath === null) {
            const pathSetting = await prisma.settings.findUnique({
                where: { key: 'DROPBOX_PATH' }
            });
            dropboxPath = pathSetting?.value?.trim() || '';
        } else {
            dropboxPath = dropboxPath.trim();
        }

        // Fix: If user enters a local Mac path like /Users/apple/Dropbox/TEMPLATES, 
        // we strip the prefix to make it a valid Dropbox cloud path.
        if (dropboxPath.includes('Dropbox/')) {
            dropboxPath = '/' + dropboxPath.split('Dropbox/')[1];
        }

        // Dropbox API: Root is represented by an empty string, not "/"
        if (dropboxPath === '/') dropboxPath = '';
        if (dropboxPath.startsWith('/') && dropboxPath.length > 1) {
            // Keep it as is for subfolders, but ensure no trailing slash
            if (dropboxPath.endsWith('/')) dropboxPath = dropboxPath.slice(0, -1);
        }

        const dbx = new Dropbox({ accessToken });
        let folders: any[] = [];

        try {
            console.log(`Listing folders in Dropbox: ${dropboxPath}`);
            const response = await dbx.filesListFolder({ path: dropboxPath });
            // Filter only folders
            folders = response.result.entries.filter(entry => entry['.tag'] === 'folder');
        } catch (dbxErr: any) {
            console.error('Dropbox API Error:', dbxErr);
            const errorMsg = dbxErr.error?.error_summary || dbxErr.message || 'Unknown Dropbox Error';
            return NextResponse.json({
                error: 'Failed to fetch from Dropbox. Check Token and Path.',
                details: errorMsg,
                raw: dbxErr
            }, { status: 502 });
        }

        if (isTest) {
            return NextResponse.json({
                success: true,
                count: folders.length,
                message: 'Connection successful'
            });
        }

        // 3. Sync to DB (TemplateConfig)
        const syncedTemplates = [];
        for (const folder of folders) {
            const templateKey = folder.name; // ID according to folder name

            // Check if exists
            const existing = await prisma.templateConfig.findUnique({
                where: { key: templateKey }
            });

            if (!existing) {
                // Create new template entry
                await prisma.templateConfig.create({
                    data: {
                        key: templateKey,
                        manifest: '{}' // Empty manifest initially
                    }
                });
                syncedTemplates.push({ key: templateKey, status: 'NEW' });
            } else {
                syncedTemplates.push({ key: templateKey, status: 'EXISTING' });
            }
        }

        return NextResponse.json({
            success: true,
            count: folders.length,
            synced: syncedTemplates,
            raw: folders
        });

    } catch (error) {
        console.error('Dropbox Sync Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
