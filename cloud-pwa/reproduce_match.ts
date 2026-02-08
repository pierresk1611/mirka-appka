
import { extractTemplateId } from './src/lib/utils';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
    const productName = "Pozvánka na oslavu 70. narodenín 2025_110";
    console.log(`Testing product name: "${productName}"`);

    const extracted = extractTemplateId(productName);
    console.log(`Extracted ID: ${extracted}`);

    if (extracted) {
        console.log(`Searching DB for template containing "${extracted}"...`);
        const template = await prisma.templateConfig.findFirst({
            where: {
                OR: [
                    { key: { contains: extracted } },
                    { name: { contains: extracted } }
                ]
            }
        });
        if (template) {
            console.log("✅ Template FOUND:", template.key);
        } else {
            console.log("❌ Template NOT FOUND in DB.");

            // List some templates to see what's there
            const all = await prisma.templateConfig.findMany({ take: 5 });
            console.log("Sample templates in DB:", all.map(t => t.key));
        }
    } else {
        console.log("❌ Failed to extract ID.");
    }
}

test()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
