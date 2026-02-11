'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/Layout';
import DebugPanel from '@/components/DebugPanel';

export default function SettingsPage() {
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Načítanie obchodov z API
    const fetchStores = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/stores');
            if (!res.ok) throw new Error('Nepodarilo sa načítať obchody');
            const data = await res.json();
            setStores(Array.isArray(data) ? data : []); // Bezpečná kontrola poľa
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStores(); }, []);

    return (
        <AppLayout>
            <div className="p-6 max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Nastavenia e-shopov</h1>
                
                {/* Sekcia pre pridanie obchodu - VŽDY VIDITEĽNÁ */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                    <h2 className="text-lg font-bold mb-4">Pridať nový e-shop</h2>
                    <p className="text-sm text-gray-500 mb-4 font-bold text-red-600">
                        Sem vlož údaje zo svojho WooCommerce (REST API kľúče).
                    </p>
                    {/* Tu by mal byť Petrov formulár, ak ho tam má. 
                        Ak nie, tento text potvrdzuje, že stránka žije. */}
                    <div className="p-4 bg-gray-50 border border-dashed rounded text-center">
                        [ Tu sa zobrazí formulár pre pridanie e-shopu ]
                    </div>
                </div>

                {/* Zoznam obchodov - S OCHRANOU PROTI PENDING */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b font-bold uppercase text-xs">Aktuálne prepojenia</div>
                    {loading ? (
                        <div className="p-10 text-center">Načítavam dáta z databázy...</div>
                    ) : stores.length === 0 ? (
                        <div className="p-10 text-center text-gray-400 italic">Žiadne e-shopy nie sú pripojené. Pridajte prvý vyššie.</div>
                    ) : (
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-gray-100">
                                {stores.map((store) => (
                                    <tr key={store.id}>
                                        <td className="p-4 font-medium">{store.name}</td>
                                        <td className="p-4 text-gray-500">{store.url}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                
                <DebugPanel title="Nastavenia" data={stores} error={error} loading={loading} />
            </div>
        </AppLayout>
    );
}