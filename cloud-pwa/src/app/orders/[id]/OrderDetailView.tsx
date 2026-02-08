"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppLayout from '../../../components/AppLayout';
import { Loader2, Save, Send, AlertTriangle, Box, Layers, User, Calendar, MapPin, Globe, Database } from 'lucide-react';

interface OrderItem {
    id: string;
    product_name_raw: string;
    template_key: string;
    source_text: string;
    ai_data: string | null;
    status: string;
    preview_url?: string;
    quantity: number;
    template?: {
        image_url?: string;
        pricing_json?: string;
        main_file?: string | null;
        product_metadata?: {
            pricing_json?: string;
        };
    };
}

interface Order {
    id: string;
    woo_id: number;
    customer_name: string;
    status: string;
    created_at: string;
    store: { name: string };
    items: OrderItem[];
}

export default function OrderDetailView() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [logs, setLogs] = useState<string[]>([]);
    const [mappings, setMappings] = useState<{ [key: string]: string }>({});
    const [availableLayers, setAvailableLayers] = useState<string[]>([]); // Mocked or scanned
    const [showMapping, setShowMapping] = useState(false);

    // Missing hooks
    const [itemForms, setItemForms] = useState<Record<string, any>>({});
    const [activeItemId, setActiveItemId] = useState<string | null>(null);

    // Debug state
    const [showDebug, setShowDebug] = useState(false);
    const [debugData, setDebugData] = useState<any>(null);

    const fetchOrder = async () => {
        try {
            const res = await fetch(`/api/orders/${id}`);
            if (res.ok) {
                const data = await res.json();
                setOrder(data);
                setDebugData({ success: true, orderData: data, timestamp: new Date().toISOString() });

                // Initialize forms
                const forms: any = {};
                data.items.forEach((item: OrderItem) => {
                    try {
                        forms[item.id] = item.ai_data ? JSON.parse(item.ai_data) : {};
                    } catch (e) {
                        forms[item.id] = {};
                    }
                });
                setItemForms(forms);

                // Use the first item by default if none selected
                if (data.items.length > 0) {
                    setActiveItemId(prev => prev || data.items[0].id);

                    // Fetch mappings for the template of the first item
                    const templateToFetch = data.items[0].template_key;
                    try {
                        const mapRes = await fetch(`/api/templates/${templateToFetch}/mapping`);
                        if (mapRes.ok) {
                            const mapData = await mapRes.json();
                            setMappings(mapData?.mappings ? JSON.parse(mapData.mappings) : {});
                        }
                    } catch (mapError) {
                        console.warn('Failed to fetch mappings:', mapError);
                        setMappings({});
                    }
                }
            } else {
                const errorData = await res.json();
                setDebugData({ success: false, error: errorData, status: res.status, timestamp: new Date().toISOString() });
                alert('Objednávka nenájdená');
                router.push('/');
            }
        } catch (error: any) {
            console.error(error);
            setDebugData({ success: false, error: error.message, networkError: true, timestamp: new Date().toISOString() });
        } finally {
            setLoading(false);
        }
    };

    const handleExtractAI = async (itemId: string) => {
        setSaving(true);
        try {
            // We reuse the sync logic but for a single item
            // For now, let's call a specific endpoint or re-sync the whole order
            const res = await fetch(`/api/orders/${id}/sync`, { method: 'POST' });
            if (res.ok) {
                await fetchOrder(); // Refresh data
                alert('AI analýza bola dokončená.');
            } else {
                alert('Chyba pri AI analýze. Skontrolujte API kľúč v nastaveniach.');
            }
        } catch (e) {
            alert('Chyba pripojenia');
        } finally {
            setSaving(false);
        }
    };

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/agent/logs');
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs || []);
            }
        } catch (e) { }
    };

    useEffect(() => {
        if (id) {
            fetchOrder();
            const interval = setInterval(fetchLogs, 3000);
            return () => clearInterval(interval);
        }
    }, [id]);

    const handleFieldChange = (itemId: string, field: string, value: string) => {
        setItemForms(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], [field]: value }
        }));
    };

    const handleSaveMapping = async () => {
        if (!activeItem) return;
        setSaving(true);
        try {
            // 1. Save locally to DB
            const res = await fetch(`/api/templates/${activeItem.template_key}/mapping`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mappings })
            });

            if (res.ok) {
                // 2. Sync Manifest to Dropbox (New Feature)
                const syncRes = await fetch(`/api/templates/${activeItem.template_key}/sync-manifest`, {
                    method: 'POST'
                });

                if (syncRes.ok) {
                    alert('Mapovanie uložené a manifest synchronizovaný na Dropbox! ✅');
                } else {
                    alert('Mapovanie uložené locally, ale synchronizácia na Dropbox zlyhala. ⚠️');
                }
            }
        } catch (e) {
            alert('Chyba pri ukladaní mapovania');
        } finally {
            setSaving(false);
        }
    };

    const handleMappingChange = (systemKey: string, psdLayer: string) => {
        setMappings(prev => ({ ...prev, [psdLayer]: systemKey }));
    };

    const handleSaveItem = async (itemId: string) => {
        setSaving(true);
        try {
            const res = await fetch(`/api/orders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemId,
                    ai_data: itemForms[itemId]
                })
            });
            if (res.ok) console.log('Item saved');
            else alert('Chyba pri ukladaní položky');
        } catch (error) {
            alert('Chyba pripojenia');
        } finally {
            setSaving(false);
        }
    };

    const handleTriggerAll = async () => {
        setSaving(true);
        try {
            // Generate previews for all items
            const previewPromises = order!.items.map(async (item) => {
                try {
                    const baseUrl = window.location.origin;
                    const previewRes = await fetch(`${baseUrl}/api/preview/generate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ itemId: item.id })
                    });

                    if (previewRes.ok) {
                        const previewUrl = `${baseUrl}/api/preview/generate?itemId=${item.id}`;
                        await fetch(`/api/orders/${id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                itemId: item.id,
                                ai_data: item.ai_data ? JSON.parse(item.ai_data) : {},
                                preview_url: previewUrl
                            })
                        });
                        return { success: true, itemId: item.id };
                    } else {
                        return { success: false, itemId: item.id };
                    }
                } catch (err) {
                    console.error(`Preview generation failed for item ${item.id}:`, err);
                    return { success: false, itemId: item.id };
                }
            });

            const results = await Promise.all(previewPromises);
            const successCount = results.filter(r => r.success).length;

            // Refresh order data to show new previews
            await fetchOrder();

            alert(`✅ Vygenerované ${successCount} z ${order!.items.length} náhľadov!`);
        } catch (error) {
            alert('Chyba pri generovaní náhľadov');
        } finally {
            setSaving(false);
        }
    };

    if (loading || !order) {
        return <AppLayout><div className="flex justify-center items-center h-full"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div></AppLayout>;
    }

    const activeItem = order.items.find(i => i.id === activeItemId);
    const activeFormData = activeItemId ? itemForms[activeItemId] : {};

    // System keys from AI results to map
    const systemKeys = Object.keys(activeFormData);


    const calculatePrice = (qty: number, pricingJson: string | null) => {
        if (!pricingJson) return null;
        try {
            const pricing: Record<string, number> = JSON.parse(pricingJson);
            let unitPrice = 0;

            // Sort ranges to handle overlaps or specific ordering
            const entries = Object.entries(pricing).sort((a, b) => {
                const aMin = parseInt(a[0].split('-')[0].replace(/\D/g, '')) || 0;
                const bMin = parseInt(b[0].split('-')[0].replace(/\D/g, '')) || 0;
                return bMin - aMin; // Highest first to catch max tiers
            });

            for (const [range, price] of entries) {
                const parts = range.split('-');
                if (parts.length === 2) {
                    const min = parseInt(parts[0].replace(/\D/g, ''));
                    const max = parseInt(parts[1].replace(/\D/g, ''));
                    if (qty >= min && qty <= max) {
                        unitPrice = price;
                        break;
                    }
                } else if (range.includes('+')) {
                    const val = parseInt(range.replace(/\D/g, ''));
                    if (qty >= val) {
                        unitPrice = price;
                        break;
                    }
                } else {
                    const val = parseInt(range.replace(/\D/g, ''));
                    if (qty >= val) { // Treat single numbers as "at least this many"
                        unitPrice = price;
                    }
                }
            }

            if (unitPrice > 0) {
                return {
                    unit: unitPrice,
                    total: unitPrice * qty
                };
            }

            // Final fallback: if no tier matched, use the lowest price if any tiers exist
            const fallbackPrice = Object.values(pricing).sort((a, b) => a - b)[0];
            if (fallbackPrice) {
                return { unit: fallbackPrice, total: fallbackPrice * qty };
            }

            return null;

        } catch (e) {
            return null;
        }
    };

    return (
        <AppLayout>
            {/* Header Area */}
            <div className="bg-white border-b border-gray-200 -mx-8 -mt-8 px-8 py-6 mb-8 shadow-sm">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-6">
                        <button onClick={() => router.push('/')} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-gray-500 hover:bg-white hover:shadow transition">←</button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Objednávka <span className="text-blue-600">#{order.woo_id}</span></h1>
                                <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 uppercase tracking-widest">{order.store.name}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500 font-medium">
                                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {order.customer_name}</span>
                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(order.created_at).toLocaleDateString('sk-SK')}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowDebug(!showDebug)}
                            className={`px-4 py-2 rounded-xl font-bold border transition flex items-center gap-2 ${showDebug ? 'bg-purple-600 border-purple-600 text-white shadow-lg' : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50'}`}
                        >
                            <AlertTriangle className="w-4 h-4" /> Debug
                        </button>
                        <button
                            onClick={() => setShowMapping(!showMapping)}
                            className={`px-4 py-2 rounded-xl font-bold border transition flex items-center gap-2 ${showMapping ? 'bg-orange-600 border-orange-600 text-white shadow-lg' : 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50'}`}
                        >
                            <Layers className="w-4 h-4" /> Smart Mapping
                        </button>
                        <button
                            onClick={handleTriggerAll}
                            disabled={saving}
                            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-xl hover:bg-slate-800 transition flex items-center gap-2"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Box className="w-4 h-4" />} Vygenerovať Náhľady
                        </button>
                    </div>
                </div>

                {/* Sub-Tabs for Items */}
                <div className="flex gap-2 mt-8 overflow-x-auto pb-2">
                    {order.items.map(item => {
                        // Calculate price for this item
                        const pricingJson = item.template?.pricing_json || item.template?.product_metadata?.pricing_json || null;
                        const priceData = calculatePrice(item.quantity, pricingJson);

                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveItemId(item.id)}
                                className={`flex flex-col items-start px-4 py-2 rounded-t-lg bg-white border-x border-t transition-all min-w-[150px]
                                ${activeItemId === item.id
                                        ? 'border-blue-600 shadow-[0_-4px_10px_rgba(37,99,235,0.2)] relative z-10'
                                        : 'border-gray-200 hover:bg-gray-50 text-gray-400'}
                            `}
                            >
                                <span className={`text-xs font-bold uppercase tracking-wider ${activeItemId === item.id ? 'text-blue-600' : 'text-gray-500'}`}>
                                    {item.product_name_raw}
                                </span>
                                <div className="flex items-center justify-between w-full mt-1">
                                    <span className="text-[10px] font-mono text-slate-400">{item.quantity} ks</span>
                                    {priceData && (
                                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                            {priceData.total.toFixed(2)} €
                                        </span>
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>


            {/* Main Content: Tabs/Editor/Preview */}
            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-420px)]">

                {/* 1. Source Text or Mapping */}
                <div className="w-full lg:w-1/4 flex flex-col bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-inner">
                    {showMapping ? (
                        <div className="flex flex-col h-full">
                            <div className="px-4 py-3 border-b border-orange-200 bg-orange-50 flex items-center justify-between text-[10px] font-black uppercase text-orange-600 tracking-widest">
                                <div className="flex items-center gap-2"><Layers className="w-3 h-3" /> Smart Mapping (PSD)</div>
                                <button onClick={handleSaveMapping} className="text-orange-700 hover:underline">Uložiť</button>
                            </div>
                            <div className="p-4 flex-1 overflow-y-auto space-y-4">
                                <p className="text-[10px] text-orange-600 font-bold leading-tight bg-orange-100 p-2 rounded">
                                    Priraďte detegované vrstvy z Photoshopu k systémovým kľúčom.
                                </p>
                                {systemKeys.map(key => (
                                    <div key={key} className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{key}</label>
                                        <input
                                            placeholder="Názov vrstvy v PSD..."
                                            value={Object.keys(mappings).find(k => mappings[k] === key) || ''}
                                            onChange={(e) => handleMappingChange(key, e.target.value)}
                                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="px-4 py-3 border-b border-slate-200 bg-slate-100/50 flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                <Globe className="w-3 h-3" /> Pôvodný Text: {activeItem?.product_name_raw}
                            </div>
                            <div className="p-5 flex-1 overflow-y-auto font-mono text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                                {activeItem?.source_text}
                            </div>
                        </>
                    )}
                </div>

                {/* 2. Editor */}
                <div className="w-full lg:w-1/3 flex flex-col bg-white border-2 border-blue-500/20 rounded-2xl overflow-hidden shadow-2xl relative">
                    <div className="px-4 py-3 bg-blue-600 text-white flex justify-between items-center shadow-lg">
                        <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            Editor Dát: {activeItem?.template_key}
                        </span>
                        <div className="flex gap-2">
                            {systemKeys.length > 0 && (
                                <button
                                    onClick={() => activeItemId && handleExtractAI(activeItemId)}
                                    disabled={saving}
                                    className="bg-blue-500/30 hover:bg-blue-500/50 text-white/90 px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition flex items-center gap-1"
                                    title="Pre-extrahuje dáta cez AI znova"
                                >
                                    <Database className="w-3 h-3" /> Re-sync
                                </button>
                            )}
                            <button
                                onClick={() => activeItemId && handleSaveItem(activeItemId)}
                                disabled={saving}
                                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition flex items-center gap-1"
                            >
                                <Save className="w-3 h-3" /> Uložiť
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {systemKeys.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-300 mb-6 italic font-serif text-2xl">AI</div>
                                <h3 className="text-slate-900 font-bold mb-2">Chýbajúce dáta</h3>
                                <p className="text-sm text-slate-500 mb-8 max-w-[240px]">
                                    Položka ešte nebola spracovaná umelou inteligenciou alebo extrakcia zlyhala.
                                </p>
                                <button
                                    onClick={() => activeItemId && handleExtractAI(activeItemId)}
                                    disabled={saving}
                                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition flex items-center justify-center gap-3"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                                    Spustiť AI Extrakciu
                                </button>
                            </div>
                        ) : (
                            systemKeys.map(key => (
                                <div key={key} className="group">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-tighter group-hover:text-blue-500 transition">
                                        {key}
                                    </label>
                                    {key === 'body_full' || key.includes('text') ? (
                                        <textarea
                                            value={activeFormData[key]}
                                            onChange={(e) => activeItemId && handleFieldChange(activeItemId, key, e.target.value)}
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition h-32"
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={activeFormData[key]}
                                            onChange={(e) => activeItemId && handleFieldChange(activeItemId, key, e.target.value)}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition"
                                        />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 3. Preview */}
                <div className="flex-1 flex flex-col bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl relative group">
                    <div className="absolute top-4 left-4 z-10 flex gap-2">
                        {activeItem?.preview_url || activeItem?.status === 'GENERATED' ? (
                            <span className="bg-green-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded border border-green-500 backdrop-blur shadow-lg tracking-widest">
                                Live Náhľad (Agent)
                            </span>
                        ) : activeItem?.template?.main_file ? (
                            <span className="bg-blue-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded border border-blue-500 backdrop-blur shadow-lg tracking-widest">
                                PSD Prepojené
                            </span>
                        ) : (
                            <span className="bg-orange-600/80 text-white text-[9px] font-black uppercase px-2 py-1 rounded border border-orange-500 backdrop-blur tracking-widest">
                                Katalógový náhľad
                            </span>
                        )}
                    </div>
                    <div className="flex-1 flex items-center justify-center p-8 bg-slate-900 overflow-hidden">
                        {activeItem?.preview_url || activeItem?.template?.image_url ? (
                            <img
                                src={activeItem.preview_url || activeItem?.template?.image_url}
                                alt="Preview"
                                className={`max-w-full max-h-full shadow-2xl rounded-sm border-2 transform group-hover:scale-105 transition duration-1000 
                                ${activeItem?.preview_url || activeItem?.status === 'GENERATED'
                                        ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                                        : activeItem?.template?.main_file
                                            ? 'border-blue-500/50 grayscale-[0.2]'
                                            : 'border-orange-500/20 grayscale-[0.5]'}`}
                            />
                        ) : (
                            <div className="text-center text-slate-600">
                                <div className="w-12 h-12 bg-slate-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Loader2 className="w-6 h-6 opacity-20 animate-spin" />
                                </div>
                                <p className="text-[9px] font-bold uppercase tracking-widest opacity-30">čakanie na agenta...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* DEBUG PANEL */}
            {showDebug && debugData && (
                <div className="mt-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6 shadow-xl">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-6 h-6 text-purple-600" />
                            <h4 className="font-black uppercase tracking-tight text-sm text-purple-900">🔍 DEBUG: Preview & Order Data</h4>
                        </div>
                        <button
                            onClick={() => setShowDebug(false)}
                            className="text-xs font-bold hover:underline opacity-50 hover:opacity-100 text-purple-600"
                        >
                            ZAVRIEŤ
                        </button>
                    </div>

                    {/* Active Item Preview URL */}
                    {activeItem && (
                        <div className="mb-4 p-4 bg-white/80 rounded-xl border border-purple-200">
                            <div className="text-[10px] font-black text-purple-600 uppercase mb-2">Preview URL pre aktívnu položku:</div>
                            <div className="font-mono text-xs text-purple-900 break-all bg-purple-50 p-2 rounded">
                                {activeItem.preview_url || '❌ NULL / UNDEFINED'}
                            </div>
                            {activeItem.preview_url && (
                                <div className="mt-2 text-[10px] text-purple-600">
                                    ✅ URL je nastavená. Ak sa obrázok nezobrazuje, skontrolujte:
                                    <ul className="list-disc ml-4 mt-1">
                                        <li>Či URL je dostupná (skúste otvoriť v novom tabe)</li>
                                        <li>Či agent dokončil generovanie</li>
                                        <li>CORS nastavenia (ak je to externá URL)</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Full Order Data */}
                    <div className="bg-black/95 text-green-400 p-6 rounded-xl font-mono text-[11px] overflow-auto max-h-[400px] shadow-2xl">
                        <div className="mb-2 text-white/40 border-b border-white/10 pb-2">RAW ORDER DATA:</div>
                        <pre>{JSON.stringify(debugData, null, 2)}</pre>
                    </div>

                    {/* Diagnostic Info */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="bg-white/60 p-3 rounded-lg border border-purple-200">
                            <div className="text-[9px] font-black text-purple-400 uppercase mb-1">Počet položiek</div>
                            <div className="text-lg font-black text-purple-900">{order?.items.length || 0}</div>
                        </div>
                        <div className="bg-white/60 p-3 rounded-lg border border-purple-200">
                            <div className="text-[9px] font-black text-purple-400 uppercase mb-1">Aktívna položka</div>
                            <div className="text-lg font-black text-purple-900">{activeItem?.product_name_raw || 'N/A'}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* LIVE CONSOLE */}
            <div className="mt-6 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">Console: Local Agent MAC-OFFICE</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[9px] text-green-500 font-bold uppercase">LIVE</span>
                    </div>
                </div>
                <div className="p-4 h-40 overflow-y-auto font-mono text-[11px] leading-relaxed">
                    {activeItem && !activeItem.template?.main_file && (
                        <div className="mb-2 text-red-500 font-bold animate-pulse">
                            <span className="opacity-30 mr-2">{'>'}</span> ERROR: Chýba prepojenie na Master PSD súbor!
                        </div>
                    )}
                    {logs.map((log, i) => (
                        <div key={i} className={`mb-1 ${log.includes('ERROR') ? 'text-red-400' : log.includes('SUCCESS') ? 'text-green-400' : 'text-slate-400'}`}>
                            <span className="opacity-30 mr-2">{'>'}</span> {log}
                        </div>
                    ))}
                    {logs.length === 0 && !(!activeItem?.template?.main_file) && <div className="text-slate-600 italic">Čakanie na signál z agenta...</div>}
                </div>
            </div>
        </AppLayout>
    );
}
