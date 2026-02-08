"use client";

import React, { useState, useEffect } from 'react';
import { Search, Link as LinkIcon, X, Check } from 'lucide-react';

interface ManualLinkProps {
    itemId: string;
    currentMetadataId?: string | null;
    productName: string;
    onLink: () => void;
    onClose: () => void;
}

export default function ManualLinkModal({ itemId, currentMetadataId, productName, onLink, onClose }: ManualLinkProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [linking, setLinking] = useState(false);

    // Auto-search initially using product name parts
    useEffect(() => {
        // Try to extract something useful from product name (e.g. "Pozvánka 2025_110" -> "2025_110")
        const match = productName.match(/(202[0-9]_\d+)/);
        if (match) {
            setQuery(match[0]);
        } else {
            // Clean up common words to get a decent search query
            const clean = productName.replace(/Pozvánka|na|oslavu|narodenín/gi, '').trim().substring(0, 10);
            setQuery(clean);
        }
    }, [productName]);

    useEffect(() => {
        const search = async () => {
            if (query.length < 2) return;
            setLoading(true);
            try {
                const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setResults(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(search, 500);
        return () => clearTimeout(debounce);
    }, [query]);

    const handleLink = async (metadataId: string) => {
        setLinking(true);
        try {
            const res = await fetch(`/api/orders/item/${itemId}/link-metadata`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ metadataId })
            });
            if (res.ok) {
                onLink();
                onClose();
            } else {
                alert('Chyba pri prepájaní.');
            }
        } catch (e) {
            alert('Chyba: ' + e);
        } finally {
            setLinking(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-blue-600" />
                        Manuálne priradenie ceny
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4 border-b border-gray-100">
                    <p className="text-xs text-slate-500 mb-2">Hľadám cenník pre: <strong className="text-slate-700">{productName}</strong></p>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Hľadaj podľa názvu alebo SKU..."
                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-gray-50/50">
                    {loading && <div className="text-center p-4 text-xs text-gray-400">Hľadám...</div>}

                    {!loading && results.length === 0 && query.length > 1 && (
                        <div className="text-center p-4 text-xs text-gray-400">Žiadne výsledky.</div>
                    )}

                    {results.map(res => (
                        <div
                            key={res.id}
                            onClick={() => !linking && handleLink(res.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition flex justify-between items-center ${currentMetadataId === res.id
                                    ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300'
                                    : 'bg-white border-gray-100 hover:border-blue-300 hover:shadow-sm'
                                }`}
                        >
                            <div className="overflow-hidden">
                                <div className="text-xs font-bold text-slate-800 truncate">{res.csv_title}</div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    SKU: {res.sku || 'N/A'}
                                    {res.pricing_json && <span className="ml-2 text-green-600">● Má cenník</span>}
                                </div>
                            </div>
                            {currentMetadataId === res.id && <Check className="w-4 h-4 text-blue-600" />}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
