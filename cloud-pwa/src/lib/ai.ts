import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

export const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function parseOrderText(text: string, templateKey: string, apiKeyOverride?: string) {
    const finalApiKey = apiKeyOverride || process.env.OPENAI_API_KEY;

    if (!finalApiKey) {
        console.warn('OpenAI API Key missing, returning mock data.');
        return mockParse(text, templateKey);
    }

    const openai = new OpenAI({ apiKey: finalApiKey });

    try {
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

        const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'gpt-4o',
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        const parsed = JSON.parse(content || '{}');

        // Ensure body_full exists as a fallback if AI missed it
        if (!parsed.body_full) {
            parsed.body_full = "Fallback: " + text.substring(0, 200) + '...';
        }

        return parsed;

    } catch (error: any) {
        console.error('--- AI Processing Error ---');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Message:', error.message);
        }
        return mockParse(text, templateKey); // Fallback
    }
}

function mockParse(text: string, templateKey: string) {
    // Better heuristic for mock summary
    let summary = text;

    // If it looks like EPO data, we can try to extract the core text
    const lines = text.split('\n');
    const interestingLines = lines.filter(l =>
        l.toLowerCase().includes('text') ||
        l.toLowerCase().includes('meno') ||
        l.toLowerCase().includes('datum') ||
        l.toLowerCase().includes('poznámka')
    );

    if (interestingLines.length > 0) {
        summary = interestingLines.join('\n');
    }

    return {
        source: 'mock',
        name_main: 'MOCK NAME (AI Error)',
        date: '---',
        place: '---',
        body_full: "CHYBA AI EXTRAKCIE. ZOBRAZUJEM PÔVODNÝ TEXT:\n\n" + summary
    };
}
