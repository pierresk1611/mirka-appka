import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

export const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function parseOrderText(text: string, templateKey: string, apiKeyOverride?: string) {
    const finalApiKey = apiKeyOverride || process.env.OPENAI_API_KEY;

    if (!finalApiKey) {
        console.warn('Groq/AI API Key missing, returning mock data.');
        return mockParse(text, templateKey);
    }

    try {
        // Groq uses the same OpenAI SDK, just different baseURL and model
        const groqInstance = new OpenAI({
            apiKey: finalApiKey,
            baseURL: 'https://api.groq.com/openai/v1'
        });

        const prompt = `
      You are a professional copywriter and data extraction assistant for a printing company.
      Your goal is to extract structured data from the provided text and format it for high-quality printing.
      
      Template Key: "${templateKey}"
      Input Text: "${text}"
      
      Extraction Rules:
      1. Use SLOVAK language (slovenčina) for all extracted text and the "body_full" field.
      2. Always provide a "body_full" field. This should be a beautifully formatted, complete version of the invitation or card text, suitable for printing. Fix typos, capitalize names, and use elegant spacing.
      3. If the Template Key is "BIR_PIVO" (Beer invitation), extract these specific fields:
         - "name_main": The name(s) of the person/people inviting (e.g., "Marian Hamšík").
         - "date": Date and time of the event (e.g., "11.04.2026 o 12:00").
         - "place": Location/Venue of the event.
      4. For "FINGERPRINTS" (Odtlačkové obrazy):
         - "name_main": Names of the couple or person.
         - "date": Event date.
         - "place": Event location.
      5. For wedding templates ("WED_..."):
         - "names": Names of the bride and groom.
         - "date": Wedding date and time.
      
      IMPORTANT: If the input text is messy, do your best to reconstruct the human message in Slovak. 
      Output ONLY a valid JSON object.
    `;

        const completion = await groqInstance.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
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
        console.error('--- AI Processing Error (Groq) ---');
        console.error(errorMsg);

        return mockParse(text, templateKey, errorMsg);
    }
}

function mockParse(text: string, templateKey: string, errorMsg?: string) {
    // Better heuristic for mock summary
    const lines = text.split('\n');
    const filteredLines = lines.filter(l => {
        const lower = l.toLowerCase();
        // Keep lines that look like user content or important options
        // But skip the raw JSON metadata lines in the summary
        if (lower.startsWith('_tm') || lower.startsWith('gtm4wp')) return false;

        return lower.includes(':') && (
            lower.includes('text') ||
            lower.includes('meno') ||
            lower.includes('datum') ||
            lower.includes('dátum') ||
            lower.includes('miesto') ||
            lower.includes('poznámka') ||
            lower.includes('produkt')
        );
    });

    const summary = filteredLines.length > 0 ? filteredLines.join('\n') : "Obsah sa nepodarilo automaticky vyextrahovať.";

    return {
        source: 'mock',
        name_main: 'CHYBA EXTRAKCIE',
        date: '---',
        place: '---',
        body_full: `CHYBA AI (Groq): ${errorMsg || 'Neznáma chyba'}\n\nUpozornenie: Skontrolujte si Groq API kľúč a limity.\n\nZOBRAZUJEM PÔVODNÝ TEXT:\n\n${summary}`
    };
}
