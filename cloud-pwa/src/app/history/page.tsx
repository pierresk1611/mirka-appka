'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DebugPanel from '@/components/DebugPanel';

export default function HistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      // Pýtame sa API na objednávky, ktoré majú status DONE
      const res = await fetch('/api/orders?status=DONE');
      if (!res.ok) throw new Error('Chyba pri načítaní histórie');
      const data = await res.json();
      setOrders(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span>📜</span> História objednávok
          </h1>
          <div className="text-sm text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Spolu dokončených: {orders.length}
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-gray-50 border-b font-bold">
                <tr className="text-slate-500 text-[10px] uppercase tracking-widest">
                    <th className="p-4">Objednávka</th>
                    <th className="p-4">Zákazník</th>
                    <th className="p-4">Šablóna</th>
                    <th className="p-4">Dátum dokončenia</th>
                    <th className="p-4 text-right">Akcia</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
                {loading ? (
                    <tr><td colSpan={5} className="p-20 text-center text-slate-400 italic font-sans">Načítavam históriu...</td></tr>
                ) : orders.length === 0 ? (
                    <tr><td colSpan={5} className="p-20 text-center text-slate-400 italic font-sans font-bold">Zatiaľ nie sú žiadne dokončené objednávky.</td></tr>
                ) : (
                    orders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50 transition border-l-4 border-transparent hover:border-green-500">
                            <td className="p-4 font-bold text-slate-900 font-mono">#{order.woo_id}</td>
                            <td className="p-4 font-semibold text-slate-700">{order.customer_name}</td>
                            <td className="p-4">
                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[11px] font-bold border border-slate-200">
                                    {order.items?.[0]?.template_key || 'N/A'}
                                </span>
                            </td>
                            <td className="p-4 text-slate-500">
                                {new Date(order.updatedAt).toLocaleDateString('sk-SK')} 
                                <span className="text-[10px] ml-1 opacity-50">{new Date(order.updatedAt).toLocaleTimeString('sk-SK', {hour: '2-digit', minute:'2-digit'})}</span>
                            </td>
                            <td className="p-4 text-right">
                                <Link 
                                    href={`/orders/${order.id}`}
                                    className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase tracking-wider underline decoration-2 underline-offset-4"
                                >
                                    Pozrieť detail
                                </Link>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>

      <DebugPanel title="História" data={orders} error={error} loading={loading} />
    </div>
  );
}