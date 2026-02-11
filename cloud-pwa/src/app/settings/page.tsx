'use client';
import { useState, useEffect } from 'react';
import DebugPanel from '@/components/DebugPanel'; // Použijeme zavináč @ pre istotu

export default function SettingsPage() {
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-slate-800 font-sans">Nastavenia e-shopov</h1>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                <h2 className="text-lg font-bold mb-4">Pridať nový e-shop</h2>
                <div className="p-4 bg-gray-50 border border-dashed rounded text-center text-slate-400">
                    [ Tu sa zobrazí formulár ]
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-slate-800">
                <div className="p-4 bg-gray-50 border-b font-bold uppercase text-xs">Aktuálne prepojenia</div>
                <div className="p-10 text-center text-gray-400 italic font-sans">
                    Žiadne e-shopy nie sú pripojené.
                </div>
            </div>
            
            <DebugPanel title="Nastavenia" data={stores} error={null} loading={loading} />
        </div>
    );
}