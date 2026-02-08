
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    console.log("Checking all OrderItems for template_key...");

    const items = await prisma.orderItem.findMany({
        select: { id: true, product_name_raw: true, template_key: true }
    });

    const nullKeys = items.filter(i => i.template_key === null).length;
    const nonNullKeys = items.filter(i => i.template_key !== null).length;

    console.log(`Total items: ${items.length}`);
    console.log(`Null keys: ${nullKeys}`);
    console.log(`Non-null keys: ${nonNullKeys}`);

    if (nonNullKeys > 0) {
        console.log("\nSample non-null keys:");
        items.filter(i => i.template_key !== null).slice(0, 5).forEach(i => {
            console.log(`- Item ${i.id}: Key="${i.template_key}" for "${i.product_name_raw}"`);
        });
    }

    console.log("\nChecking TemplateConfig keys for whitespace/hidden chars...");
    const templates = await prisma.templateConfig.findMany({
        where: { key: { contains: '2025_110' } },
        select: { key: true, name: true }
    });

    templates.forEach(t => {
        console.log(`Key: [${t.key}] (Length: ${t.key.length})`);
        for (let i = 0; i < t.key.length; i++) {
            console.log(`  char[${i}]: ${t.key.charCodeAt(i)} ('${t.key[i]}')`);
        }
    });
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
