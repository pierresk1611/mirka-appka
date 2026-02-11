'use client';

import { useState } from 'react';
import DebugPanel from '@/components/DebugPanel';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('woo');
    
    // Stavy pre statusy botov
    const [status, setStatus] = useState({
        groq: 'idle', // idle | loading | success | error
        openai: 'idle',
        image: 'idle'
    });

    // Funkcia na testovanie bota
    const testAI = async (provider: 'groq' | 'openai' | 'image') => {
        setStatus(prev => ({ ...prev, [provider]: 'loading' }));
        
        try {
            // Tu bude Peter volať reálny backend /api/ai/test
            // Simulujeme 1.5 sekundovú odpoveď
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Náhodný úspech pre demo (v realite to povie API)
            setStatus(prev => ({ ...prev, [provider]: 'success' }));
        } catch (err) {
            setStatus(prev => ({ ...prev, [provider]: 'error' }));
        }
    };

    const StatusBadge = ({ state }: { state: string }) => {
        if (state === 'loading') return <span className="text-[9px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded animate-pulse">OVERUJEM...</span>;
        if (state === 'success') return <span className="text-[9px] bg-green-500 text-white px-2 py-0.5 rounded flex items-center gap-1">● SPOJENÉ</span>;
        if (state === 'error') return <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded flex items-center gap-1">● CHYBA KĽÚČA</span>;
        return <span className="text-[9px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded italic font-bold uppercase tracking-tight">Neoverené</span>;
    };

    return (
        <div className="p-8 max-w-6xl mx-auto font-sans">
            <div className="flex justify-between items-center mb-8 text-slate-800">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Nastavenia systému</h1>
                    <p className="text-slate-500 text-sm">Konfigurácia prepojení a AI agentov</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition">
                    Uložiť všetky zmeny
                </button>
            </div>

            <div className="flex gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl w-max shadow-inner">
                <button onClick={() => setActiveTab('woo')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'woo' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                    🔌 E-shopy (Woo)
                </button>
                <button onClick={() => setActiveTab('ai')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'ai' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                    🤖 AI Agenti
                </button>
                <button onClick={() => setActiveTab('storage')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'storage' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                    📦 Dropbox
                </button>
            </div>

            <div className="space-y-8">
                {/* TAB 1: WOOCOMMERCE */}
                {activeTab === 'woo' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">Pridať nový e-shop</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input placeholder="Názov webu" className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100" />
                                <input placeholder="URL adresa (https://...)" className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100" />
                                <input placeholder="Consumer Key" type="password" className="p-3 border rounded-xl outline-none" />
                                <input placeholder="Consumer Secret" type="password" className="p-3 border rounded-xl outline-none" />
                            </div>
                            <button className="mt-4 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-black transition">
                                + Pridať e-shop
                            </button>
                        </div>
                    </div>
                )}

                {/* TAB 2: AI AGENTS WITH STATUS */}
                {activeTab === 'ai' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* GROQ & OPENAI CARD */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
                            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                                <span className="bg-orange-100 p-2 rounded-lg text-orange-600 text-xs font-black italic">Groq</span> Text AI Konfigurácia
                            </h2>
                            <div className="space-y-6 flex-1">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Groq Cloud Key</label>
                                        <StatusBadge state={status.groq} />
                                    </div>
                                    <div className="flex gap-2">
                                        <input placeholder="gsk_..." type="password" className="flex-1 p-3 border rounded-xl outline-none text-sm font-mono bg-slate-50" />
                                        <button onClick={() => testAI('groq')} className="bg-slate-100 text-slate-600 px-4 rounded-xl text-xs font-bold hover:bg-slate-200 transition">Test</button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OpenAI Key (ChatGPT)</label>
                                        <StatusBadge state={status.openai} />
                                    </div>
                                    <div className="flex gap-2">
                                        <input placeholder="sk-proj-..." type="password" className="flex-1 p-3 border rounded-xl outline-none text-sm font-mono bg-slate-50" />
                                        <button onClick={() => testAI('openai')} className="bg-slate-100 text-slate-600 px-4 rounded-xl text-xs font-bold hover:bg-slate-200 transition">Test</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* IMAGE GENERATOR CARD */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
                            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                                <span className="bg-purple-100 p-2 rounded-lg text-purple-600 text-sm">🎨</span> Grafická AI Status
                            </h2>
                            <div className="space-y-6 flex-1">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Image API Provider</label>
                                        <StatusBadge state={status.image} />
                                    </div>
                                    <div className="flex gap-2">
                                        <select className="flex-1 p-3 border rounded-xl bg-slate-50 outline-none text-sm">
                                            <option>DALL-E 3 (OpenAI)</option>
                                            <option>Midjourney</option>
                                            <option>Stable Diffusion</option>
                                        </select>
                                        <button onClick={() => testAI('image')} className="bg-slate-100 text-slate-600 px-4 rounded-xl text-xs font-bold hover:bg-slate-200 transition">Test</button>
                                    </div>
                                    <input placeholder="Kľúč pre generovanie grafiky" type="password" className="w-full p-3 border rounded-xl outline-none text-sm font-mono mt-2" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: DROPBOX */}
                {activeTab === 'storage' && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-2xl">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">Dropbox Sync</h2>
                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex justify-between items-center mb-6">
                            <div className="text-sm text-green-800 font-bold">Status: Synchronizované</div>
                            <button className="text-xs bg-white border border-green-300 text-green-700 px-3 py-1 rounded-lg font-bold uppercase shadow-sm">Zmeniť účet</button>
                        </div>
                        <div className="space-y-4">
                            <input defaultValue="/AutoDesign/Templates" className="w-full p-3 border rounded-xl outline-none font-mono text-xs bg-slate-50" />
                            <input defaultValue="/AutoDesign/Output" className="w-full p-3 border rounded-xl outline-none font-mono text-xs bg-slate-50" />
                        </div>
                    </div>
                )}
            </div>

            <DebugPanel title="Nastavenia" data={status} error={null} loading={false} />
        </div>
    );
}