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
    // 1. Skip internal keys that don't carry user info
    const internalKeysToSkip = [
        '_tm_epo', '_tm_epo_options_prices', '_tm_epo_product_original_price',
        '_tmcartfee_data', '_tmdata', '_tmpost_data', '_tmcp_post_fields',
        'gtm4wp_product_data'
    ];

    if (internalKeysToSkip.includes(key)) return null;

    // 2. Specialized parsing for Extra Product Options
    if (key === '_tmcartepo_data' && (typeof value === 'object' || Array.isArray(value))) {
        try {
            const parsed = Array.isArray(value) ? value : JSON.parse(value as string);
            if (Array.isArray(parsed)) {
                return parsed.map((item: any) => {
                    if (item.name && item.value) {
                        return `${item.name}: ${item.value}`;
                    }
                    return null;
                }).filter(Boolean).join('\n');
            }
        } catch (e) {
            // Fallback to stringify
        }
    }

    // 3. Robust stringification for everything else
    if (value !== null && typeof value !== 'undefined') {
        if (typeof value === 'object' || Array.isArray(value)) {
            try {
                return JSON.stringify(value, null, 2);
            } catch (e) {
                return String(value);
            }
        }
        return String(value);
    }

    return null;
}
