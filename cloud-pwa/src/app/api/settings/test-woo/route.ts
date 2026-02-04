import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Allow testing passed keys OR database keys
        let { wooUrl, wooCk, wooCs } = body;

        if (!wooUrl || !wooCk || !wooCs) {
            // Try fetching from DB if not provided in body (for checking existing conn)
            const settings = await prisma.settings.findMany({
                where: { key: { in: ['WOO_URL', 'WOO_CK', 'WOO_CS'] } }
            });
            wooUrl = wooUrl || settings.find(s => s.key === 'WOO_URL')?.value;
            wooCk = wooCk || settings.find(s => s.key === 'WOO_CK')?.value;
            wooCs = wooCs || settings.find(s => s.key === 'WOO_CS')?.value;
        }

        if (!wooUrl || !wooCk || !wooCs) {
            return NextResponse.json({ error: 'Missing Credentials' }, { status: 400 });
        }

        const WooCommerce = new WooCommerceRestApi({
            url: wooUrl,
            consumerKey: wooCk,
            consumerSecret: wooCs,
            version: "wc/v3"
        });

        // Test connection by fetching system status or 1 order
        console.log(`Testing connection to ${wooUrl}...`);

        try {
            await WooCommerce.get("system_status");
            return NextResponse.json({ success: true, message: 'Connection Successful' });
        } catch (e: any) {
            console.error('Test failed:', e.response ? e.response.data : e.message);
            return NextResponse.json({
                success: false,
                error: 'Connection Failed',
                details: e.response ? e.response.data : e.message
            }, { status: 400 });
        }

    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
