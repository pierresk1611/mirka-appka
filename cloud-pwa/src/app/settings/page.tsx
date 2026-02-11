'use client';

import { useState } from 'react';
import DebugPanel from '@/components/DebugPanel';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('woo');
    
    // Reálne stavy pre kľúče
    const [keys, setKeys] = useState({ groq: '', openai: '', image: '' });
    const [status, setStatus] = useState({ groq: 'idle', openai: 'idle', image: 'idle' });

    const testAI = async (provider: 'groq' | 'openai' | 'image') => {
        const keyToTest = keys[provider];
        if (!keyToTest) {
            alert('Najprv vlož API kľúč!');
            return;
        }

        setStatus(prev => ({ ...prev, [provider]: 'loading' }));
        
        try {
            const res = await fetch('/api/ai/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider, apiKey: keyToTest })
            });
            
            const data = await res.json();
            setStatus(prev => ({ ...prev, [provider]: data.success ? 'success' : 'error' }));
            
            if (!data.success) alert('Chyba: ' + data.error);
        } catch (err) {
            setStatus(prev => ({ ...prev, [provider]: 'error' }));
        }
    };

    const StatusBadge = ({ state }: { state: string }) => {
        if (state === 'loading') return <span className="text-[9px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded animate-pulse font-bold">OVERUJEM...</span>;
        if (state === 'success') return <span className="text-[9px] bg-green-500 text-white px-2 py-0.5 rounded flex items-center gap-1 font-bold tracking-tight">● SPOJENÉ</span>;
        if (state === 'error') return <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded flex items-center gap-1 font-bold tracking-tight">● CHYBA</span>;
        return <span className="text-[9px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded italic font-bold uppercase tracking-tight">Neoverené</span>;
    };

    return (
        <div className="p-8 max-w-6xl mx-auto font-sans">
            <h1 className="text-3xl font-black mb-8">Nastavenia systému</h1>

            <div className="flex gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl w-max">
                <button onClick={() => setActiveTab('woo')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'woo' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>🔌 E-shopy</button>
                <button onClick={() => setActiveTab('ai')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'ai' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>🤖 AI Agenti</button>
                <button onClick={() => setActiveTab('storage')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'storage' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>📦 Dropbox</button>
            </div>

            {activeTab === 'ai' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold mb-6 text-slate-800 italic">Groq & OpenAI (Text)</h2>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Groq Cloud Key</label>
                                    <StatusBadge state={status.groq} />
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                        type="password" 
                                        value={keys.groq}
                                        onChange={(e) => setKeys({...keys, groq: e.target.value})}
                                        placeholder="gsk_..." 
                                        className="flex-1 p-3 border rounded-xl outline-none font-mono text-xs bg-slate-50" 
                                    />
                                    <button onClick={() => testAI('groq')} className="bg-slate-900 text-white px-4 rounded-xl text-xs font-bold hover:bg-black transition">Test</button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OpenAI Key</label>
                                    <StatusBadge state={status.openai} />
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                        type="password" 
                                        value={keys.openai}
                                        onChange={(e) => setKeys({...keys, openai: e.target.value})}
                                        placeholder="sk-proj-..." 
                                        className="flex-1 p-3 border rounded-xl outline-none font-mono text-xs bg-slate-50" 
                                    />
                                    <button onClick={() => testAI('openai')} className="bg-slate-900 text-white px-4 rounded-xl text-xs font-bold hover:bg-black transition">Test</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Ostatné taby (Woo, Dropbox) nechať ako boli */}

            <DebugPanel title="Nastavenia" data={status} error={null} loading={false} />
        </div>
    );
}