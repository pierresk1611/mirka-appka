import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import BIR_PIVO from '@/components/preview-templates/BIR_PIVO';

export const runtime = 'edge';

async function generatePreview(itemId: string) {
    // Fetch order item data
    const item = await prisma.orderItem.findUnique({
        where: { id: itemId }
    });

    if (!item || !item.ai_data) {
        throw new Error('Item not found or AI data missing');
    }

    const aiData = JSON.parse(item.ai_data);
    const templateKey = item.template_key;

    // Select template component based on template_key
    let TemplateComponent;
    switch (templateKey) {
        case 'BIR_PIVO':
            TemplateComponent = BIR_PIVO;
            break;
        default:
            // Fallback generic template
            TemplateComponent = BIR_PIVO; // TODO: Create generic template
    }

    // Generate image using @vercel/og
    return new ImageResponse(
        <TemplateComponent {...aiData} />,
        {
            width: 1200,
            height: 1600,
        }
    );
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
