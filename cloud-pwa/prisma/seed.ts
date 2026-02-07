import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // Seed default settings if they don't exist
    await prisma.settings.upsert({
        where: { key: 'SHEET_SIZE' },
        update: {},
        create: {
            key: 'SHEET_SIZE',
            value: 'SRA3'
        }
    });

    console.log('Seed: Default settings created.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
