import React from 'react';

interface BIR_PIVOProps {
    name_main: string;
    date: string;
    date_time?: string;
    quote?: string;
    place: string;
    body_full: string;
    templateKey?: string;
}

export default function BIR_PIVO({ name_main, date, date_time, quote, place, body_full, templateKey }: BIR_PIVOProps) {
    const isBirthday110 = templateKey?.includes('110') || templateKey?.includes('2025');
    const displayDate = date_time || date;

    // Theme colors
    const bgColor = isBirthday110 ? '#fdf8f1' : '#1a1a1a';
    const accentColor = isBirthday110 ? '#c7a35d' : '#f4a460';
    const textColor = isBirthday110 ? '#333333' : '#f5e6d3';
    const secondaryColor = isBirthday110 ? '#666666' : '#d4c4b0';

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                backgroundColor: bgColor,
                padding: '100px',
                fontFamily: 'serif',
                color: textColor,
                position: 'relative',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            {/* Background Decorations for 110 (Balloons effect via circles) */}
            {isBirthday110 && (
                <>
                    <div style={{ position: 'absolute', top: '10%', left: '5%', width: '150px', height: '200px', borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%', background: 'linear-gradient(135deg, #e6c68a 0%, #c7a35d 100%)', opacity: 0.6, transform: 'rotate(-15deg)' }} />
                    <div style={{ position: 'absolute', top: '15%', left: '12%', width: '120px', height: '160px', borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%', background: 'linear-gradient(135deg, #f5e0b7 0%, #d4b375 100%)', opacity: 0.5, transform: 'rotate(10deg)' }} />
                    <div style={{ position: 'absolute', top: '8%', left: '18%', width: '100px', height: '140px', borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%', background: 'linear-gradient(135deg, #d4b375 0%, #b3924d 100%)', opacity: 0.4, transform: 'rotate(-5deg)' }} />
                </>
            )}

            {/* Quote / Citát (New Field) */}
            {quote && (
                <div style={{
                    fontSize: '28px',
                    fontStyle: 'italic',
                    color: secondaryColor,
                    marginBottom: '40px',
                    textAlign: 'center',
                    maxWidth: '800px'
                }}>
                    "{quote}"
                </div>
            )}

            {/* Main heading */}
            <div
                style={{
                    fontSize: '80px',
                    fontWeight: 300,
                    color: accentColor,
                    marginBottom: '60px',
                    textAlign: 'center',
                    fontFamily: 'serif',
                    fontStyle: 'italic',
                }}
            >
                Pozvánka na oslavu
            </div>

            {/* Body text */}
            <div
                style={{
                    fontSize: '32px',
                    lineHeight: '1.6',
                    marginBottom: '80px',
                    textAlign: 'center',
                    maxWidth: '850px',
                    color: textColor,
                }}
            >
                {body_full}
            </div>

            {/* Date and Place Section */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '15px',
                    borderTop: `1px solid ${accentColor}44`,
                    borderBottom: `1px solid ${accentColor}44`,
                    padding: '40px 0',
                    width: '600px',
                }}
            >
                <div
                    style={{
                        fontSize: '44px',
                        fontWeight: 'bold',
                        color: accentColor,
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                    }}
                >
                    {displayDate}
                </div>
                <div
                    style={{
                        fontSize: '34px',
                        color: secondaryColor,
                        fontStyle: 'italic',
                    }}
                >
                    {place}
                </div>
            </div>

            {/* Host Name */}
            <div
                style={{
                    fontSize: '56px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    marginTop: '80px',
                    color: accentColor,
                    fontFamily: 'serif',
                }}
            >
                {name_main}
            </div>

            {/* Decorative inner border */}
            <div
                style={{
                    position: 'absolute',
                    top: '40px',
                    left: '40px',
                    right: '40px',
                    bottom: '40px',
                    border: `1px solid ${accentColor}33`,
                    pointerEvents: 'none',
                }}
            />
        </div>
    );
}
