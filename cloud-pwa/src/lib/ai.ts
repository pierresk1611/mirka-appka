import OpenAI from 'openai';

// Initialize OpenAI client
// Note: In a real app, use environment variables. 
// For this demo/codebase, we assume OPENAI_API_KEY is present in .env.local
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'mock_key_for_build',
    dangerouslyAllowBrowser: true // Only if running client-side, but better server-side
});

export interface ParsedData {
    NAME_MAIN?: string;
    DATE_MAIN?: string;
    TIME_MAIN?: string;
    PLACE_MAIN?: string;
    QUOTE_TOP?: string;
    BODY_TEXT?: string;
    BODY_FULL?: string;
    [key: string]: string | undefined;
}

export async function parseCustomerText(text: string, templateType: string = 'wedding'): Promise<ParsedData> {
    // If no key is configured, return mock data
    if (!process.env.OPENAI_API_KEY) {
        console.warn('OpenAI API Key missing. Returning mock data.');
        return {
            NAME_MAIN: 'Peter & Jana (Mock)',
            DATE_MAIN: '01.01.2027',
            BODY_FULL: text
        };
    }

    const systemPrompt = `
    You are an expert typography assistant for a print shop.
    Your goal is to extract structured data from unstructured customer text for a ${templateType} invitation.
    
    Output JSON format with keys:
    - NAME_MAIN: The main names (e.g., "Peter & Jana")
    - DATE_MAIN: The date of the event
    - TIME_MAIN: The time of the event
    - PLACE_MAIN: The location/venue
    - QUOTE_TOP: Any quote or poem at the top
    - BODY_TEXT: The main body text excluding names/date/place if possible
    - BODY_FULL: The entire text formatted nicely with line breaks (\n)
    
    If a field is missing, omit it.
    Preserve grammar and capitalization exactly as in the user text, but fix obvious typos if requested.
  `;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: text }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (content) {
            return JSON.parse(content) as ParsedData;
        }
        throw new Error("Empty response from AI");

    } catch (error) {
        console.error("AI Parsing Failed:", error);
        // Fallback: return raw text
        return { BODY_FULL: text };
    }
}
