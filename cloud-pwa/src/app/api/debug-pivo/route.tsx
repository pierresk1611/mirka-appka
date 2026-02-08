import { ImageResponse } from 'next/og';
import BIR_PIVO from '@/components/preview-templates/BIR_PIVO';

export const runtime = 'nodejs';

export async function GET() {
    const aiData = {
        name_main: "Testovacie Meno",
        date: "01.01.2026",
        place: "Bratislava",
        body_full: "Toto je testovací text pozvánky."
    };

    try {
        return new ImageResponse(
            (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    height: '100%',
                    background: 'white'
                }}>
                    <BIR_PIVO {...aiData} />
                </div>
            ),
            { width: 800, height: 1000 }
        );
    } catch (e: any) {
        return new Response(`Render Error: ${e.message}`, { status: 500 });
    }
}
