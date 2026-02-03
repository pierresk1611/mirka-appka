import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// MOCK DATA for demonstration if no Woo credentials
const MOCK_WOO_ORDERS = [
    {
        id: 41777,
        billing: { first_name: 'Jozef', last_name: 'Novák', email: 'jozef@example.com' },
        line_items: [{ name: 'Svadobné Oznámenie - FINGERPRINTS (V1)', meta_data: [] }],
        customer_note: 'Prosím o zmenu dátumu na 15.09.2026',
        date_created: new Date().toISOString(),
    },
    {
        id: 41778,
        billing: { first_name: 'Mária', last_name: 'Kováčová', email: 'maria@example.com' },
        line_items: [{ name: 'Etiketa na víno - WED_042', meta_data: [] }],
        customer_note: 'Mená: Mária & Peter',
        date_created: new Date().toISOString(),
    }
];

export async function POST() {
    try {
        // 1. Fetch Settings (Woo Credentials)
        // In real app: const wooUrl = await prisma.settings.findUnique({ where: { key: 'WOO_URL' } });
        // For now, we use Mock logic or Env vars

        // Simulating Woo Fetch
        console.log('Fetching orders from WooCommerce...');
        const orders = MOCK_WOO_ORDERS;

        const result = {
            added: 0,
            updated: 0,
            errors: 0
        };

        for (const order of orders) {
            try {
                // 2. Identify Template Key
                const productName = order.line_items[0]?.name || '';
                let templateKey = 'UNKNOWN';
                if (productName.includes('FINGERPRINTS')) templateKey = 'FINGERPRINTS';
                if (productName.includes('WED_')) {
                    const match = productName.match(/(WED_\d+)/);
                    if (match) templateKey = match[1];
                }

                // 3. AI Parsing (Mock)
                // In real app: Call OpenAI here
                const aiData = {
                    name_main: `${order.billing.first_name} & Partner`,
                    date: "15.09.2026",
                    place: "Dóm sv. Alžbety",
                    body_text: order.customer_note || "Default text..."
                };

                // 4. Upsert Order to DB
                await prisma.order.upsert({
                    where: { id: order.id },
                    update: {
                        // Update mutable fields if needed
                        status: 'AI_READY' // Reset status on sync? Or keep existing? Let's assume sync brings new info.
                    },
                    create: {
                        id: order.id,
                        customer_name: `${order.billing.first_name} ${order.billing.last_name}`,
                        template_key: templateKey,
                        source_text: order.customer_note || JSON.stringify(order.line_items),
                        ai_data: JSON.stringify(aiData),
                        status: 'AI_READY',
                        created_at: new Date(order.date_created)
                    }
                });

                result.added++;
            } catch (err) {
                console.error(`Error processing order ${order.id}:`, err);
                result.errors++;
            }
        }

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error('Sync failed:', error);
        return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
    }
}
