
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    const strictId = "2025_110";
    console.log(`Checking for template key: ${strictId}`);

    const template = await prisma.templateConfig.findUnique({
        where: { key: strictId }
    });

    if (template) {
        console.log("Template Found:", template);
    } else {
        console.log("Template NOT Found in DB.");
    }

    // Also check if any template has this name
    const namedTemplate = await prisma.templateConfig.findFirst({
        where: { name: { contains: strictId } }
    });
    if (namedTemplate) {
        console.log("Template with matching NAME (but different key?):", namedTemplate);
    }

    // Check the Order Item
    const orderItemName = "Pozvánka na oslavu 70. narodenín 2025_110";
    console.log(`\nSimulating matching for: "${orderItemName}"`);

    // Simple regex simulation (matching what I suspect is in the code)
    const yearRegex = /202[4-9]_(\d+)/;
    const match = orderItemName.match(yearRegex);
    if (match) {
        console.log(`Regex Matches: ${match[0]}`);
    } else {
        console.log("Regex did NOT match.");
    }
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
