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
                                <h3 className="text-lg font-bold text-gray-900">Dropbox & Agent</h3>
                                <p className="text-sm text-gray-500">Cloud úložisko a lokálny agent.</p>
                            </div>
                        </div>
                        <div className="grid gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Dropbox Access Token (App)</label>
                                <input
                                    name="DROPBOX_ACCESS_TOKEN"
                                    value={config.DROPBOX_ACCESS_TOKEN}
                                    onChange={handleChange}
                                    type="password"
                                    placeholder="sl..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                />
                                <p className="text-xs text-gray-400 mt-1">Token pre PWA na čítanie šablón.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Lokálna cesta (Dropbox Path)</label>
                                <input
                                    name="DROPBOX_PATH"
                                    value={config.DROPBOX_PATH}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                />
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
                                <h3 className="text-lg font-bold text-gray-900">AI Spracovanie</h3>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">OpenAI API Key</label>
                            <input
                                name="OPENAI_API_KEY"
                                value={config.OPENAI_API_KEY}
                                onChange={handleChange}
                                type="password"
                                placeholder="sk-..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                            />
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
