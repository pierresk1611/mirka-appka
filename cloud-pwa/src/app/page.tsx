"use client";

import React from 'react';
import AppLayout from '../components/AppLayout';

"use client";

import React, { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { Loader2, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface Order {
  id: number;
  customer_name: string;
  template_key: string;
  status: string;
  created_at: string;
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

  // Stats Calculation
  const stats = {
    pending: orders.filter(o => o.status === 'PENDING' || o.status === 'AI_READY').length,
    processing: orders.filter(o => o.status === 'GENERATING').length,
    done: orders.filter(o => o.status === 'DONE').length,
    error: orders.filter(o => o.status === 'ERROR').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AI_READY': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium border border-blue-200 inline-flex items-center gap-1">🤖 AI Hotovo</span>;
      case 'GENERATING': return <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded-full text-xs font-medium border border-orange-200 inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Generujem...</span>;
      case 'DONE': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium border border-green-200 inline-flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Hotovo</span>;
      case 'ERROR': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium border border-red-200 inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Chyba</span>;
      default: return <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">Čaká...</span>;
    }
  };

  // Helper for safe ID link
  const getLink = (id: number) => `/orders/${id}`;

  return (
    <AppLayout>
      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-slate-500 text-sm font-medium uppercase">Čaká na kontrolu</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-slate-500 text-sm font-medium uppercase">Spracováva sa</p>
          <p className="text-3xl font-bold text-orange-500 mt-1">{stats.processing}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-slate-500 text-sm font-medium uppercase">Hotovo</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{stats.done}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-slate-500 text-sm font-medium uppercase">Chyby</p>
          <p className="text-3xl font-bold text-red-500 mt-1">{stats.error}</p>
        </div>
      </div>

      {/* ORDERS TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-bold text-lg">Aktuálne objednávky</h2>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Aktualizujem...' : 'Obnoviť zoznam'}
          </button>
        </div>

        {loading ? (
          <div className="p-10 flex justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-slate-500 text-xs uppercase tracking-wider border-b">
                <th className="p-4 font-semibold">Objednávka</th>
                <th className="p-4 font-semibold">Zákazník</th>
                <th className="p-4 font-semibold">Šablóna (Key)</th>
                <th className="p-4 font-semibold">Stav spracovania</th>
                <th className="p-4 font-semibold text-right">Akcia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {orders.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Žiadne objednávky. Kliknite na "Obnoviť zoznam".</td></tr>
              ) : orders.map(order => (
                <tr key={order.id} className="hover:bg-blue-50 transition border-l-4 border-transparent hover:border-blue-500">
                  <td className="p-4 font-medium text-slate-900">#{order.id}</td>
                  <td className="p-4 font-medium">{order.customer_name}</td>
                  <td className="p-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono font-bold">{order.template_key || 'N/A'}</span></td>
                  <td className="p-4">{getStatusBadge(order.status)}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => window.location.href = getLink(order.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition shadow-sm font-medium text-xs"
                    >
                      Skontrolovať
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}
