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
