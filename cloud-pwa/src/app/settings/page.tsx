'use client';
import { useState } from 'react';
import DebugPanel from '@/components/DebugPanel';

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Nastavenia systému</h1>
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg">Uložiť zmeny</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-600">
                        <span>🔌</span> WooCommerce API
                    </h2>
                    <div className="space-y-4">
                        <input placeholder="E-shop URL (https://...)" className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-100" />
                        <input placeholder="Consumer Key (ck_...)" type="password" className="w-full p-2.5 border rounded-lg outline-none" />
                        <input placeholder="Consumer Secret (cs_...)" type="password" className="w-full p-2.5 border rounded-lg outline-none" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-orange-600">
                        <span>🤖</span> OpenAI Config
                    </h2>
                    <div className="space-y-4">
                        <input placeholder="OpenAI API Key (sk-...)" type="password" className="w-full p-2.5 border rounded-lg outline-none" />
                        <select className="w-full p-2.5 border rounded-lg bg-white outline-none">
                            <option>gpt-4o (High Quality)</option>
                            <option>gpt-4o-mini (Fast & Cheap)</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <DebugPanel title="Nastavenia" data={null} error={null} loading={loading} />
        </div>
    );
}