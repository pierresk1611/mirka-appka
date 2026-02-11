'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DebugPanel from '@/components/DebugPanel';

export default function Dashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // 1. Načítanie ROZPRACOVANÝCH objednávok z databázy
  const fetchOrders = async () => {
    try {
      setLoading(true);
      // ZMENA: Tu filtrujeme stavy, ktoré chceme vidieť na Dashboarde
      const res = await fetch('/api/orders?status=PENDING,AI_READY,GENERATING,ERROR');
      if (!res.ok) throw new Error('Chyba pri načítaní objednávok');
      const data = await res.json();
      setOrders(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Spustenie synchronizácie s WooCommerce
  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await fetch('/api/orders/sync', { method: 'POST' });
      if (!res.ok) throw new Error('Sync zlyhal');
      alert('Synchronizácia úspešne dokončená!');
      fetchOrders(); 
    } catch (err: any) {
      alert('Chyba pri synchronizácii: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Štatistiky počítame len z toho, čo sa reálne načítalo na Dashboard
  const stats = {
    pending: orders.filter(o => o.status === 'PENDING').length,
    ai_ready: orders.filter(o => o.status === 'AI_READY').length,
    generating: orders.filter(o => o.status === 'GENERATING').length,
    error: orders.filter(o => o.status === 'ERROR').length,
  };

  return (
    <div className="p-8 font-sans">
      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Nové / Čaká</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-purple-500">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">🤖 AI Hotovo</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">{stats.ai_ready}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">⚙️ V procese</p>
          <p className="text-3xl font-bold text-orange-500 mt-1">{stats.generating}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">⚠️ Chyby</p>
          <p className="text-3xl font-bold text-red-500 mt-1">{stats.error}</p>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-bold text-lg text-slate-800">Aktuálne objednávky</h2>
          <button 
            onClick={handleSync}
            disabled={syncing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm ${
              syncing ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {syncing ? <span className="animate-spin">🔄</span> : <span>🔄</span>}
            {syncing ? 'Synchronizujem...' : 'Vynútiť Sync z webov'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-slate-500 text-[10px] uppercase tracking-widest border-b font-bold font-mono">
                <th className="p-4">Objednávka</th>
                <th className="p-4">Zákazník</th>
                <th className="p-4">Šablóna</th>
                <th className="p-4">Stav spracovania</th>
                <th className="p-4 text-right">Akcia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-400 italic">Načítavam rozpracované objednávky...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-500 font-medium">
                    🙌 Žiadne rozpracované objednávky. Všetko je v Histórii!
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition border-l-4 border-transparent hover:border-blue-500">
                    <td className="p-4 font-bold text-slate-900 font-mono">#{order.woo_id}</td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-700">{order.customer_name}</div>
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[11px] font-bold border border-slate-200">
                        {order.items?.[0]?.template_key || 'FINGERPRINTS'}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-bold uppercase tracking-tight">
                      {order.status === 'PENDING' && <span className="text-yellow-600">⏳ Čaká</span>}
                      {order.status === 'AI_READY' && <span className="text-purple-600">🤖 AI Hotovo</span>}
                      {order.status === 'GENERATING' && <span className="text-orange-500 animate-pulse">⚙️ Photoshop...</span>}
                      {order.status === 'ERROR' && <span className="text-red-600">⚠️ Chyba</span>}
                    </td>
                    <td className="p-4 text-right">
                      <Link 
                        href={`/orders/${order.id}`}
                        className="bg-slate-800 text-white px-4 py-2 rounded shadow-sm hover:bg-black transition text-xs font-bold"
                      >
                        Skontrolovať
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DebugPanel title="Dashboard (Rozpracované)" data={orders} error={error} loading={loading} />
    </div>
  );
}