import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseCSV } from '@/lib/csv-parser';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { writeFile, mkdir } from 'fs/promises';

// Helper to parse HTML pricing table
// Expected format: <tr><td>1-10 ks</td><td>2,4 EUR</td></tr>
function parsePricingHtml(html: string): Record<string, number> | null {
    if (!html) return null;

    const pricing: Record<string, number> = {};
    // Regex to find rows with quantity and price
    // Matches: <td>1-10 ks</td>...<td>2,4 EUR</td>
    const rowRegex = /<tr>\s*<td>\s*([0-9\-\+\s]+)\s*(?:ks|kusov)?\s*<\/td>\s*<td>\s*([0-9,.]+)\s*(?:EUR|€)\s*<\/td>\s*<\/tr>/gi;

    let match;
    let found = false;
    while ((match = rowRegex.exec(html)) !== null) {
        const qtyRange = match[1].trim(); // e.g. "1-10"
        const priceStr = match[2].replace(',', '.').trim(); // e.g. "2,4" -> "2.4"
        const price = parseFloat(priceStr);

        if (!isNaN(price)) {
            pricing[qtyRange] = price;
            found = true;
        }
    }

    return found ? pricing : null;
}

// Helper to clean strings for matching
function normalizeString(str: string): string {
    return str.toLowerCase()
        .replace(/[^a-z0-9]/g, '') // remove non-alphanumeric
        .trim();
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Use os.tmpdir() for Vercel/Lambda compatibility
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, `import_${Date.now()}.csv`);

        try {
            await writeFile(tempFilePath, buffer);
            console.log(`File written to ${tempFilePath}`);
        } catch (writeError) {
            console.error('Failed to write temp file:', writeError);
            return NextResponse.json({ error: 'Failed to upload file to temp storage' }, { status: 500 });
        }

        // Parse CSV
        const rows = await parseCSV(tempFilePath, { separator: ',' }); // Assuming comma, can be semicolon

        let matchCount = 0;
        let createdCount = 0;

        // Fetch all generic templates to match against
        const existingTemplates = await prisma.templateConfig.findMany();

        for (const row of rows) {
            // Columns based on user description: Title, Image URL, Content
            // We need to map dynamic keys if header names vary, but let's assume standard WP/Woo export
            const title = row['Title'] || row['Názov'] || row['Name'];
            const content = row['Content'] || row['Popis'] || row['Description'];
            const imageUrl = row['Image URL'] || row['Obrázok'] || row['Image'];

            if (!title) continue;

            // Parse Pricing
            const pricing = parsePricingHtml(content || '');
            const pricingJson = pricing ? JSON.stringify(pricing) : null;

            // Upsert ProductMetadata
            const metadata = await prisma.productMetadata.create({
                data: {
                    csv_title: title,
                    html_content: content,
                    image_url: imageUrl,
                    pricing_json: pricingJson,
                    source_csv: file.name
                }
            });
            createdCount++;

            // Intelligent Matching
            // Strategy: Check if normalized Title contains normalized Template Key, or vice versa
            const normTitle = normalizeString(title);

            // Find finding the best match
            let bestMatch = null;

            for (const t of existingTemplates) {
                const normKey = normalizeString(t.key);
                const normName = t.name ? normalizeString(t.name) : '';

                // 1. Exact match on Key (strongest)
                if (normTitle === normKey) {
                    bestMatch = t;
                    break;
                }

                // 2. Exact match on Name
                if (normName && normTitle === normName) {
                    bestMatch = t;
                    break;
                }

                // 3. Containment (Key in Title or Title in Key)
                // e.g. Title: "Boho Flowers" matches Key: "boho-flowers-v1" or "JSO_15_boho"
                // Be careful with short keys
                if (normKey.length > 5 && normTitle.includes(normKey)) bestMatch = t;
                if (normTitle.length > 5 && normKey.includes(normTitle)) bestMatch = t;
            }

            if (bestMatch) {
                await prisma.templateConfig.update({
                    where: { key: bestMatch.key },
                    data: {
                        is_verified: true,
                        pricing_json: pricingJson,
                        image_url: imageUrl,
                        product_metadata_id: metadata.id
                    }
                });
                matchCount++;
            }
        }

        // Cleanup
        fs.unlinkSync(tempFilePath);

        return NextResponse.json({
            success: true,
            processed: rows.length,
            created: createdCount,
            matched: matchCount
        });

    } catch (error) {
        console.error('Import failed:', error);
        return NextResponse.json({ error: 'Import failed' }, { status: 500 });
    }
}
