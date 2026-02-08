
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log("Checking DB for 2025_110...");
    const results = await prisma.templateConfig.findMany({
        where: {
            OR: [
                { key: { contains: '2025_110' } },
                { name: { contains: '2025_110' } },
                { key: { contains: '2025' } } // Broader search
            ]
        }
    });
    console.log("Found:", results.map(t => ({ key: t.key, name: t.name, verified: t.is_verified })));
}

check()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
