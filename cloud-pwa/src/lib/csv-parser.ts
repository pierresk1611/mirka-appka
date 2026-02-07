import fs from 'fs';
import csv from 'csv-parser';
import iconv from 'iconv-lite';

export interface ParsedCSVRow {
    [key: string]: string;
}

export interface CSVParseOptions {
    separator?: string;
    encoding?: string;
}

/**
 * Parses a CSV file and returns an array of objects representing each row.
 * Handles different encodings (e.g., Win-1250 for Slovak/Czech Excel exports).
 */
export async function parseCSV(
    filePath: string,
    options: CSVParseOptions = {}
): Promise<ParsedCSVRow[]> {
    const { separator = ';', encoding = 'win1250' } = options;
    const results: ParsedCSVRow[] = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(iconv.decodeStream(encoding))
            .pipe(csv({ separator }))
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
}

/**
 * Extracts EPO (Extra Product Options) data using Regex.
 * Specifically looks for "Text oznámenia", "Formát", and "Typ média".
 */
export function extractEPOData(metaString: string) {
    const data: Record<string, string> = {};

    // Try to parse as JSON first (common for WooCommerce tm_epo data)
    try {
        if (metaString.trim().startsWith('[') || metaString.trim().startsWith('{')) {
            const parsed = JSON.parse(metaString);
            if (Array.isArray(parsed)) {
                // Join all text values from tm_epo structure
                // Usually it's an array of objects: [{ name: '...', value: '...', ... }]
                const cleanTexts: string[] = [];
                parsed.forEach((item: any) => {
                    if (item && item.value) {
                        cleanTexts.push(`${item.name || ''}: ${item.value}`);
                    } else if (typeof item === 'string') {
                        cleanTexts.push(item);
                    }
                });
                if (cleanTexts.length > 0) {
                    data.text = cleanTexts.join('\n');
                    return data;
                }
            }
        }
    } catch (e) {
        // Not JSON, continue with regex
    }

    // Regex patterns tailored for common WooCommerce export formats in Slovak/Czech
    const patterns = {
        text: /(?:Text oznámenia|Text oznámení|Pozdrav|Vlastný text)[:\s]+([^|\n]+)/i,
        format: /(?:Formát|Rozmer)[:\s]+([^|\n]+)/i,
        material: /(?:Typ média|Materiál|Papier)[:\s]+([^|\n]+)/i,
        quantity: /(?:Počet kusov|Množstvo|Množství)[:\s]+(\d+)/i,
    };

    for (const [key, regex] of Object.entries(patterns)) {
        const match = metaString.match(regex);
        if (match && match[1]) {
            data[key] = match[1].trim();
        }
    }

    return data;
}

/**
 * Heuristic to detect if a CSV row represents a Product or an Order.
 */
export function detectType(row: ParsedCSVRow): 'PRODUCT' | 'ORDER' | 'UNKNOWN' {
    const keys = Object.keys(row);

    // Order indicators
    if (keys.some(k => k.toLowerCase().includes('order id') || k.toLowerCase().includes('číslo objednávky'))) {
        return 'ORDER';
    }

    // Product indicators
    if (keys.some(k => k.toLowerCase() === 'id') && keys.some(k => k.toLowerCase().includes('title') || k.toLowerCase().includes('permalink'))) {
        return 'PRODUCT';
    }

    return 'UNKNOWN';
}
