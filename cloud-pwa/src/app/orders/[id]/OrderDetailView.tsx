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

    const fetchOrder = async () => {
        try {
            const res = await fetch(`/api/orders/${id}`);
            if (res.ok) {
                const data = await res.json();
                setOrder(data);

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
                    const mapRes = await fetch(`/api/templates/${templateToFetch}/mapping`);
                    if (mapRes.ok) {
                        const mapData = await mapRes.json();
                        setMappings(mapData.mappings ? JSON.parse(mapData.mappings) : {});
                    }
                }
            } else {
                alert('Objednávka nenájdená');
                router.push('/');
            }
        } catch (error) {
            console.error(error);
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
            const res = await fetch(`/api/templates/${activeItem.template_key}/mapping`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mappings })
            });
            if (res.ok) alert('Mapovanie vrstiev bolo uložené pre túto šablónu.');
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
            const res = await fetch('/api/agent/trigger-job', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: id })
            });

            if (res.ok) {
                alert('Celá sada bola odoslaná na spracovanie do Dropboxu!');
                router.push('/');
            } else {
                const err = await res.json();
                alert(`Chyba: ${err.error}`);
            }
        } catch (error) {
            alert('Chyba pripojenia');
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
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Box className="w-4 h-4" />} Generovať Celú Sadu
                        </button>
                    </div>
                </div>

                {/* Sub-Tabs for Items */}
                <div className="flex gap-2 mt-8">
                    {order.items.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveItemId(item.id)}
                            className={`px-4 py-2 rounded-t-lg text-xs font-bold uppercase tracking-wider border-x border-t transition-all
                                ${activeItemId === item.id
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-[0_-4px_10px_rgba(37,99,235,0.2)]'
                                    : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-white'}
                            `}
                        >
                            {item.product_name_raw}
                        </button>
                    ))}
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
                    <div className="absolute top-4 left-4 z-10">
                        <span className="bg-slate-900/80 text-white text-[9px] font-black uppercase px-2 py-1 rounded backdrop-blur border border-slate-700 tracking-widest">
                            Náhľad Výstupu
                        </span>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-8 bg-slate-900 overflow-hidden">
                        {activeItem?.preview_url ? (
                            <img
                                src={activeItem.preview_url}
                                alt="Preview"
                                className="max-w-full max-h-full shadow-2xl rounded-sm border-2 border-white/20 transform group-hover:scale-105 transition duration-1000"
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
                    {logs.map((log, i) => (
                        <div key={i} className={`mb-1 ${log.includes('ERROR') ? 'text-red-400' : log.includes('SUCCESS') ? 'text-green-400' : 'text-slate-400'}`}>
                            <span className="opacity-30 mr-2">{'>'}</span> {log}
                        </div>
                    ))}
                    {logs.length === 0 && <div className="text-slate-600 italic">Čakanie na signál z agenta...</div>}
                </div>
            </div>
        </AppLayout>
    );
}
