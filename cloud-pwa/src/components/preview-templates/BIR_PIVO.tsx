import React from 'react';

interface BIR_PIVOProps {
    name_main: string;
    date: string;
    place: string;
    body_full: string;
}

export default function BIR_PIVO({ name_main, date, place, body_full }: BIR_PIVOProps) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                backgroundColor: '#1a1a1a',
                backgroundImage: 'linear-gradient(135deg, #2d1810 0%, #1a1a1a 100%)',
                padding: '80px',
                fontFamily: 'Georgia, serif',
                color: '#f5e6d3',
                position: 'relative',
            }}
        >
            {/* Decorative beer mug icon */}
            <div
                style={{
                    position: 'absolute',
                    top: '40px',
                    right: '40px',
                    fontSize: '120px',
                    opacity: 0.15,
                }}
            >
                🍺
            </div>

            {/* Main heading */}
            <div
                style={{
                    fontSize: '72px',
                    fontWeight: 'bold',
                    color: '#f4a460',
                    marginBottom: '40px',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '4px',
                }}
            >
                Pozvánka na oslavu
            </div>

            {/* Body text */}
            <div
                style={{
                    fontSize: '32px',
                    lineHeight: '1.8',
                    marginBottom: '60px',
                    textAlign: 'center',
                    whiteSpace: 'pre-wrap',
                    maxWidth: '900px',
                    margin: '0 auto 60px',
                }}
            >
                {body_full}
            </div>

            {/* Date and place */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px',
                    marginTop: 'auto',
                }}
            >
                <div
                    style={{
                        fontSize: '42px',
                        fontWeight: 'bold',
                        color: '#f4a460',
                    }}
                >
                    📅 {date}
                </div>
                <div
                    style={{
                        fontSize: '36px',
                        color: '#d4c4b0',
                    }}
                >
                    📍 {place}
                </div>
            </div>

            {/* Host name */}
            <div
                style={{
                    fontSize: '48px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    marginTop: '60px',
                    color: '#f4a460',
                    fontStyle: 'italic',
                }}
            >
                {name_main}
            </div>

            {/* Decorative border */}
            <div
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    right: '20px',
                    bottom: '20px',
                    border: '4px solid #f4a460',
                    borderRadius: '8px',
                    opacity: 0.3,
                }}
            />
        </div>
    );
}
