import { NextResponse } from 'next/server';
import { parseOrderText } from '@/lib/ai';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { text, templateKey } = body;

        if (!text) {
            return NextResponse.json({ error: 'Missing text' }, { status: 400 });
        }

        const start = Date.now();
        const aiData = await parseOrderText(text, templateKey || 'UNKNOWN');
        const duration = Date.now() - start;

        return NextResponse.json({
            success: true,
            data: aiData,
            meta: { duration, model: process.env.OPENAI_API_KEY ? 'gpt-4o' : 'mock' }
        });

    } catch (error) {
        return NextResponse.json({ error: 'AI Processing Failed' }, { status: 500 });
    }
}
