export function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics
}

// Helper to extract strict ID from text (e.g. "2025_110")
export function extractTemplateId(text: string): string | null {
    // Look for YYYY_NNN pattern (e.g. 2025_10 or 2026_110)
    // Matches 2024-2029 followed by underscore and numbers
    // Added word boundary or space/dash flexibility
    const regex = /(202[4-9])_(\d+)/;
    const match = text.match(regex);
    if (match) {
        return match[0]; // Returns full match "2025_110"
    }
    return null;
}

export function extractQuantityFromMetadata(metaData: any[], defaultQty: number = 1): number {
    if (!metaData || !Array.isArray(metaData)) return defaultQty;

    const quantityKeys = [
        'počet', 'pocet', 'množstvo', 'mnozstvo', 'qty', 'quantity',
        'počet pozvánok', 'počet oznámení', 'počet kusov', 'ks', 'ks.', 'mnozstvi', 'ks:'
    ];

    const extractFromStr = (str: string): number | null => {
        if (!str) return null;

        // Try direct number first
        const directMatch = str.trim().match(/^\d+$/);
        if (directMatch) return parseInt(directMatch[0]);

        // Try "Label: Number" or "Label Number"
        for (const key of quantityKeys) {
            const regex = new RegExp(`${key}\\s*[:=]?\\s*(\\d+)`, 'i');
            const match = str.match(regex);
            if (match) return parseInt(match[1]);
        }

        return null;
    };

    // 1. Look for obvious keys directly
    for (const meta of metaData) {
        const key = String(meta.key || '').toLowerCase();
        if (quantityKeys.some(dk => key.includes(dk))) {
            const val = extractFromStr(String(meta.value));
            if (val && val > 0) return val;
        }
    }

    // 2. Look inside complexity keys or flattened strings
    const complexKeys = ['_tmcartepo_data', 'item_meta', '_tm_epo'];
    for (const meta of metaData) {
        if (complexKeys.includes(meta.key)) {
            const val = meta.value;

            // 2.1 Handle if it's already an object (auto-parsed by SDK)
            if (typeof val === 'object' && val !== null) {
                if (Array.isArray(val)) {
                    for (const entry of val) {
                        const name = String(entry.name || entry.key || '').toLowerCase();
                        if (quantityKeys.some(dk => name.includes(dk))) {
                            const v = extractFromStr(String(entry.value));
                            if (v) return v;
                        }
                    }
                } else {
                    for (const [k, v] of Object.entries(val)) {
                        if (quantityKeys.some(dk => k.toLowerCase().includes(dk))) {
                            const qty = extractFromStr(String(v));
                            if (qty) return qty;
                        }
                    }
                }
            }

            // 2.2 If it's a string, it might be stringified JSON or a comma-separated list
            if (typeof val === 'string') {
                try {
                    const parsed = JSON.parse(val);
                    if (Array.isArray(parsed)) {
                        for (const entry of parsed) {
                            const name = String(entry.name || entry.key || '').toLowerCase();
                            if (quantityKeys.some(dk => name.includes(dk))) {
                                const v = extractFromStr(String(entry.value));
                                if (v) return v;
                            }
                        }
                    } else if (typeof parsed === 'object' && parsed !== null) {
                        for (const [k, v] of Object.entries(parsed)) {
                            if (quantityKeys.some(dk => k.toLowerCase().includes(dk))) {
                                const qty = extractFromStr(String(v));
                                if (qty) return qty;
                            }
                        }
                    }
                } catch (e) {
                    // Not JSON, maybe a list like "Text: XYZ, Počet pozvánok: 25"
                    const parts = val.split(/,|;/);
                    for (const part of parts) {
                        const v = extractFromStr(part.trim());
                        if (v) return v;
                    }
                }
            }
        }
    }

    return defaultQty;
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
