
import { PrismaClient } from '@prisma/client';
import iconv from 'iconv-lite';

const prisma = new PrismaClient();

function fixEncoding(str: string | null) {
    if (!str) return { result: null, reason: 'null_input' };
    try {
        const buffer = iconv.encode(str, 'win1250');
        const decoded = iconv.decode(buffer, 'utf8');

        const hasReplacement = decoded.includes('');

        if (!hasReplacement) return { result: decoded, reason: 'success' };

        if (decoded.length < str.length) return { result: decoded, reason: 'success_length_reduced' };

        return { result: null, reason: 'failed_safety_check', decoded };
    } catch (e: any) {
        return { result: null, reason: 'error: ' + e.message };
    }
}

async function run() {
    console.log("Searching for 'Pozv'...");

    // Check TemplateConfig
    const t = await prisma.templateConfig.findFirst({
        where: { name: { contains: 'Pozv' } }
    });

    if (t) {
        console.log(`[TEMPLATE] Found Key: "${t.key}"`);
        console.log(`[TEMPLATE] Found Name: "${t.name}"`);
        const fix = fixEncoding(t.name).result;
        if (fix && fix !== t.name) {
            console.log(`[TEMPLATE] FIXING: "${fix}"`);
            await prisma.templateConfig.update({
                where: { key: t.key },
                data: { name: fix }
            });
            console.log("[TEMPLATE] FIXED!");
        } else {
            console.log("[TEMPLATE] No fix needed or safety check failed.");
        }
    } else {
        console.log("[TEMPLATE] No template found with 'Pozv' in name");
    }

    // Check ProductMetadata
    const m = await prisma.productMetadata.findFirst({
        where: { csv_title: { contains: 'Pozv' } }
    });

    if (m) {
        console.log(`[METADATA] Found Title: "${m.csv_title}"`);
        const fix = fixEncoding(m.csv_title).result;
        const fixContent = fixEncoding(m.html_content).result;

        if (fix && fix !== m.csv_title) {
            console.log(`[METADATA] FIXING: "${fix}"`);
            await prisma.productMetadata.update({
                where: { id: m.id },
                data: {
                    csv_title: fix,
                    html_content: fixContent || m.html_content
                }
            });
            console.log("[METADATA] FIXED!");
        } else {
            console.log("[METADATA] No fix needed or safety check failed.");
        }
    } else {
        console.log("[METADATA] No metadata found with 'Pozv' in title");
    }
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
