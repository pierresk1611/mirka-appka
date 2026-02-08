import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

        for (const template of templates) {
            if (!template.files) continue;

            try {
                const files: string[] = JSON.parse(template.files);
                const key = template.key.toLowerCase();

                // 2. Search for a file that contains the template key
                // Priority: .psd, then .ai
                const psdMatch = files.find(f => f.toLowerCase().includes(key) && f.toLowerCase().endsWith('.psd'));
                const aiMatch = files.find(f => f.toLowerCase().includes(key) && f.toLowerCase().endsWith('.ai'));

                const bestMatch = psdMatch || aiMatch;

                if (bestMatch) {
                    await prisma.templateConfig.update({
                        where: { key: template.key },
                        data: {
                            main_file: bestMatch,
                            status: 'READY' // Upgrade status if linked
                        }
                    });
                    linkedCount++;
                }
            } catch (e) {
                console.error(`Failed to parse files for template ${template.key}:`, e);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Automatické párovanie dokončené. Spárovaných: ${linkedCount} šablón.`,
            linkedCount
        });

    } catch (error: any) {
        console.error('Auto-Link Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
