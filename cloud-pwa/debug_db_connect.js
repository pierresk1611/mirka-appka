
const { PrismaClient } = require('@prisma/client');

async function main() {
    console.log('Testing DB Access...');
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: process.env.POSTGRES_URL,
            },
        },
    });

    try {
        console.log('Connecting...');
        const start = Date.now();
        await prisma.$connect();
        console.log(`Connected in ${Date.now() - start}ms`);

        const count = await prisma.store.count();
        console.log(`Store count: ${count}`);

        await prisma.$disconnect();
        console.log('Disconnected');
    } catch (e) {
        console.error('Connection failed:', e);
    }
}

main();
