import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseCSV, detectType, extractEPOData } from '@/lib/csv-parser';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { filePath, separator = ';' } = body;

        if (!filePath) {
            return NextResponse.json({ error: 'Missing filePath' }, { status: 400 });
        }

        // Absolute path from the request (for local/agent usage)
        const absolutePath = path.isAbsolute(filePath)
            ? filePath
            : path.join(process.cwd(), filePath);

        console.log(`Starting import for ${absolutePath}`);

        const rows = await parseCSV(absolutePath, { separator });
        const result = { total: rows.length, ordersCreated: 0, productsProcessed: 0, errors: 0 };

        for (const row of rows) {
            try {
                const type = detectType(row);

                // Extract EPO from metadata
                const metaData = row['tm_epo'] || row['Item Meta'] || row['Text oznámení'] || row['Content'] || '';
                const epo = extractEPOData(metaData);

                if (type === 'ORDER' || type === 'UNKNOWN') {
                    const id = parseInt(row['Order ID'] || row['ID']);
                    if (!isNaN(id)) {
                        const customerName = row['Billing First Name']
                            ? `${row['Billing First Name']} ${row['Billing Last Name']}`.trim()
                            : (row['Customer Name'] || row['Title'] || 'Unknown Customer');

                        const productName = row['Item Name'] || row['Product Title'] || row['Title'] || 'UNKNOWN';

                        // Template Matching Logic
                        let templateKey = 'UNKNOWN';
                        const lowerProductName = productName.toLowerCase();

                        if (lowerProductName.includes('pivo')) {
                            templateKey = 'BIR_PIVO';
                        } else if (lowerProductName.includes('svadobn') || lowerProductName.includes('wedding')) {
                            templateKey = 'WED_BASIC'; // Example fallback
                        } else if (lowerProductName.includes('odtlač')) {
                            templateKey = 'FINGERPRINTS';
                        } else {
                            templateKey = productName; // Fallback to product name as key
                        }

                        await prisma.order.upsert({
                            where: { id: id },
                            update: {},
                            create: {
                                id: id,
                                customer_name: customerName,
                                product_name_raw: productName,
                                template_key: templateKey,
                                source_text: epo.text || metaData,
                                quantity: parseInt(epo.quantity || row['Meta: Počet kusov'] || row['Quantity'] || '1'),
                                material: epo.material || row['Meta: Typ média'] || row['Material'] || 'Papier',
                                status: 'AI_READY'
                            }
                        });
                        result.ordersCreated++;
                    }
                }

                if (type === 'PRODUCT') {
                    const key = row['Title'] || row['Name'];
                    if (key) {
                        await prisma.templateConfig.upsert({
                            where: { key: key },
                            update: {},
                            create: {
                                key: key,
                                manifest: JSON.stringify({ source: 'CSV_IMPORT' }),
                                status: 'READY'
                            }
                        });
                        result.productsProcessed++;
                    }
                }
            } catch (err) {
                console.error('Error in row processing:', err);
                result.errors++;
            }
        }

        return NextResponse.json({ success: true, result });

    } catch (error) {
        console.error('Import Failed:', error);
        return NextResponse.json({ error: 'Import failed: ' + (error as any).message }, { status: 500 });
    }
}
