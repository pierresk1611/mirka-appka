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
        console.log('Testing Dropbox with path:', dropboxPath);

        // 1. Recursive Search for PSD and AI files
        // We look for files, then group them by their parent folder.
        let allEntries: any[] = [];
        try {
            const response = await dbx.filesListFolder({
                path: dropboxPath,
                recursive: true,
                include_non_downloadable_files: false
            });
            allEntries = response.result.entries;

            // Handle pagination if many files
            let hasMore = response.result.has_more;
            let cursor = response.result.cursor;
            while (hasMore) {
                const moreRes = await dbx.filesListFolderContinue({ cursor });
                allEntries = [...allEntries, ...moreRes.result.entries];
                hasMore = moreRes.result.has_more;
                cursor = moreRes.result.cursor;
            }
        } catch (dbxErr: any) {
            // Log the entire error object to the server console as requested
            console.error('[Dropbox SDK Error Deep Log]', JSON.stringify(dbxErr, null, 2));

            return NextResponse.json({
                error: 'Dropbox API Error',
                status: dbxErr.status || 502,
                details: dbxErr.error?.error_summary || dbxErr.message || 'Unknown error',
                error_tag: dbxErr.error?.['.tag'] || 'unknown',
                raw_error: dbxErr.error || dbxErr, // Return raw error for debugging
                path_sent: dropboxPath
            }, { status: dbxErr.status || 502 });
        }

        // 2. Filter and Group by Folder
        const templateGroups: Record<string, { path: string, assetFiles: string[] }> = {};
        const ignorePatterns = ['OLD', 'ZALOHA', 'NA_OPRAVU', 'BACKUP'];

        allEntries.forEach(entry => {
            if (entry['.tag'] !== 'file') return;

            const fileName = entry.name;
            const filePath = entry.path_lower || '';
            const isAsset = fileName.endsWith('.psd') || fileName.endsWith('.ai');

            if (!isAsset) return;

            // Check ignore patterns in the full path
            const shouldIgnore = ignorePatterns.some(p => filePath.toUpperCase().includes(p));
            if (shouldIgnore) return;

            // Get parent folder path and name
            const pathParts = filePath.split('/');
            pathParts.pop(); // remove file name
            const folderPath = pathParts.join('/');
            const folderName = pathParts[pathParts.length - 1] || 'root';

            if (!templateGroups[folderName]) {
                templateGroups[folderName] = { path: folderPath, assetFiles: [] };
            }
            templateGroups[folderName].assetFiles.push(entry.path_display || entry.path_lower);
        });

        if (isTest) {
            return NextResponse.json({
                success: true,
                count: Object.keys(templateGroups).length,
                message: `Scanner found ${Object.keys(templateGroups).length} potential templates.`
            });
        }

        // 3. Upsert to DB with Heuristics
        const results = [];
        for (const [folderName, info] of Object.entries(templateGroups)) {
            // Heuristic for picking the main file:
            // 1. Shortest name often means "oznamenie.psd" vs "oznamenie_final_v2_edit.psd"
            // 2. Contains "oznamenie"
            let mainFile = info.assetFiles[0];
            let shortestLen = info.assetFiles[0].length;

            info.assetFiles.forEach(f => {
                const name = f.split('/').pop()?.toLowerCase() || '';
                if (name.includes('oznamenie') || name.includes('final')) {
                    mainFile = f;
                } else if (f.length < shortestLen) {
                    mainFile = f;
                    shortestLen = f.length;
                }
            });

            const template = await prisma.templateConfig.upsert({
                where: { key: folderName },
                update: {
                    folder_path: info.path,
                    files: JSON.stringify(info.assetFiles),
                    // Only update main_file if it's currently NULL to avoid overwriting Mirka's manual choice
                    ...(await prisma.templateConfig.findUnique({ where: { key: folderName } })?.main_file ? {} : { main_file: mainFile })
                },
                create: {
                    key: folderName,
                    name: folderName.replace(/_/g, ' '), // Pre-fill name as readable alias
                    folder_path: info.path,
                    main_file: mainFile,
                    files: JSON.stringify(info.assetFiles),
                    status: 'NEW'
                }
            });
            results.push(template.key);
        }

        return NextResponse.json({
            success: true,
            count: results.length,
            message: `Import dokončený. Spracovaných ${results.length} šablón.`
        });

    } catch (error: any) {
        console.error('[Dropbox Scanner Fatal Error]', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message || String(error)
        }, { status: 500 });
    }
}
