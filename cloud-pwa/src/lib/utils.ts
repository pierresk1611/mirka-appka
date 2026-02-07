export function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics
}

export function matchTemplate(productName: string): string {
    const normalized = normalizeText(productName);

    if (normalized.includes('pivo')) {
        return 'BIR_PIVO';
    }

    if (normalized.includes('oslava') || normalized.includes('narodenin')) {
        return 'BIR_PIVO'; // Map celebrations to beer template for now as requested
    }

    if (normalized.includes('svadobn') || normalized.includes('wedding')) {
        return 'WED_BASIC';
    }

    if (normalized.includes('odtlac')) {
        return 'FINGERPRINTS';
    }

    return 'UNKNOWN';
}
