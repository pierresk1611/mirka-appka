
import { PrismaClient } from '@prisma/client';
import iconv from 'iconv-lite';

const prisma = new PrismaClient();

function fixEncoding(str: string | null) {
    if (!str) return { result: null, reason: 'null_input' };
    try {
        const buffer = iconv.encode(str, 'win1250');
        const decoded = iconv.decode(buffer, 'utf8');

        // Safety check log
        if (decoded.includes('')) {
            return { result: null, reason: 'failed_safety_check', decoded };
        }
        return { result: decoded, reason: 'success' };
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
        console.log(`[TEMPLATE] Found: "${t.name}"`);
        const fix = fixEncoding(t.name);
        console.log(`[TEMPLATE] Fix Result:`, fix);
        if (fix.result && t.name !== fix.result) {
            console.log(`[TEMPLATE] WOULD UPDATE: yes`);
        } else {
            console.log(`[TEMPLATE] WOULD UPDATE: no`);
        }
    }

    // Check ProductMetadata
    const m = await prisma.productMetadata.findFirst({
        where: { csv_title: { contains: 'Pozv' } }
    });

    if (m) {
        console.log(`[METADATA] Found: "${m.csv_title}"`);
        const fix = fixEncoding(m.csv_title);
        console.log(`[METADATA] Fix Result:`, fix);
        if (fix.result && m.csv_title !== fix.result) {
            console.log(`[METADATA] WOULD UPDATE: yes`);
        } else {
            console.log(`[METADATA] WOULD UPDATE: no`);
        }
    }
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
