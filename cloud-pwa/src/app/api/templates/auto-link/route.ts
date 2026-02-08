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
        // 1. Fetch all templates that don't have a main_file set
        const templates = await prisma.templateConfig.findMany({
            where: {
                main_file: null,
                files: { not: null }
            }
        });

        let linkedCount = 0;
        const debugLogs: string[] = [];
        const sampleSize = 10;
        let loggedSampleCount = 0;

        for (const template of templates) {
            if (!template.files) continue;

            try {
                const files: string[] = JSON.parse(template.files);
                const rawKey = template.key;
                const normalizedKey = normalize(rawKey);

                if (!normalizedKey) continue;

                // 2. Search for a file with improved matching
                let bestMatch: string | null = null;

                // Priority groups: .psd, then .ai, then .pdf
                const extensions = ['.psd', '.ai', '.pdf'];

                for (const ext of extensions) {
                    const match = files.find(f => {
                        const filename = path.basename(f);
                        const normalizedFilename = normalize(filename);
                        // Fuzzy check: is the normalized key anywhere in the normalized filename?
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
                    // Log samples for debugging if no match found
                    debugLogs.push(`Template Key: "${rawKey}" (Normalized: "${normalizedKey}") -> Available files (sample): ${files.slice(0, 3).map(f => path.basename(f)).join(', ')}`);
                    loggedSampleCount++;
                }
            } catch (e) {
                console.error(`Failed to parse files for template ${template.key}:`, e);
            }
        }

        // Final log if everything failed
        if (linkedCount === 0 && debugLogs.length > 0) {
            console.log("=== AUTO-LINK DEBUG LOG ===");
            debugLogs.forEach(log => console.log(log));
            console.log("===========================");
        }

        return NextResponse.json({
            success: true,
            message: `Automatické párovanie dokončené. Spárovaných: ${linkedCount} šablón.`,
            linkedCount,
            debugLogs: linkedCount === 0 ? debugLogs : []
        });

    } catch (error: any) {
        console.error('Auto-Link Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
