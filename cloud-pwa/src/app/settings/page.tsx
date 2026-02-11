'use client';

import { useState, useEffect } from 'react';
import DebugPanel from '@/components/DebugPanel';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('woo');
    const [stores, setStores] = useState<any[]>([]);
    const [newStore, setNewStore] = useState({ name: '', url: '', ck: '', cs: '' });
    const [loading, setLoading] = useState(false);

    // Načítanie existujúcich e-shopov
    const fetchStores = async () => {
        const res = await fetch('/api/stores');
        const data = await res.json();
        setStores(data);
    };

    useEffect(() => { fetchStores(); }, []);

    // Pridanie nového e-shopu
    const addStore = async () => {
        if (!newStore.name || !newStore.url || !newStore.ck || !newStore.cs) {
            alert('Vyplňte všetky údaje pre WooCommerce!');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/stores', {
                method: 'POST',
                body: JSON.stringify(newStore),
            });
            if (res.ok) {
                setNewStore({ name: '', url: '', ck: '', cs: '' });
                fetchStores();
                alert('E-shop úspešne pridaný!');
            }
        } catch (err) {
            alert('Chyba pri ukladaní');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto font-sans">
            <h1 className="text-3xl font-black mb-8 text-slate-900">Nastavenia systému</h1>

            {/* TABS */}
            <div className="flex gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl w-max">
                <button onClick={() => setActiveTab('woo')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'woo' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>🔌 E-shopy (Woo)</button>
                <button onClick={() => setActiveTab('ai')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'ai' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>🤖 AI Agenti</button>
                <button onClick={() => setActiveTab('storage')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'storage' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>📦 Dropbox</button>
            </div>

            {activeTab === 'woo' && (
                <div className="space-y-6">
                    {/* FORMULÁR */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold mb-4">Pridať nový e-shop</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input value={newStore.name} onChange={e => setNewStore({...newStore, name: e.target.value})} placeholder="Názov webu (napr. Moja Svadba)" className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100" />
                            <input value={newStore.url} onChange={e => setNewStore({...newStore, url: e.target.value})} placeholder="URL (https://mojasvadba.sk)" className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100" />
                            <input value={newStore.ck} onChange={e => setNewStore({...newStore, ck: e.target.value})} placeholder="Consumer Key (ck_...)" type="password" className="p-3 border rounded-xl outline-none" />
                            <input value={newStore.cs} onChange={e => setNewStore({...newStore, cs: e.target.value})} placeholder="Consumer Secret (cs_...)" type="password" className="p-3 border rounded-xl outline-none" />
                        </div>
                        <button onClick={addStore} disabled={loading} className="mt-4 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50">
                            {loading ? 'Ukladám...' : '+ Pridať e-shop'}
                        </button>
                    </div>

                    {/* ZOZNAM */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b font-bold text-slate-500 text-[10px] uppercase tracking-widest">
                                <tr><th className="p-4">Názov</th><th className="p-4">URL</th><th className="p-4 text-right">Akcia</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stores.length === 0 ? (
                                    <tr><td colSpan={3} className="p-10 text-center text-slate-400 italic">Žiadne e-shopy.</td></tr>
                                ) : (
                                    stores.map(s => (
                                        <tr key={s.id}>
                                            <td className="p-4 font-bold">{s.name}</td>
                                            <td className="p-4 text-slate-500">{s.url}</td>
                                            <td className="p-4 text-right"><button className="text-red-500 font-bold text-xs uppercase hover:underline">Zmazať</button></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <DebugPanel title="Nastavenia" data={stores} error={null} loading={false} />
        </div>
    );
}