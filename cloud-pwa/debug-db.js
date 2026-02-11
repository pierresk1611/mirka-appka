
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Connecting to DB...");
        console.log("DATABASE_URL present:", !!process.env.PRISMA_DATABASE_URL);

        // Attempt to count stores to verify connection and table existence
        const count = await prisma.store.count();
        console.log("Connection SUCCESS. Number of stores:", count);

        // Check if we can write
        console.log("Attempting test write...");
        /* 
        // Uncomment to test write
        const store = await prisma.store.create({
            data: {
                 name: "Test Store",
                 url: "https://example.com",
                 consumer_key: "test",
                 consumer_secret: "test"
            }
        });
        console.log("Write SUCCESS:", store.id);
        await prisma.store.delete({ where: { id: store.id } });
        */

    } catch (e) {
        console.error("CONNECTION FAILED:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
