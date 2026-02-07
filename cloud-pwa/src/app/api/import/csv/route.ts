import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseCSV, detectType, extractEPOData } from '@/lib/csv-parser';
import { parseOrderText } from '@/lib/ai';
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
                    const wooId = parseInt(row['Order ID'] || row['ID']);
                    if (!isNaN(wooId)) {
                        const customerName = row['Billing First Name']
                            ? `${row['Billing First Name']} ${row['Billing Last Name']}`.trim()
                            : (row['Customer Name'] || row['Title'] || 'Unknown Customer');

                        const productName = row['Item Name'] || row['Product Title'] || row['Title'] || 'UNKNOWN';

                        // Get or Create a default "CSV Import" store
                        const store = await prisma.store.upsert({
                            where: { id: 'csv-import-store' },
                            update: {},
                            create: {
                                id: 'csv-import-store',
                                name: 'CSV Import',
                                url: 'localhost',
                                consumer_key: 'csv',
                                consumer_secret: 'csv'
                            }
                        });

                        // Template Matching Logic
                        let templateKey = 'UNKNOWN';
                        const lowerProductName = productName.toLowerCase();
                        if (lowerProductName.includes('pivo')) templateKey = 'BIR_PIVO';
                        else if (lowerProductName.includes('odtlač')) templateKey = 'FINGERPRINTS';
                        else templateKey = productName;

                        // 1. Create/Update Order
                        const savedOrder = await prisma.order.upsert({
                            where: {
                                woo_id_store_id: {
                                    woo_id: wooId,
                                    store_id: store.id
                                }
                            },
                            update: {
                                customer_name: customerName,
                                status: 'AI_READY'
                            },
                            create: {
                                woo_id: wooId,
                                store_id: store.id,
                                customer_name: customerName,
                                status: 'AI_READY'
                            }
                        });

                        // 2. Create/Update OrderItem
                        const quantity = parseInt(epo.quantity || row['Meta: Počet kusov'] || row['Quantity'] || '1');
                        const material = epo.material || row['Meta: Typ média'] || row['Material'] || 'Papier';

                        const savedItem = await prisma.orderItem.upsert({
                            where: { id: `csv-${wooId}-${productName.replace(/[^a-z0-9]/gi, '')}` },
                            update: {
                                template_key: templateKey,
                                source_text: epo.text || metaData,
                                quantity,
                                material
                            },
                            create: {
                                id: `csv-${wooId}-${productName.replace(/[^a-z0-9]/gi, '')}`,
                                order_id: savedOrder.id,
                                woo_item_id: wooId, // Fake item ID for CSV
                                product_name_raw: productName,
                                template_key: templateKey,
                                source_text: epo.text || metaData,
                                quantity,
                                material,
                                status: 'AI_READY'
                            }
                        });

                        // --- AI PROCESSING (Automatic) ---
                        if (!savedItem.ai_data) {
                            try {
                                console.log(`AI Processing for Order Item ${savedItem.id}...`);
                                const parsedAiData = await parseOrderText(epo.text || metaData, templateKey);
                                if (parsedAiData) {
                                    await prisma.orderItem.update({
                                        where: { id: savedItem.id },
                                        data: {
                                            ai_data: JSON.stringify(parsedAiData),
                                            status: 'AI_READY'
                                        }
                                    });
                                }
                            } catch (aiErr) {
                                console.error(`AI extraction failed for Order Item ${savedItem.id}:`, aiErr);
                            }
                        }

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
