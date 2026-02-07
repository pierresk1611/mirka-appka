"use client";

import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/AppLayout';
import { Settings, Save, Loader2, Key, Globe, Folder, Database, Wifi, Plus, Trash2, Layout } from 'lucide-react';

interface Store {
    id: string;
    name: string;
    url: string;
    consumer_key: string;
    consumer_secret: string;
    api_key?: string;
}

export default function SettingsPage() {
    const [config, setConfig] = useState({
        OPENAI_API_KEY: '',
        DROPBOX_ACCESS_TOKEN: '',
        DROPBOX_PATH: '/Users/apple/Dropbox/TEMPLATES',
        SHEET_SIZE: 'SRA3' // Default
    });

    const [stores, setStores] = useState<Store[]>([]);
    const [newStore, setNewStore] = useState({
        name: '',
        url: '',
        consumer_key: '',
        consumer_secret: '',
        api_key: ''
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [addingStore, setAddingStore] = useState(false);
    const [testingWoo, setTestingWoo] = useState<string | null>(null);
    const [testingDropbox, setTestingDropbox] = useState(false);
    const [syncingDropbox, setSyncingDropbox] = useState(false);

    // Fetch initial settings and stores
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [settingsRes, storesRes] = await Promise.all([
                    fetch('/api/settings'),
                    fetch('/api/stores')
                ]);

                if (settingsRes.ok) {
                    const settingsData = await settingsRes.json();
                    setConfig(prev => ({ ...prev, ...settingsData }));
                }
                if (storesRes.ok) {
                    const storesData = await storesRes.json();
                    setStores(storesData);
                }
            } catch (error) {
                console.error("Failed to load settings data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setConfig({ ...config, [e.target.name]: e.target.value });
    };

    const handleNewStoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewStore({ ...newStore, [e.target.name]: e.target.value });
    };

    const handleSaveGlobal = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = Object.entries(config).map(([key, value]) => ({ key, value }));
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) alert('Globálne nastavenia boli uložené.');
            else alert('Chyba pri ukladaní.');
        } catch (error) {
            alert('Chyba spojenia.');
        } finally {
            setSaving(false);
        }
    };

    const handleAddStore = async () => {
        setAddingStore(true);
        try {
            const res = await fetch('/api/stores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStore)
            });
            if (res.ok) {
                const added = await res.json();
                setStores([added, ...stores]);
                setNewStore({ name: '', url: '', consumer_key: '', consumer_secret: '', api_key: '' });
                alert('E-shop bol pridaný.');
            } else {
                alert('Nepodarilo sa pridať e-shop.');
            }
        } catch (error) {
            alert('Chyba spojenia.');
        } finally {
            setAddingStore(false);
        }
    };

    const handleDeleteStore = async (id: string) => {
        if (!confirm('Naozaj chcete zmazať tento e-shop?')) return;
        try {
            const res = await fetch(`/api/stores/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setStores(stores.filter(s => s.id !== id));
            }
        } catch (error) {
            alert('Chyba spojenia.');
        }
    };

    const handleTestStore = async (store: Store) => {
        setTestingWoo(store.id);
        try {
            const res = await fetch('/api/settings/test-woo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    支撑Url: store.url, // Still using the same key name as the API expects if it was defined that way, but let's check
                    wooUrl: store.url,
                    wooCk: store.consumer_key,
                    wooCs: store.consumer_secret
                })
            });
            const data = await res.json();
            if (res.ok && data.success) alert(`✅ Pripojenie k "${store.name}" je úspešné!`);
            else alert(`❌ Chyba "${store.name}": ${data.error || 'Neznáma chyba'}`);
        } catch (error) {
            alert('❌ Chyba: Spojenie zlyhalo');
        } finally {
            setTestingWoo(null);
        }
    };

    const handleTestDropbox = async () => {
        setTestingDropbox(true);
        try {
            const res = await fetch('/api/templates/dropbox?test=true');
            const data = await res.json();
            if (res.ok && data.success) alert(`✅ Dropbox Pripojený: Nájdených ${data.count} položiek.`);
            else alert(`❌ Chyba: ${data.error}`);
        } catch (error) {
            alert('❌ Chyba: Network Error');
        } finally {
            setTestingDropbox(false);
        }
    };

    const handleSyncDropbox = async () => {
        setSyncingDropbox(true);
        try {
            const res = await fetch('/api/templates/dropbox');
            const data = await res.json();
            if (res.ok && data.success) alert(`✅ Sync Dokončený: ${data.count} šablón pripravených.`);
            else alert(`❌ Chyba Syncu: ${data.error}`);
        } catch (error) {
            alert('❌ Chyba: Nepodarilo sa spojiť s API.');
        } finally {
            setSyncingDropbox(false);
        }
    };

    if (loading) return <AppLayout><div className="p-10 text-center">Načítavam nastavenia...</div></AppLayout>;

    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Nastavenia</h2>
            </div>

            <div className="max-w-4xl mx-auto pb-20 space-y-8">

                {/* 1. Multi-Store Management */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                            <Globe className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Správa E-shopov</h3>
                            <p className="text-sm text-gray-500">Môžete pridať viacero WooCommerce obchodov.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* List of Stores */}
                        <div className="grid gap-4">
                            {stores.length === 0 && <p className="text-gray-400 text-sm italic">Zatiaľ nie sú pridané žiadne e-shopy.</p>}
                            {stores.map(store => (
                                <div key={store.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 group">
                                    <div>
                                        <div className="font-bold text-slate-800">{store.name}</div>
                                        <div className="text-xs text-gray-500 font-mono">{store.url}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleTestStore(store)}
                                            disabled={testingWoo === store.id}
                                            className="p-2 text-gray-400 hover:text-green-600 transition"
                                        >
                                            {testingWoo === store.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wifi className="w-5 h-5" />}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteStore(store.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 transition"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <hr className="border-gray-100" />

                        {/* Add New Store Form */}
                        <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300">
                            <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Pridať nový e-shop
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input name="name" value={newStore.name} onChange={handleNewStoreChange} placeholder="Názov (napr. Svadobky.sk)" className="px-4 py-2 border border-gray-300 rounded-lg text-sm" />
                                <input name="url" value={newStore.url} onChange={handleNewStoreChange} placeholder="URL (https://...)" className="px-4 py-2 border border-gray-300 rounded-lg text-sm" />
                                <input name="consumer_key" value={newStore.consumer_key} onChange={handleNewStoreChange} placeholder="Consumer Key (ck_...)" type="password" className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono" />
                                <input name="consumer_secret" value={newStore.consumer_secret} onChange={handleNewStoreChange} placeholder="Consumer Secret (cs_...)" type="password" className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono" />
                                <input name="api_key" value={newStore.api_key} onChange={handleNewStoreChange} placeholder="Plugin Key (X-AutoDesign-Key)" type="password" className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono md:col-span-2" />
                            </div>
                            <button
                                onClick={handleAddStore}
                                disabled={addingStore || !newStore.name || !newStore.url}
                                className="mt-4 w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition"
                            >
                                {addingStore ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Pridať E-shop'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Global Imposition Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                        <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                            <Layout className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Geometria a Vyraďovanie</h3>
                            <p className="text-sm text-gray-500">Nastavenia hárkov pre tlač.</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Globálny Tlačový Hárok</label>
                        <select
                            name="SHEET_SIZE"
                            value={config.SHEET_SIZE}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="SRA3">SRA3 (320 x 450 mm)</option>
                            <option value="A4">A4 (210 x 297 mm)</option>
                            <option value="A3">A3 (297 x 420 mm)</option>
                        </select>
                        <p className="text-xs text-gray-400 mt-2 italic">Agent použije tento rozmer pri generovaní hárka so spadávkou.</p>
                    </div>
                </div>

                {/* 3. AI Keys */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                        <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                            <Database className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">AI Spracovanie (Groq)</h3>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Groq API Key</label>
                        <input
                            name="OPENAI_API_KEY"
                            value={config.OPENAI_API_KEY}
                            onChange={handleChange}
                            type="password"
                            placeholder="gsk_..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                        />
                    </div>
                </div>

                {/* 4. Dropbox */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                            <Folder className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Dropbox & Šablóny</h3>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Dropbox Token</label>
                            <input
                                name="DROPBOX_ACCESS_TOKEN"
                                value={config.DROPBOX_ACCESS_TOKEN}
                                onChange={handleChange}
                                type="password"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Root Path</label>
                            <input
                                name="DROPBOX_PATH"
                                value={config.DROPBOX_PATH}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                            />
                        </div>
                        <div className="pt-2 flex gap-4">
                            <button onClick={handleTestDropbox} disabled={testingDropbox} className="flex-1 border border-gray-300 py-2 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2">
                                {testingDropbox ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />} Test
                            </button>
                            <button onClick={handleSyncDropbox} disabled={syncingDropbox} className="flex-1 bg-slate-800 text-white py-2 rounded-lg font-medium hover:bg-slate-700 flex items-center justify-center gap-2">
                                {syncingDropbox ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Sync Šablón
                            </button>
                        </div>
                    </div>
                </div>

                {/* Save All */}
                <div className="sticky bottom-6 flex justify-end">
                    <button
                        onClick={handleSaveGlobal}
                        disabled={saving}
                        className="bg-slate-900 text-white px-10 py-4 rounded-2xl hover:bg-slate-700 transition font-bold shadow-2xl flex items-center gap-3 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                        Uložiť nastavenia (AI, Dropbox, Hárok)
                    </button>
                </div>

            </div>
        </AppLayout>
    );
}
