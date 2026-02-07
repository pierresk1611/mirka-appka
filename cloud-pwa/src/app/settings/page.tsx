"use client";

import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/AppLayout';
import { Settings, Save, Loader2, Key, Globe, Folder, Database, Wifi } from 'lucide-react';

export default function SettingsPage() {
    const [config, setConfig] = useState({
        WOO_URL: '',
        WOO_CK: '',
        WOO_CS: '',
        WOO_API_KEY: '', // Plugin Key (was AUTODESIGN_API_KEY)
        OPENAI_API_KEY: '',
        DROPBOX_ACCESS_TOKEN: '',
        DROPBOX_PATH: '/Users/apple/Dropbox/TEMPLATES'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testingWoo, setTestingWoo] = useState(false);
    const [testingDropbox, setTestingDropbox] = useState(false);
    const [syncingDropbox, setSyncingDropbox] = useState(false);

    // Fetch initial settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    setConfig(prev => ({ ...prev, ...data }));
                }
            } catch (error) {
                console.error("Failed to load settings");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConfig({ ...config, [e.target.name]: e.target.value });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = Object.entries(config).map(([key, value]) => ({ key, value }));

            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('Nastavenia boli uložené.');
            } else {
                alert('Chyba pri ukladaní.');
            }
        } catch (error) {
            console.error(error);
            alert('Chyba spojenia.');
        } finally {
            setSaving(false);
        }
    };

    const handleTestWoo = async () => {
        setTestingWoo(true);
        try {
            const res = await fetch('/api/settings/test-woo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wooUrl: config.WOO_URL,
                    wooCk: config.WOO_CK,
                    wooCs: config.WOO_CS
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(`✅ ${data.message}`);
            } else {
                alert(`❌ Chyba: ${data.error} \n ${JSON.stringify(data.details)}`);
            }
        } catch (error) {
            alert('❌ Chyba: Network Error');
        } finally {
            setTestingWoo(false);
        }
    };

    const handleTestDropbox = async () => {
        setTestingDropbox(true);
        try {
            // Test by listing just the root folder without syncing anything
            const res = await fetch('/api/templates/dropbox?test=true');
            const data = await res.json();
            if (res.ok && data.success) {
                alert(`✅ Dropbox Pripojený: Nájdených ${data.count} položiek.`);
            } else {
                const details = data.details ? `\n\nDetaily: ${JSON.stringify(data.details)}` : '';
                alert(`❌ Chyba: ${data.error || 'Nepodarilo sa pripojiť k Dropboxu.'}${details}`);
            }
        } catch (error) {
            alert('❌ Chyba: Network Error');
        } finally {
            setTestingDropbox(false);
        }
    };

    const handleSyncDropbox = async () => {
        setSyncingDropbox(true);
        try {
            // 1. Save settings first to ensure token/path is current
            const payload = Object.entries(config).map(([key, value]) => ({ key, value }));
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // 2. Trigger sync
            const res = await fetch('/api/templates/dropbox');
            const data = await res.json();

            if (res.ok && data.success) {
                alert(`✅ Sync Dokončený: ${data.count} šablón pripravených.`);
            } else {
                const details = data.details ? `\n\nDetaily: ${JSON.stringify(data.details)}` : '';
                alert(`❌ Chyba Syncu: ${data.error || 'Neznáma chyba'}${details}`);
            }
        } catch (error) {
            alert('❌ Chyba: Nepodarilo sa spojiť s API.');
        } finally {
            setSyncingDropbox(false);
        }
    };

    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Nastavenia</h2>
            </div>

            <div className="max-w-4xl mx-auto pb-10">
                <form onSubmit={handleSave} className="space-y-6">

                    {/* 1. Prepojenia / Integrations */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Prepojenie s E-shopom</h3>
                                <p className="text-sm text-gray-500">Konfigurácia WooCommerce Pluginu a API.</p>
                            </div>
                        </div>
                        <div className="grid gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">WooCommerce URL</label>
                                <input
                                    name="WOO_URL"
                                    value={config.WOO_URL}
                                    onChange={handleChange}
                                    placeholder="https://mojeshop.sk"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Consumer Key (CK)</label>
                                    <input
                                        name="WOO_CK"
                                        value={config.WOO_CK}
                                        onChange={handleChange}
                                        placeholder="ck_..."
                                        type="password"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Consumer Secret (CS)</label>
                                    <input
                                        name="WOO_CS"
                                        value={config.WOO_CS}
                                        onChange={handleChange}
                                        placeholder="cs_..."
                                        type="password"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <span className="text-sm text-gray-600">Otestovať spojenie s API kľúčmi</span>
                                <button
                                    type="button"
                                    onClick={handleTestWoo}
                                    disabled={testingWoo}
                                    className="text-sm bg-white border border-gray-300 px-4 py-2 rounded font-medium shadow-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                    {testingWoo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4 text-green-600" />}
                                    Otestovať spojenie
                                </button>
                            </div>

                            <hr className="border-gray-100" />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Plugin Update Key (X-AutoDesign-Key)</label>
                                <input
                                    name="WOO_API_KEY"
                                    value={config.WOO_API_KEY}
                                    onChange={handleChange}
                                    placeholder="Secret key nastavený vo WP configu"
                                    type="password"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                />
                                <p className="text-xs text-gray-400 mt-1">Tento kľúč slúži na komunikáciu s naším pluginom (zmena statusu).</p>
                            </div>
                        </div>
                    </div>

                    {/* 2. Dropbox & Agent */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                <Folder className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Dropbox API</h3>
                                <p className="text-sm text-gray-500">Cloud synchronizácia šablón pre PWA.</p>
                            </div>
                        </div>
                        <div className="grid gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Dropbox Access Token</label>
                                <input
                                    name="DROPBOX_ACCESS_TOKEN"
                                    value={config.DROPBOX_ACCESS_TOKEN}
                                    onChange={handleChange}
                                    type="password"
                                    placeholder="sl..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                />
                                <p className="text-xs text-gray-400 mt-1">Získajte v Dropbox Console (App Console).</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Root cesta k šablónam</label>
                                <input
                                    name="DROPBOX_PATH"
                                    value={config.DROPBOX_PATH}
                                    onChange={handleChange}
                                    placeholder="/TEMPLATES"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                />
                            </div>

                            <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <button
                                    type="button"
                                    onClick={handleTestDropbox}
                                    disabled={testingDropbox}
                                    className="text-sm bg-white border border-gray-300 px-4 py-2 rounded font-medium shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2"
                                >
                                    {testingDropbox ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4 text-blue-600" />}
                                    Test Pripojenia
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSyncDropbox}
                                    disabled={syncingDropbox}
                                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded font-medium shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:bg-blue-300"
                                >
                                    {syncingDropbox ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Synchronizovať Šablóny
                                </button>
                            </div>
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                            />
                            <p className="text-xs text-gray-400 mt-1">Získajte v <a href="https://console.groq.com/keys" target="_blank" className="text-blue-500 underline">Groq Console</a>.</p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={saving || loading}
                            className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl hover:bg-slate-700 transition font-bold shadow-lg disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {saving ? 'Ukladám...' : 'Uložiť všetky nastavenia'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
