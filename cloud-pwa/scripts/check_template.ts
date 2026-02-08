const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const template = await prisma.templateConfig.findUnique({
        where: { key: '2025_110' },
        include: { product_metadata: true }
    });

    console.log('Template:', template.key);
    console.log('Metadata ID:', template.product_metadata_id);
    console.log('Metadata Title:', template.product_metadata?.csv_title);
    console.log('Metadata Pricing:', template.product_metadata?.pricing_json);
}

main();
