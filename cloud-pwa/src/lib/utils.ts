export function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics
}

// Helper to extract strict ID from text (e.g. "2025_110")
export function extractTemplateId(text: string): string | null {
    // Look for YYYY_NNN pattern (e.g. 2025_10 or 2026_110)
    // Matches 2020-2029 followed by underscore and numbers
    const regex = /\b(202[0-9])_(\d+)\b/;
    const match = text.match(regex);
    if (match) {
        return match[0]; // Returns full match "2025_110"
    }
    return null;
}

export function matchTemplate(productName: string): string {
    // 1. Strict ID Match (Highest Priority)
    const strictId = extractTemplateId(productName);
    if (strictId) {
        return strictId;
    }

    // 2. Fallback to keyword matching
    const normalized = normalizeText(productName);

    if (normalized.includes('pivo')) {
        return 'BIR_PIVO';
    }

    if (normalized.includes('oslava') || normalized.includes('narodenin')) {
        return 'BIR_PIVO'; // Fallback if no ID is found
    }

    if (normalized.includes('svadobn') || normalized.includes('wedding')) {
        return 'WED_BASIC';
    }

    if (normalized.includes('odtlac')) {
        return 'FINGERPRINTS';
    }

    return 'UNKNOWN';
}

export function formatMetadataValue(key: string, value: any): string | null {
    // 1. Skip definitely useless tracking/internal keys
    const internalKeysToSkip = [
        'gtm4wp_product_data', '_tm_epo_counter', 'tcaddtocart', '_tm_epo',
        '_tm_epo_options_prices', '_tm_epo_product_original_price',
        '_tmdata', '_tmpost_data', '_tmcp_post_fields'
    ];

    if (internalKeysToSkip.includes(key)) return null;

    // 2. Specialized parsing for Extra Product Options (EPO)
    if (
        (key.includes('_tm') || key === 'item_meta') &&
        (typeof value === 'object' || Array.isArray(value) || (typeof value === 'string' && (value.includes('[') || value.includes('{'))))
    ) {
        try {
            const parsed = (typeof value === 'string') ? JSON.parse(value) : value;

            if (Array.isArray(parsed)) {
                const flat = parsed.flat();
                const lines = flat.map((item: any) => {
                    if (item && typeof item === 'object') {
                        const name = item.name || item.section_label || item.key || '';
                        const val = item.value || item.key || '';
                        if (name && val && name !== val) return `${name}: ${val}`;
                        if (val && typeof val !== 'object') return val;
                        if (name && typeof name !== 'object') return name;
                    }
                    return typeof item === 'object' ? JSON.stringify(item) : String(item);
                }).filter(Boolean);

                if (lines.length > 0) return lines.join(', ');
            } else if (typeof parsed === 'object') {
                return JSON.stringify(parsed);
            }
        } catch (e) {
            // Fallback
        }
    }

    // 3. Robust stringification for everything else
    if (value !== null && typeof value !== 'undefined') {
        if (typeof value === 'object' || Array.isArray(value)) {
            try {
                const json = JSON.stringify(value);
                if (json === '{}' || json === '[]') return null;
                return json;
            } catch (e) {
                return '[Complex Data]';
            }
        }
        const strVal = String(value);
        if (strVal === '[object Object]') return '[Object Data]';
        return strVal;
    }

    return null;
}
