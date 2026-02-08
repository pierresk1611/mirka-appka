import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * Normalizes a string for comparison:
 * 1. Lowercase
 * 2. Removes all non-alphanumeric characters (spaces, dashes, underscores)
 */
function normalize(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function POST() {
    try {
        // 1. Build a "Global File Universe" from all templates that have files
        const templatesWithFiles = await prisma.templateConfig.findMany({
            where: { files: { not: null } },
            select: { files: true }
        });

        const globalFileSet = new Set<string>();
        templatesWithFiles.forEach(t => {
            if (t.files) {
                try {
                    const parsed = JSON.parse(t.files);
                    if (Array.isArray(parsed)) {
                        parsed.forEach(f => globalFileSet.add(f));
                    }
                } catch (e) { }
            }
        });

        const allAvailableFiles = Array.from(globalFileSet);
        console.log(`Auto-Link: Global File Universe built with ${allAvailableFiles.length} unique files.`);

        // 2. Fetch all templates that need a main_file
        const templatesToLink = await prisma.templateConfig.findMany({
            where: {
                main_file: null
            }
        });

        let linkedCount = 0;
        const debugLogs: string[] = [];
        const sampleSize = 10;
        let loggedSampleCount = 0;

        // 3. Match against Global Universe
        for (const template of templatesToLink) {
            const rawKey = template.key;
            const normalizedKey = normalize(rawKey);

            if (!normalizedKey) continue;

            let bestMatch: string | null = null;
            const extensions = ['.psd', '.ai', '.pdf'];

            for (const ext of extensions) {
                const match = allAvailableFiles.find(f => {
                    const filename = path.basename(f);
                    const normalizedFilename = normalize(filename);
                    return normalizedFilename.includes(normalizedKey) && f.toLowerCase().endsWith(ext);
                });

                if (match) {
                    bestMatch = match;
                    break;
                }
            }

            if (bestMatch) {
                await prisma.templateConfig.update({
                    where: { key: template.key },
                    data: {
                        main_file: bestMatch,
                        status: 'READY'
                    }
                });
                linkedCount++;
            } else if (loggedSampleCount < sampleSize) {
                debugLogs.push(`Template Key: "${rawKey}" (Normalized: "${normalizedKey}") -> Žiadna zhoda v universe (${allAvailableFiles.length} súborov)`);
                loggedSampleCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Automatické párovanie dokončené (Global Match). Spárovaných: ${linkedCount} šablón.`,
            linkedCount,
            totalFilesScanned: allAvailableFiles.length,
            debugLogs: linkedCount === 0 ? debugLogs : []
        });

    } catch (error: any) {
        console.error('Auto-Link Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
