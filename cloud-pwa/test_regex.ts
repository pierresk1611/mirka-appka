
function extractTemplateId(text: string): string | null {
    // Look for YYYY_NNN pattern (e.g. 2025_10 or 2026_110)
    // Matches 2020-2029 followed by underscore and numbers
    const regex = /\b(202[0-9])_(\d+)\b/;
    const match = text.match(regex);
    if (match) {
        return match[0]; // Returns full match "2025_110"
    }
    return null;
}

const inputs = [
    "Pozvánka na oslavu 70. narodenín 2025_110",
    "PozvĂˇnka na oslavu 70. narodenĂ­n 2025_110",
    "2025_110",
    "Pozvánka 2025_110 na oslavu",
    "2025_110Pozvanka", // Should fail due to \b
];

inputs.forEach(input => {
    console.log(`Input: "${input}" -> Match: "${extractTemplateId(input)}"`);
});
