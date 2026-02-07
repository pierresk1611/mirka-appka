"use client";

import React, { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import Link from 'next/link';
import { Loader2, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface OrderItem {
  id: string;
  product_name_raw: string;
  template_key: string;
  status: string;
}

interface Order {
  id: string; // PWA UUID
  woo_id: number;
  customer_name: string;
  status: string;
  created_at: string;
  store: { name: string };
  items: OrderItem[];
}

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/orders/sync', { method: 'POST' });
      if (res.ok) {
        await fetchOrders();
      } else {
        alert('Sync failed');
      }
    } catch (error) {
      alert('Sync error');
    } finally {
      setSyncing(false);
    }
  };

  // Stats Calculation based on items
  const allItems = orders.flatMap(o => o.items);
  const stats = {
    pending: allItems.filter(i => i.status === 'PENDING' || i.status === 'AI_READY').length,
    processing: allItems.filter(i => i.status === 'GENERATING').length,
    done: allItems.filter(i => i.status === 'DONE').length,
    error: allItems.filter(i => i.status === 'ERROR').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AI_READY': return <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-100 uppercase">AI Hotovo</span>;
      case 'GENERATING': return <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded text-[10px] font-bold border border-orange-100 uppercase animate-pulse">Generujem</span>;
      case 'DONE': return <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded text-[10px] font-bold border border-green-100 uppercase">Hotovo</span>;
      case 'ERROR': return <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold border border-red-100 uppercase">Chyba</span>;
      default: return <span className="bg-gray-50 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold border border-gray-100 uppercase">Čaká</span>;
    }
  };

  return (
    <AppLayout>
      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Položky: Čaká</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Spracováva sa</p>
          <p className="text-3xl font-bold text-orange-500 mt-1">{stats.processing}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Hotovo</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{stats.done}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Chyby</p>
          <p className="text-3xl font-bold text-red-500 mt-1">{stats.error}</p>
        </div>
      </div>

      {/* ORDERS TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-bold text-lg text-slate-800">Aktuálne objednávky</h2>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-sm bg-white border border-gray-200 px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-gray-50 flex items-center gap-2 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-blue-600 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Aktualizujem...' : 'Vynútiť Sync zo všetkých webov'}
          </button>
        </div>

        {loading ? (
          <div className="p-20 flex justify-center text-slate-300">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
        ) : (
          <>
            <table className="hidden md:table w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b">
                  <th className="p-4">Zdroj</th>
                  <th className="p-4">ID</th>
                  <th className="p-4">Zákazník</th>
                  <th className="p-4">Dátum</th>
                  <th className="p-4">Položky v sade</th>
                  <th className="p-4 text-right">Akcia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {orders.length === 0 ? (
                  <tr><td colSpan={6} className="p-12 text-center text-slate-400 italic">Žiadne objednávky. Kliknite na "Sync".</td></tr>
                ) : orders.map(order => (
                  <tr key={order.id} className="hover:bg-blue-50/50 transition">
                    <td className="p-4">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-bold border border-blue-100">
                        {order.store.name}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900 font-mono">#{order.woo_id}</td>
                    <td className="p-4 font-medium text-slate-700">{order.customer_name}</td>
                    <td className="p-4 text-xs text-slate-500">
                      {new Date(order.created_at).toLocaleDateString('sk-SK')}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        {order.items.map(item => (
                          <div key={item.id} className="flex items-center gap-2">
                            {getStatusBadge(item.status)}
                            <span className="text-[11px] text-slate-600 truncate max-w-[150px]">{item.product_name_raw}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/orders/${order.id}`}>
                        <button className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition shadow-sm font-bold text-xs">
                          Upraviť Sadu
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* MOBILE VIEW */}
            <div className="md:hidden space-y-4 p-4 bg-gray-50">
              {orders.map((order) => (
                <div key={order.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">{order.store.name}</div>
                      <span className="text-lg font-bold text-slate-800">#{order.woo_id}</span>
                      <div className="text-sm font-medium text-slate-500">{order.customer_name}</div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('sk-SK')}
                    </div>
                  </div>

                  <div className="space-y-2 mb-6 bg-gray-50 p-3 rounded-lg">
                    {order.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-700 truncate">{item.product_name_raw}</span>
                        {getStatusBadge(item.status)}
                      </div>
                    ))}
                  </div>

                  <Link href={`/orders/${order.id}`} className="block">
                    <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800">
                      Otvoriť Sadu
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
