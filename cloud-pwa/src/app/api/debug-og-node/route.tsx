import { ImageResponse } from 'next/og';

// No runtime export = defaults to Node.js

export async function GET() {
    return new ImageResponse(
        (
            <div style={{
                fontSize: 60,
                color: 'white',
                background: 'blue',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                Hello from Node.js OG!
            </div>
        ),
        { width: 800, height: 400 }
    );
}
