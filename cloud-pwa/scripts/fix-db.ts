import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking for invalid template_keys in OrderItem...');

    const orderItems = await prisma.orderItem.findMany({
        where: {
            template_key: {
                not: null
            }
        },
        select: {
            id: true,
            template_key: true
        }
    });

    const templates = await prisma.templateConfig.findMany({
        select: { key: true }
    });

    const validKeys = new Set(templates.map(t => t.key));
    const invalidItems = orderItems.filter(item => item.template_key && !validKeys.has(item.template_key));

    console.log(`Found ${invalidItems.length} items with invalid template_key.`);

    for (const item of invalidItems) {
        console.log(`Fixing item ${item.id} (key: ${item.template_key}) -> null`);
        await prisma.orderItem.update({
            where: { id: item.id },
            data: { template_key: null }
        });
    }

    console.log('Done.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
