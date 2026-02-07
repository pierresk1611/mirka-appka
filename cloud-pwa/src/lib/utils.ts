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

export function formatMetadataValue(key: string, value: any): string | null {
    // 1. Skip ONLY definitely useless tracking/internal keys
    const internalKeysToSkip = [
        'gtm4wp_product_data', '_tm_epo_counter', 'tcaddtocart'
    ];

    if (internalKeysToSkip.includes(key)) return null;

    // 2. Specialized parsing for Extra Product Options (EPO)
    // EPO data can be in _tmcartepo_data or _tmdata or _tmcartfee_data
    if (
        (key.includes('_tm') || key === 'item_meta') &&
        (typeof value === 'object' || Array.isArray(value) || (typeof value === 'string' && (value.includes('[') || value.includes('{'))))
    ) {
        try {
            const parsed = (typeof value === 'string') ? JSON.parse(value) : value;
            if (Array.isArray(parsed)) {
                // Flatten nested arrays if any
                const flat = parsed.flat();
                return flat.map((item: any) => {
                    if (item && typeof item === 'object') {
                        const name = item.name || item.section_label || item.key || '';
                        const val = item.value || item.key || '';
                        if (name && val && name !== val) return `${name}: ${val}`;
                        if (val) return val;
                    }
                    return String(item);
                }).filter(Boolean).join(', ');
            }
        } catch (e) {
            // Fallback to normal stringification
        }
    }

    // 3. Robust stringification for everything else
    if (value !== null && typeof value !== 'undefined') {
        if (typeof value === 'object' || Array.isArray(value)) {
            try {
                return JSON.stringify(value);
            } catch (e) {
                return String(value);
            }
        }
        return String(value);
    }

    return null;
}
