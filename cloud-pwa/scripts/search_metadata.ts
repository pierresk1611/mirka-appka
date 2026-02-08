const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const allMetadata = await prisma.productMetadata.findMany({
        where: {
            csv_title: {
                contains: '2025_110',
                mode: 'insensitive'
            }
        }
    });

    console.log('Matching Metadata:', JSON.stringify(allMetadata, null, 2));
}

main();
