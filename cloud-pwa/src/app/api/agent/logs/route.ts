import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        // Path to the agent log on the user's system
        const logPath = '/Users/apple/MIRKA AI AGENT DATA/local-agent/agent.log';
        if (!fs.existsSync(logPath)) {
            return NextResponse.json({ logs: ['Žiadne logy nenájdené.'] });
        }

        const content = fs.readFileSync(logPath, 'utf8');
        const lines = content.split('\n').filter(l => l.trim()).slice(-50).reverse();

        // Parse JSON logs if applicable
        const formatted = lines.map(line => {
            try {
                const parsed = JSON.parse(line);
                return `[${new Date(parsed.timestamp).toLocaleTimeString()}] ${parsed.level.toUpperCase()}: ${parsed.message}`;
            } catch {
                return line;
            }
        });

        return NextResponse.json({ logs: formatted });
    } catch (error) {
        return NextResponse.json({ logs: ['Chyba pri čítaní logov.'] });
    }
}
