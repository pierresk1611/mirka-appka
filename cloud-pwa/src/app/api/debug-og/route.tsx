import { ImageResponse } from 'next/og';

export const runtime = 'edge'; // Use Edge for this clean test

export async function GET() {
    return new ImageResponse(
        (
            <div style={{
                fontSize: 60,
                color: 'black',
                background: 'white',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                Hello from Edge OG!
            </div>
        ),
        { width: 800, height: 400 }
    );
}
