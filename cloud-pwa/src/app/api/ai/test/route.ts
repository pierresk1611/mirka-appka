import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { provider, apiKey } = await req.json();

        if (!apiKey) {
            return NextResponse.json({ success: false, error: 'Chýba kľúč' }, { status: 400 });
        }

        let response;
        if (provider === 'openai') {
            // Skutočný test voči OpenAI (pýtame sa na zoznam modelov)
            response = await fetch('https://api.openai.com/v1/models', {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
        } else if (provider === 'groq') {
            // Skutočný test voči Groq
            response = await fetch('https://api.groq.com/openai/v1/models', {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
        } else {
            return NextResponse.json({ success: false, error: 'Neznámy poskytovateľ' });
        }

        if (response.ok) {
            return NextResponse.json({ success: true });
        } else {
            const errData = await response.json();
            return NextResponse.json({ success: false, error: errData.error?.message || 'Neplatný kľúč' });
        }

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}