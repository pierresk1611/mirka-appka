import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

export const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function parseOrderText(text: string, templateKey: string) {
    if (!openai) {
        console.warn('OpenAI API Key missing, returning mock data.');
        return mockParse(text, templateKey);
    }

    try {
        const prompt = `
      You are a professional copywriter and data extraction assistant for a printing company.
      Your goal is to extract structured data from the provided text and format it for high-quality printing.
      
      Template Key: "${templateKey}"
      Input Text: "${text}"
      
      Extraction Rules:
      1. Always provide a "body_full" field. This should be a beautifully formatted, complete version of the input text, suitable for printing on a single card. Fix typos, capitalize names, and use elegant spacing.
      2. If the Template Key is "BIR_PIVO" (Beer invitation), extract these specific fields:
         - "name_main": The name(s) of the person/people inviting.
         - "date": Date and time of the event.
         - "place": Location/Venue of the event.
      3. For "FINGERPRINTS" (Odtlačkové obrazy):
         - "name_main": Names of the couple or person.
         - "date": Event date.
         - "place": Event location.
      4. For wedding templates ("WED_..."):
         - "names": Names of the bridge and groom.
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
            parsed.body_full = text;
        }

        return parsed;

    } catch (error) {
        console.error('AI Processing Error:', error);
        return mockParse(text, templateKey); // Fallback
    }
}

function mockParse(text: string, templateKey: string) {
    // Simple heuristic fallback for development/testing without API key
    return {
        source: 'mock',
        name_main: 'MOCK NAME',
        date: '1.1.2026',
        place: 'Bratislava',
        body_full: text // Pass through text as fallback
    };
}
