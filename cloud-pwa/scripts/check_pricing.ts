const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const item = await prisma.orderItem.findFirst({
        where: { order: { woo_id: 3432 } },
        include: {
            template: {
                include: {
                    product_metadata: true
                }
            }
        }
    });

    console.log('Item:', item.product_name_raw);
    console.log('Template Key:', item.template_key);
    console.log('Template Pricing:', item.template?.pricing_json);
    console.log('Metadata Pricing:', item.template?.product_metadata?.pricing_json);
}

main();
