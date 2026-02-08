
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import iconv from 'iconv-lite';

export const dynamic = 'force-dynamic';

function fixEncoding(str: string | null): string | null {
    if (!str) return null;
    try {
        // The error was: UTF-8 file (e.g. "á" = C3 A1) was read as if it were Win1250.
        // Resulting in "Ăˇ" (C3 -> Ă, A1 -> ˇ).
        // To fix: 
        // 1. Encode back to Buffer using Win1250 ("Ăˇ" -> C3 A1)
        // 2. Decode this Buffer using UTF-8 (C3 A1 -> "á")

        const buffer = iconv.encode(str, 'win1250');
        return iconv.decode(buffer, 'utf8');
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

        // 1. Fix ProductMetadata
        const metadata = await prisma.productMetadata.findMany();

        for (const item of metadata) {
            const fixedTitle = fixEncoding(item.csv_title);
            const fixedContent = fixEncoding(item.html_content);
            const fixedName = item.csv_title !== fixedTitle;

            if (fixedName) {
                log.push(`[METADATA] ${item.csv_title} -> ${fixedTitle}`);

                if (!dryRun && fixedTitle) {
                    await prisma.productMetadata.update({
                        where: { id: item.id },
                        data: {
                            csv_title: fixedTitle,
                            html_content: fixedContent
                        }
                    });
                }
                fixedCount++;
            }
        }

        // 2. Fix Templates (name)
        // Scan all templates to be safe, as old imports might not have is_in_eshop set
        const templates = await prisma.templateConfig.findMany();

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

        return NextResponse.json({
            success: true,
            dryRun,
            fixedCount,
            log
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
