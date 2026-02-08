
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import iconv from 'iconv-lite';

export const dynamic = 'force-dynamic';

function fixEncoding(str: string | null): string | null {
    if (!str) return null;
    try {
        const buffer = iconv.encode(str, 'win1250');
        const decoded = iconv.decode(buffer, 'utf8');
        // Safety check: If the decoded string contains replacement characters (),
        // it means the "fix" destroyed valid characters.
        if (decoded.includes('')) return null;
        return decoded;
    } catch (e) {
        return str;
    }
}

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const dryRun = searchParams.get('dryRun') !== 'false'; // Default to true

        let fixedCount = 0;
        const log = [];
        const BATCH_SIZE = 50;

        // 1. Fix ProductMetadata
        let skip = 0;
        while (true) {
            const metadata = await prisma.productMetadata.findMany({
                take: BATCH_SIZE,
                skip: skip,
                orderBy: { id: 'asc' } // Stable ordering for pagination
            });

            if (metadata.length === 0) break;

            for (const item of metadata) {
                const fixedTitle = fixEncoding(item.csv_title);
                const fixedContent = fixEncoding(item.html_content);
                const fixedName = fixedTitle && item.csv_title !== fixedTitle;

                if (fixedName) {
                    log.push(`[METADATA] ${item.csv_title} -> ${fixedTitle}`);

                    if (!dryRun && fixedTitle) {
                        await prisma.productMetadata.update({
                            where: { id: item.id },
                            data: {
                                csv_title: fixedTitle,
                                html_content: fixedContent || item.html_content
                            }
                        });
                    }
                    fixedCount++;
                }
            }
            skip += BATCH_SIZE;
        }

        // 2. Fix Templates (name)
        // Scan all templates to be safe
        skip = 0;
        while (true) {
            const templates = await prisma.templateConfig.findMany({
                take: BATCH_SIZE,
                skip: skip,
                orderBy: { key: 'asc' }
            });

            if (templates.length === 0) break;

            for (const t of templates) {
                const fixedName = fixEncoding(t.name);
                if (t.name && fixedName && t.name !== fixedName) {
                    log.push(`[TEMPLATE] ${t.name} -> ${fixedName}`);
                    if (!dryRun) {
                        await prisma.templateConfig.update({
                            where: { key: t.key },
                            data: { name: fixedName }
                        });
                    }
                    fixedCount++;
                }
            }
            skip += BATCH_SIZE;
        }

        return NextResponse.json({
            success: true,
            dryRun,
            fixedCount,
            log
        });

    } catch (error: any) {
        console.error("Fix Encoding Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
