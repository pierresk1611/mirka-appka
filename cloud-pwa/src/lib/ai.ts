import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

export const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function parseOrderText(text: string, templateKey: string, apiKeyOverride?: string) {
    const finalApiKey = apiKeyOverride || process.env.OPENAI_API_KEY;

    if (!finalApiKey) {
        console.warn('OpenAI API Key missing, returning mock data.');
        return mockParse(text, templateKey);
    }

    try {
        const openaiInstance = new OpenAI({ apiKey: finalApiKey });

        const prompt = `
      You are a professional copywriter and data extraction assistant for a printing company.
      Your goal is to extract structured data from the provided text and format it for high-quality printing.
      
      Template Key: "${templateKey}"
      Input Text: "${text}"
      
      Extraction Rules:
      1. Always provide a "body_full" field. This should be a beautifully formatted, complete version of the invitation or card text, suitable for printing. Fix typos, capitalize names, and use elegant spacing.
      2. If the Template Key is "BIR_PIVO" (Beer invitation), extract these specific fields:
         - "name_main": The name(s) of the person/people inviting.
         - "date": Date and time of the event.
         - "place": Location/Venue of the event.
      3. For "FINGERPRINTS" (Odtlačkové obrazy):
         - "name_main": Names of the couple or person.
         - "date": Event date.
         - "place": Event location.
      4. For wedding templates ("WED_..."):
         - "names": Names of the bride and groom.
         - "date": Wedding date and time.
      
      Output ONLY a valid JSON object.
    `;

        const completion = await openaiInstance.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'gpt-4o',
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        const parsed = JSON.parse(content || '{}');

        // Ensure body_full exists as a fallback if AI missed it
        if (!parsed.body_full) {
            parsed.body_full = "Fallback: " + text.substring(0, 300) + '...';
        }

        return parsed;

    } catch (error: any) {
        const errorMsg = error.message || String(error);
        console.error('--- AI Processing Error ---');
        console.error(errorMsg);

        return mockParse(text, templateKey, errorMsg);
    }
}

function mockParse(text: string, templateKey: string, errorMsg?: string) {
    // Better heuristic for mock summary
    let summary = text;

    // Extract key lines
    const lines = text.split('\n');
    const filteredLines = lines.filter(l => {
        const lower = l.toLowerCase();
        return lower.includes(':') && (
            lower.includes('text') ||
            lower.includes('meno') ||
            lower.includes('datum') ||
            lower.includes('dátum') ||
            lower.includes('miesto') ||
            lower.includes('poznámka') ||
            lower.includes('_tm')
        );
    });

    if (filteredLines.length > 0) {
        summary = filteredLines.join('\n');
    }

    return {
        source: 'mock',
        name_main: 'CHYBA EXTRAKCIE',
        date: '---',
        place: '---',
        body_full: `CHYBA AI: ${errorMsg || 'Neznáma chyba'}\n\nZOBRAZUJEM PÔVODNÝ TEXT (VÝCUC):\n\n${summary}`
    };
}
