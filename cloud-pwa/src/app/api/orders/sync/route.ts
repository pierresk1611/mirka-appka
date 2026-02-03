import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow longer timeout for sync

export async function POST() {
    try {
        // 1. Credentials
        const wooUrl = process.env.WOO_URL;
        const wooKey = process.env.WOO_API_KEY;

        if (!wooUrl || !wooKey) {
            console.warn('Missing WOO_URL or WOO_API_KEY. Using Mock Data.');
        }

        let orders: any[] = [];

        if (wooUrl && wooKey) {
            console.log(`Fetching orders from ${wooUrl}...`);
            try {
                const res = await fetch(`${wooUrl}/wp-json/autodesign/v1/orders`, {
                    headers: {
                        'X-AutoDesign-Key': wooKey
                    },
                    cache: 'no-store'
                });

                if (!res.ok) {
                    const txt = await res.text();
                    console.error('Woo API Error:', res.status, txt);
                    throw new Error(`Woo API returned ${res.status}`);
                }

                const data = await res.json();
                if (data.status === 'success' && Array.isArray(data.orders)) {
                    orders = data.orders;
                } else {
                    console.error('Invalid Woo Response:', data);
                }
            } catch (e) {
                console.error('Fetch failed:', e);
                // Return 502 to indicate upstream error, or fall back to empty?
                // Let's return error so user knows connection failed
                return NextResponse.json({ error: 'Failed to connect to WooCommerce. Check URL/Key.' }, { status: 502 });
            }
        } else {
            // Keep Mock for dev if env missing
            orders = [
                {
                    order_id: 99999,
                    status: 'processing',
                    billing: { first_name: 'MOCK', last_name: 'USER', email: 'mock@test.com' },
                    items: [{ product_name: 'Svadobné Oznámenie - FINGERPRINTS', template_key: 'FINGERPRINTS', meta: { note: 'Mock Data' } }]
                }
            ];
        }

        const result = { added: 0, updated: 0, errors: 0 };

        for (const order of orders) {
            try {
                // Map Plugin Data structure to Prisma
                const id = order.order_id;
                const customerName = `${order.billing.first_name} ${order.billing.last_name}`;

                // Construct Source Text from items
                const sourceText = JSON.stringify(order.items, null, 2);

                // Determine Main Template (first found)
                const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
                const templateKey = firstItem?.template_key || 'UNKNOWN';

                // Status remains AI_READY
                await prisma.order.upsert({
                    where: { id: id },
                    update: {},
                    create: {
                        id: id,
                        customer_name: customerName,
                        template_key: templateKey,
                        source_text: sourceText,
                        // AI Data is initially null, to be processed by /api/ai/process
                        status: 'AI_READY',
                        created_at: new Date()
                    }
                });

                result.added++;
            } catch (err) {
                console.error(`Error processing order ${order.order_id}:`, err);
                result.errors++;
            }
        }

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error('Sync failed:', error);
        return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
    }
}
