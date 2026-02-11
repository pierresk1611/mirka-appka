'use client';
import { useState, useEffect } from 'react';
import DebugPanel from '@/components/DebugPanel';
import { getAuthHeaders } from '@/lib/config';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('woo');
    const [stores, setStores] = useState<any[]>([]);
    const [newStore, setNewStore] = useState({ name: '', url: '', ck: '', cs: '' });
    const [loading, setLoading] = useState(false);

    const fetchStores = async () => {
        try {
            const res = await fetch('/api/stores', { headers: getAuthHeaders() });
            const data = await res.json();
            setStores(data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchStores(); }, []);

    const addStore = async () => {
        if (!newStore.name || !newStore.url) return;
        setLoading(true);
        (window as any).logToMonitor?.("Odosielam e-shop do DB...", "info");

        try {

            // ... inside addStore ...
            // ... inside addStore ...
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

            const res = await fetch('/api/stores', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(newStore),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                (window as any).logToMonitor?.("E-shop úspešne pridaný!", "info");
                setNewStore({ name: '', url: '', ck: '', cs: '' });
                fetchStores();
            } else {
                const err = await res.json();
                console.error("Store add error:", err);
                alert(`CHYBA: ${err.error || 'Neznáma chyba'}`);
                (window as any).logToMonitor?.(`CHYBA: ${err.error}`, "error");
            }
        } catch (err: any) {
            console.error("Store add CRITICAL:", err);
            alert(`CRITICAL ERROR: ${err.message}`);
            (window as any).logToMonitor?.(`CRITICAL: ${err.message}`, "error");
        } finally { setLoading(false); }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-black mb-8">Nastavenia systému</h1>
            <div className="flex gap-2 mb-8 bg-slate-100 p-1 rounded-xl w-max">
                <button onClick={() => setActiveTab('woo')} className={`px-6 py-2 rounded-lg font-bold text-sm ${activeTab === 'woo' ? 'bg-white text-blue-600 shadow' : 'text-slate-500'}`}>🔌 E-shopy</button>
                <button onClick={() => setActiveTab('ai')} className={`px-6 py-2 rounded-lg font-bold text-sm ${activeTab === 'ai' ? 'bg-white text-blue-600 shadow' : 'text-slate-500'}`}>🤖 AI Agenti</button>
            </div>

            {activeTab === 'woo' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border shadow-sm">
                        <h2 className="font-bold mb-4">Pridať nový e-shop</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <input value={newStore.name} onChange={e => setNewStore({ ...newStore, name: e.target.value })} placeholder="Názov webu" className="p-3 border rounded-xl" />
                            <input value={newStore.url} onChange={e => setNewStore({ ...newStore, url: e.target.value })} placeholder="URL (https://...)" className="p-3 border rounded-xl" />
                            <input value={newStore.ck} onChange={e => setNewStore({ ...newStore, ck: e.target.value })} placeholder="Woo Consumer Key" type="password" className="p-3 border rounded-xl" />
                            <input value={newStore.cs} onChange={e => setNewStore({ ...newStore, cs: e.target.value })} placeholder="Woo Consumer Secret" type="password" className="p-3 border rounded-xl" />
                        </div>
                        <button onClick={addStore} disabled={loading} className="mt-4 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50">
                            {loading ? 'Ukladám...' : '+ Pridať e-shop'}
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden text-sm">
                        <table className="w-full text-left font-medium">
                            <thead className="bg-slate-50 border-b">
                                <tr><th className="p-4 uppercase text-[10px] text-slate-400">E-shop</th><th className="p-4 uppercase text-[10px] text-slate-400 text-right">Akcia</th></tr>
                            </thead>
                            <tbody className="divide-y">
                                {stores.map(s => (
                                    <tr key={s.id}><td className="p-4 font-bold text-slate-800">{s.name} ({s.url})</td><td className="p-4 text-right"><button className="text-red-500 font-bold uppercase text-[10px]">Zmazať</button></td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            <DebugPanel title="Nastavenia" data={stores} error={null} loading={loading} />
        </div>
    );
}