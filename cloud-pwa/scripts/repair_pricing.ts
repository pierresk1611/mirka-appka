const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting Pricing Data Repair ---');

    // 1. Get all templates that lack pricing
    const templates = await prisma.templateConfig.findMany({
        where: {
            OR: [
                { pricing_json: null },
                { product_metadata_id: null }
            ]
        }
    });

    console.log(`Found ${templates.length} templates to check.`);

    let linkedCount = 0;

    for (const template of templates) {
        // Search for metadata by key, prioritizing those with pricing
        const metadata = await prisma.productMetadata.findFirst({
            where: {
                csv_title: {
                    contains: template.key,
                    mode: 'insensitive'
                }
            },
            orderBy: [
                { pricing_json: 'desc' }, // Not-nulls first in Prisma order (usually)
                { createdAt: 'desc' }
            ]
        });

        if (metadata && metadata.pricing_json) {
            console.log(`Linking Template [${template.key}] -> Metadata [${metadata.csv_title}] (ID: ${metadata.id})`);
            await prisma.templateConfig.update({
                where: { key: template.key },
                data: {
                    product_metadata_id: metadata.id,
                }
            });
            linkedCount++;
        } else if (metadata) {
            // Still link it if we found metadata even without pricing, 
            // but only if we don't have a link already.
            if (!template.product_metadata_id) {
                console.log(`Linking Template [${template.key}] -> Metadata [${metadata.csv_title}] (NO PRICING)`);
                await prisma.templateConfig.update({
                    where: { key: template.key },
                    data: {
                        product_metadata_id: metadata.id,
                    }
                });
                linkedCount++;
            }
        }
    }

    console.log(`--- Finished Repair: Linked ${linkedCount} templates ---`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
