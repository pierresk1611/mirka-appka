
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function extractTemplateId(text: string): string | null {
    const regex = /(202[4-9])_(\d+)/;
    const match = text.match(regex);
    if (match) return match[0];
    return null;
}

function matchTemplateSimple(productName: string): string {
    const normalized = productName.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const strictId = extractTemplateId(productName);
    if (strictId) return strictId;

    if (normalized.includes('pivo')) return 'BIR_PIVO';
    if (normalized.includes('svadobn') || normalized.includes('wedding')) return 'WED_BASIC';
    if (normalized.includes('odtlac')) return 'FINGERPRINTS';

    return 'UNKNOWN';
}

async function run() {
    console.log("Starting repair of OrderItem template matching...");

    const items = await prisma.orderItem.findMany({
        where: {
            OR: [
                { template_key: null },
                { template_key: 'UNKNOWN' }
            ]
        }
    });

    console.log(`Found ${items.length} items to potentially repair.`);

    let repairedCount = 0;

    for (const item of items) {
        let matchedKey = matchTemplateSimple(item.product_name_raw);
        const strictId = extractTemplateId(item.product_name_raw);

        if (strictId) {
            // Find template that matches strict ID
            const strictMatch = await prisma.templateConfig.findFirst({
                where: {
                    OR: [
                        { key: { contains: strictId } },
                        { name: { contains: strictId } }
                    ]
                }
            });

            if (strictMatch) {
                matchedKey = strictMatch.key;
            } else {
                // If strict ID was found in text but no template exists in DB, 
                // DON'T set it to the strict ID (would break FK), fallback to simple matching
                matchedKey = 'UNKNOWN';
            }
        }

        // Final safety Check: If we found a key, does it actually exist in TemplateConfig?
        if (matchedKey && matchedKey !== 'UNKNOWN') {
            const exists = await prisma.templateConfig.findUnique({
                where: { key: matchedKey }
            });

            if (exists) {
                console.log(`Repairing Item ${item.id}: "${item.product_name_raw}" -> ${matchedKey}`);
                await prisma.orderItem.update({
                    where: { id: item.id },
                    data: {
                        template_key: matchedKey,
                        status: 'AI_READY'
                    }
                });
                repairedCount++;
            } else {
                console.log(`Skipping Item ${item.id}: Key "${matchedKey}" not found in TemplateConfig.`);
            }
        }
    }

    console.log(`\nRepair completed. Repaired ${repairedCount} items.`);
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
