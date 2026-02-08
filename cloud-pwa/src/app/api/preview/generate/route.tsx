import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import BIR_PIVO from '@/components/preview-templates/BIR_PIVO';

// Note: Removed 'edge' runtime because Prisma requires Node.js runtime

async function generatePreview(itemId: string) {
    console.log(`[Preview] Starting generation for ${itemId}`);

    // Fetch order item data
    let item;
    try {
        item = await prisma.orderItem.findUnique({
            where: { id: itemId },
            include: { template: true }
        });
    } catch (dbError: any) {
        console.error(`[Preview] DB Error: ${dbError.message}`);
        throw new Error(`Database error: ${dbError.message}`);
    }

    if (!item) {
        console.error(`[Preview] Item not found: ${itemId}`);
        throw new Error('Item not found');
    }

    if (!item.ai_data) {
        console.error(`[Preview] AI data missing for: ${itemId}`);
        throw new Error('AI data missing');
    }

    let aiData;
    try {
        aiData = JSON.parse(item.ai_data);
    } catch (parseError: any) {
        console.error(`[Preview] JSON Parse Error for ${itemId}: ${parseError.message}`);
        throw new Error(`AI data parse error: ${parseError.message}`);
    }

    const templateKey = item.template_key;
    console.log(`[Preview] Using template: ${templateKey}`);

    // Select template component based on template_key
    // For now, only BIR_PIVO is implemented
    let TemplateComponent = BIR_PIVO;

    try {
        console.log(`[Preview] Creating ImageResponse for ${itemId}`);
        return new ImageResponse(
            (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#1a1a1a',
                    padding: '80px',
                    color: '#f5e6d3',
                }}>
                    <TemplateComponent {...aiData} />
                </div>
            ),
            {
                width: 1200,
                height: 1600,
            }
        );
    } catch (genError: any) {
        console.error(`[Preview] Generation Loop Error: ${genError.message}`);
        // Fallback to a very simple image if the component fails
        return new ImageResponse(
            (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'white',
                    padding: '40px',
                    fontSize: '40px'
                }}>
                    <h1>Preview Error</h1>
                    <p>Item: {item.product_name_raw}</p>
                    <p>Error: {genError.message}</p>
                </div>
            ),
            { width: 800, height: 600 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const itemId = searchParams.get('itemId');

        if (!itemId) {
            return new Response('Missing itemId', { status: 400 });
        }

        return await generatePreview(itemId);
    } catch (error: any) {
        console.error('Preview generation failed:', error);
        return new Response(error.message, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { itemId } = await req.json();

        if (!itemId) {
            return new Response('Missing itemId', { status: 400 });
        }

        return await generatePreview(itemId);
    } catch (error: any) {
        console.error('Preview generation failed:', error);
        return new Response(error.message, { status: 500 });
    }
}
