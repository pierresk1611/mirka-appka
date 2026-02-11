'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import DebugPanel from '@/components/DebugPanel';

export default function Dashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders?status=PENDING,AI_READY,GENERATING,ERROR');
      if (!res.ok) throw new Error('Chyba pri načítaní');
      const data = await res.json();
      setOrders(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  // Helper pre farby WooCommerce statusu
  const getWooStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'processing': return 'bg-green-100 text-green-700 border-green-200';
      case 'on-hold': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-6">
      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Nové objednávky</p>
            <p className="text-2xl font-bold text-blue-600">{orders.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center border-l-4 border-l-purple-500">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">🤖 AI Pripravené</p>
            <p className="text-2xl font-bold text-purple-600">{orders.filter(o => o.status === 'AI_READY').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center border-l-4 border-l-orange-500">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">⚙️ V procese</p>
            <p className="text-2xl font-bold text-orange-500">{orders.filter(o => o.status === 'GENERATING').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center border-l-4 border-l-red-500">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">⚠️ Chyby</p>
            <p className="text-2xl font-bold text-red-500">{orders.filter(o => o.status === 'ERROR').length}</p>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <h2 className="font-extrabold text-slate-800 tracking-tight">Aktuálna fronta k spracovaniu</h2>
          <button onClick={fetchOrders} className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg text-xs font-bold uppercase transition">
            🔄 Obnoviť zoznam
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b">
                <th className="p-4">ID / Zdrojový Web</th>
                <th className="p-4">Zákazník</th>
                <th className="p-4 text-center">Položky</th>
                <th className="p-4 text-center">Celkom ks</th>
                <th className="p-4 text-right">Cena</th>
                <th className="p-4">E-shop Status</th>
                <th className="p-4">Stav Autopilota</th>
                <th className="p-4 text-right">Akcia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="p-20 text-center italic text-slate-400">Načítavam dáta...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={8} className="p-20 text-center text-slate-300 font-bold uppercase tracking-tighter italic">Žiadne nové objednávky</td></tr>
              ) : (
                orders.map((order) => {
                  const totalKs = order.items?.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0);
                  return (
                    <tr key={order.id} className="hover:bg-blue-50/40 transition group">
                      <td className="p-4">
                        <div className="font-bold text-slate-900 font-mono">#{order.woo_id}</div>
                        <div className="text-[10px] text-blue-600 font-extrabold uppercase">{order.store?.name || 'MOJASVADBA'}</div>
                      </td>
                      <td className="p-4 font-bold text-slate-700">{order.customer_name}</td>
                      <td className="p-4 text-center text-slate-400 font-bold">{order.items?.length || 0}x</td>
                      <td className="p-4 text-center font-black text-slate-600">
                        <span className="bg-white px-2 py-1 rounded-lg border shadow-sm">{totalKs || 0} ks</span>
                      </td>
                      <td className="p-4 text-right font-bold text-slate-900">{order.total_price || '0.00'}€</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md border ${getWooStatusStyle(order.woo_status)}`}>
                          {order.woo_status || 'PROCESSING'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md border ${
                          order.status === 'AI_READY' ? 'bg-purple-600 text-white border-purple-700' : 
                          order.status === 'ERROR' ? 'bg-red-600 text-white border-red-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {order.status === 'AI_READY' ? '🤖 AI OK' : order.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Link href={`/orders/${order.id}`} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-blue-600 transition shadow-md">
                          Skontrolovať
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <DebugPanel title="Dashboard" data={orders} error={error} loading={loading} />
    </div>
  );
}