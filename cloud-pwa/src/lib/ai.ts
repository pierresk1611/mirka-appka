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
      1. Use SLOVAK language (slovenčina) for all extracted text.
      2. Standards for all printing templates:
         - "quote": Citát alebo úvodný text (e.g., "Dožiť sa radosti...").
         - "name_main": Hlavné mená (e.g., "Magduš a Janko").
         - "date_time": Dátum a čas udalosti (e.g., "25.4.2026 o 13:00").
         - "place": Miesto konania.
         - "body_full": Kompletný, krásne sformátovaný text celého oznámenia/pozvánky pripravený na tlač. Oprav preklepy, použi elegantné riadkovanie.
      
      3. For wedding templates ("WED_..."), put names of bride and groom in "name_main".
      4. For "FINGERPRINTS" (Odtlačkové obrazy), extract names and dates accurately.
      
      IMPORTANT: If the Template involves a specific design like "2025_110", strictly separate the quote from the names. 
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
