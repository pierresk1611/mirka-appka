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
      You are a smart data extraction assistant.
      Extract structured data from the following text based on the Template Key: "${templateKey}".
      
      Text: "${text}"
      
      Output JSON only. Use the following keys based on the template:
      - For "FINGERPRINTS": { name_main, date, place, body_full }
      - For "WED_...": { names, date }
      - Default: { summary }
    `;

        const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'gpt-4o',
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        return JSON.parse(content || '{}');

    } catch (error) {
        console.error('AI Processing Error:', error);
        return mockParse(text, templateKey); // Fallback
    }
}

function mockParse(text: string, templateKey: string) {
    // Simple heuristic fallback
    return {
        source: 'mock',
        name_main: 'MOCK NAME',
        body_full: text.substring(0, 50) + '...'
    };
}
