
import { PrismaClient } from '@prisma/client';
import iconv from 'iconv-lite';

const prisma = new PrismaClient();

function getHex(str: string) {
    return Array.from(str).map(c => 'U+' + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' ');
}

function debugFix(str: string) {
    try {
        const buffer = iconv.encode(str, 'win1250');
        const decoded = iconv.decode(buffer, 'utf8');
        return { original: str, fixed: decoded, buffer: buffer.toString('hex') };
    } catch (e: any) {
        return { error: e.message };
    }
}

async function run() {
    console.log("Searching for 'Pozv'...");

    // Find template with corrupted name
    const t = await prisma.templateConfig.findFirst({
        where: { name: { contains: 'Pozv' } }
    });

    if (t) {
        console.log(`Found Template: "${t.name}"`);
        console.log(`Is In Eshop: ${t.is_in_eshop}`);
        console.log(`Hex Codes: ${getHex(t.name || '')}`);

        console.log('--- Attempting Fix ---');
        console.log(debugFix(t.name || ''));
    } else {
        console.log("No template found matching 'Pozv'");
    }

    // Also check ProductMetadata
    const m = await prisma.productMetadata.findFirst({
        where: { csv_title: { contains: 'Pozv' } }
    });

    if (m) {
        console.log(`Found Metadata: "${m.csv_title}"`);
        console.log(`Hex Codes: ${getHex(m.csv_title)}`);

        console.log('--- Attempting Fix ---');
        console.log(debugFix(m.csv_title));
    }
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
