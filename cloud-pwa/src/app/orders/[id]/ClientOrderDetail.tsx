"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppLayout from '../../../components/AppLayout';
import { Loader2, Save, Send, AlertTriangle } from 'lucide-react';

export default function ClientOrderDetail() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id;

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Editor State
    interface FormData {
        [key: string]: string;
    }
    const [formData, setFormData] = useState<FormData>({});

    // Fetch Order
    useEffect(() => {
        if (!id) return;
        const fetchOrder = async () => {
            try {
                const res = await fetch(`/api/orders/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setOrder(data);
                    // Parse AI Data
                    if (data.ai_data) {
                        try {
                            const parsed = JSON.parse(data.ai_data);
                            setFormData(parsed);
                        } catch (e) {
                            console.error("Failed to parse AI data", e);
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
        fetchOrder();
    }, [id, router]);

    const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload: any = { ai_data: formData };
            // PUT only updates data, no status change
            const res = await fetch(`/api/orders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const updated = await res.json();
                setOrder(updated);
                // Optional: Toast message "Uložené"
            } else {
                alert('Chyba pri ukladaní');
            }
        } catch (error) {
            console.error(error);
            alert('Chyba pripojenia');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveToDropbox = async () => {
        setSaving(true);
        try {
            // 1. First save current data
            await handleSave();

            // 2. Trigger Job
            const res = await fetch('/api/agent/trigger-job', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: id })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setOrder(data.order); // Should have status GENERATING
                    alert('Objednávka bola pridaná do fronty pre Dropbox!');
                    router.push('/');
                }
            } else {
                const err = await res.json();
                alert(`Chyba: ${err.error}`);
            }
        } catch (error) {
            console.error(error);
            alert('Nepodarilo sa spojiť so serverom');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            {/* Top Bar */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-slate-500 hover:bg-slate-200 p-2 rounded-full transition">← Späť</button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            Objednávka #{id}
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-200">
                                {order.status}
                            </span>
                        </h1>
                        <p className="text-sm text-slate-500">Šablóna: <span className="font-mono font-bold text-slate-700">{order.template_key}</span></p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleSave()}
                        disabled={saving}
                        className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded text-sm font-medium hover:bg-slate-50 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" /> Uložiť
                    </button>
                    <button
                        onClick={handleSaveToDropbox}
                        disabled={saving || order.status === 'GENERATING'}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-bold shadow-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving && order.status !== 'GENERATING' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {order.status === 'GENERATING' ? 'Odoslané agentovi' : 'Uložiť na Dropbox'}
                    </button>
                </div>
            </div>

            {/* 3-Column Layout */}
            <div className="flex flex-col md:flex-row gap-6 md:h-[calc(100vh-200px)]">

                {/* 1. Source */}
                <div className="w-full md:w-1/4 bg-white border border-gray-200 rounded-xl flex flex-col shadow-sm">
                    <div className="p-3 bg-gray-50 border-b font-semibold text-xs text-slate-500 uppercase">Text zákazníka (Woo)</div>
                    <div className="p-4 flex-1 overflow-y-auto bg-yellow-50 font-mono text-sm text-slate-700 whitespace-pre-wrap">
                        {(() => {
                            try {
                                const parsed = JSON.parse(order.source_text);
                                return JSON.stringify(parsed, null, 2);
                            } catch {
                                return order.source_text;
                            }
                        })()}
                    </div>
                </div>

                {/* 2. Editor */}
                <div className="w-full md:w-1/3 bg-white border border-blue-200 rounded-xl flex flex-col shadow-md ring-1 ring-blue-100">
                    <div className="p-3 bg-blue-600 text-white rounded-t-xl font-semibold text-xs uppercase flex justify-between">
                        <span>Editor Polí (JSON)</span>
                        {saving && <span className="animate-pulse">Ukladám...</span>}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {Object.keys(formData).length === 0 ? (
                            <div className="text-center text-gray-400 mt-10">Žiadne AI dáta. Skúste Sync znova.</div>
                        ) : (
                            Object.keys(formData).map((key) => (
                                <div key={key}>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">{key}</label>
                                    {key === 'body_full' || key.includes('text') ? (
                                        <textarea
                                            name={key}
                                            value={formData[key]}
                                            onChange={handleChange}
                                            className="w-full p-2 border rounded h-32 text-sm font-mono"
                                        />
                                    ) : (
                                        <input
                                            name={key}
                                            value={formData[key]}
                                            onChange={handleChange}
                                            className="w-full p-2 border rounded font-medium text-slate-800"
                                        />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-4 border-t bg-gray-50 text-xs text-gray-400 text-center">
                        Zmeny sa ukladajú tlačidlom "Uložiť" hore.
                    </div>
                </div>

                {/* 3. Preview */}
                <div className="flex-1 bg-slate-200 rounded-xl flex flex-col overflow-hidden relative border border-slate-300">
                    <div className="p-3 bg-slate-300 border-b font-semibold text-xs text-slate-600 uppercase">Výstup (Preview)</div>
                    <div className="flex-1 flex items-center justify-center p-4 bg-gray-300">
                        {order.preview_url ? (
                            <img src={order.preview_url} alt="Preview" className="max-w-full max-h-full shadow-lg" />
                        ) : (
                            <div className="bg-white/50 shadow-inner p-8 rounded-xl text-center text-gray-400">
                                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>Náhľad zatiaľ nie je vygenerovaný.</p>
                                <p className="text-xs mt-2">Odoslaním agentovi sa tu objaví PDF/JPG.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
