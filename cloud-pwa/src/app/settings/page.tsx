"use client";

import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/AppLayout';
import { Settings, Save, Loader2, Key, Globe, Folder, Database } from 'lucide-react';

export default function SettingsPage() {
    const [config, setConfig] = useState({
        WOO_URL: '',
        AUTODESIGN_API_KEY: '',
        OPENAI_API_KEY: '',
        DROPBOX_PATH: '/Users/apple/Dropbox/TEMPLATES'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch initial settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    // Merge with defaults
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
            // Convert to array of { key, value }
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

    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Nastavenia</h2>
            </div>

            <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSave} className="space-y-6">

                    {/* 1. Prepojenia / Integrations */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Prepojenie s E-shopom</h3>
                                <p className="text-sm text-gray-500">Konfigurácia WooCommerce Pluginu.</p>
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Plugin API Key (X-AutoDesign-Key)</label>
                                <input
                                    name="AUTODESIGN_API_KEY"
                                    value={config.AUTODESIGN_API_KEY}
                                    onChange={handleChange}
                                    placeholder="Secret key nastavený vo WP configu"
                                    type="password"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 2. AI Brain */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                                <Database className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">AI Spracovanie</h3>
                                <p className="text-sm text-gray-500">Kľúče pre analýzu textu.</p>
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

                    {/* 3. Local Agent */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                                <Folder className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Lokálny Agent</h3>
                                <p className="text-sm text-gray-500">Cesty k súborom na Macu.</p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Dropbox Templates Path</label>
                            <input
                                name="DROPBOX_PATH"
                                value={config.DROPBOX_PATH}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
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
