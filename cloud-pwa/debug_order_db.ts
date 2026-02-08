
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    const wooId = 3432;
    console.log(`Checking DB for WooCommerce Order #${wooId}...`);

    const order = await prisma.order.findFirst({
        where: { woo_id: wooId },
        include: {
            items: {
                include: {
                    template: true
                }
            }
        }
    });

    if (!order) {
        console.log("Order NOT found in DB.");
        return;
    }

    console.log(`PWA Order ID: ${order.id}`);
    console.log(`Customer: ${order.customer_name}`);
    console.log(`Items found: ${order.items.length}`);

    order.items.forEach((item, i) => {
        console.log(`\n--- Item ${i + 1} ---`);
        console.log(`ID: ${item.id}`);
        console.log(`Name: ${item.product_name_raw}`);
        console.log(`Template Key: ${item.template_key}`);
        console.log(`Status: ${item.status}`);
        console.log(`AI Data Length: ${item.ai_data ? item.ai_data.length : 0}`);
        console.log(`Template in DB? ${item.template ? 'YES' : 'NO'}`);
        if (item.template) {
            console.log(`Template Name: ${item.template.name}`);
        }
    });
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
