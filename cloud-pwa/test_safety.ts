
import iconv from 'iconv-lite';

function fixEncoding(str: string) {
    try {
        const buffer = iconv.encode(str, 'win1250');
        // If the string contains chars NOT in win1250, they might be replaced by '?'
        return iconv.decode(buffer, 'utf8');
    } catch (e: any) {
        return "ERROR: " + e.message;
    }
}

const samples = [
    "PozvĂˇnka", // Corrupted
    "Pozvánka",  // Valid
    "Svätopluk", // Valid with Ä
    "Škrečok",   // Valid with Š, č
    "1-10 kusov" // ASCII
];

samples.forEach(s => {
    const fixed = fixEncoding(s);
    console.log(`Original: "${s}" -> Fixed: "${fixed}"`);
    console.log(`Changed: ${s !== fixed}`);
    console.log('---');
});
