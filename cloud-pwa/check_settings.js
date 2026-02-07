const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSettings() {
    const settings = await prisma.settings.findMany();
    console.log('--- SETTINGS ---');
    settings.forEach(s => {
        // Mask sensitive parts
        const val = s.key.includes('KEY') || s.key.includes('SECRET') || s.key.includes('CK') || s.key.includes('CS')
            ? s.value.substring(0, 4) + '...' + s.value.substring(s.value.length - 4)
            : s.value;
        console.log(`${s.key}: ${val}`);
    });
    await prisma.$disconnect();
}

checkSettings();
