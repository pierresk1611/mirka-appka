"use client";

import React, { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import Link from 'next/link';
import { Loader2, RefreshCw, AlertTriangle, CheckCircle, Clock, Link as LinkIcon } from 'lucide-react';
import ManualLinkModal from '../components/ManualLinkModal';

interface OrderItem {
  id: string;
  product_name_raw: string;
  template_key: string;
  status: string;
  quantity: number;
  preview_url?: string;
  format?: string;
  material?: string;
  product_metadata?: {
    id: string;
    pricing_json?: string;
    csv_title?: string;

    sku?: string;
    image_url?: string;
  };
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
  const [linkModalItem, setLinkModalItem] = useState<OrderItem | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
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
  const allItems = orders?.flatMap(o => o?.items || []).filter(Boolean) || [];
  const stats = {
    pending: allItems.filter(i => i?.status === 'PENDING' || i?.status === 'AI_READY').length,
    processing: allItems.filter(i => i?.status === 'GENERATING').length,
    done: allItems.filter(i => i?.status === 'DONE').length,
    error: allItems.filter(i => i?.status === 'ERROR').length,
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
                  <th className="p-4 text-center">Počet</th>
                  <th className="p-4 text-right">Cena / ks</th>
                  <th className="p-4 text-right">Spolu</th>
                  <th className="p-4 text-right">Akcia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {orders.length === 0 ? (
                  <tr><td colSpan={9} className="p-12 text-center text-slate-400 italic">Žiadne objednávky. Kliknite na "Sync".</td></tr>
                ) : (orders || []).filter(item => item !== null && item !== undefined).map((order, index) => {
                  // Calculate prices for all items
                  const itemDetails = (order?.items || []).filter(Boolean).map(item => {
                    const template = (item as any)?.template;
                    // Prefer direct metadata on item, then template metadata, then template pricing
                    const pricingJson = item?.product_metadata?.pricing_json || template?.product_metadata?.pricing_json || template?.pricing_json || null;
                    const matchedSource = item?.product_metadata ? 'MANUAL/MATCH' : (template?.product_metadata ? 'TEMPLATE_META' : (template?.pricing_json ? 'TEMPLATE' : null));

                    if (!pricingJson) return { qty: item?.quantity || 0, unit: null, total: null };

                    try {
                      const pricingRaw = JSON.parse(pricingJson);
                      // Normalize pricing values (handle strings with commas)
                      const pricing: Record<string, number> = {};
                      Object.entries(pricingRaw).forEach(([k, v]) => {
                        if (typeof v === 'string') {
                          pricing[k] = parseFloat((v as string).replace(',', '.'));
                        } else {
                          pricing[k] = v as number;
                        }
                      });

                      let unitPrice = 0;

                      // Sort ranges to handle overlaps or specific ordering (Highest first)
                      const entries = Object.entries(pricing).sort((a, b) => {
                        const aMin = parseInt(a[0].split('-')[0].replace(/\D/g, '')) || 0;
                        const bMin = parseInt(b[0].split('-')[0].replace(/\D/g, '')) || 0;
                        return bMin - aMin;
                      });

                      for (const [range, price] of entries) {
                        const parts = range.split('-');
                        if (parts.length === 2) {
                          const min = parseInt(parts[0].replace(/\D/g, ''));
                          const max = parseInt(parts[1].replace(/\D/g, ''));
                          if (item.quantity >= min && item.quantity <= max) {
                            unitPrice = price;
                            break;
                          }
                        } else if (range.includes('+')) {
                          const val = parseInt(range.replace(/\D/g, ''));
                          if (item.quantity >= val) {
                            unitPrice = price;
                            break;
                          }
                        } else {
                          const val = parseInt(range.replace(/\D/g, ''));
                          if (item.quantity >= val) {
                            unitPrice = price;
                          }
                        }
                      }

                      // Fallback to lowest price if no tier matched
                      if (unitPrice === 0) {
                        const fallbackPrice = Object.values(pricing).sort((a, b) => a - b)[0];
                        unitPrice = fallbackPrice || 0;
                      }

                      return {
                        qty: item?.quantity || 0,
                        unit: unitPrice > 0 ? unitPrice : null,
                        total: unitPrice > 0 ? unitPrice * (item?.quantity || 0) : null
                      };
                    } catch (e) {
                      return { qty: item?.quantity || 0, unit: null, total: null };
                    }
                  });

                  return (
                    <tr key={order?.id || index} className="hover:bg-blue-50/50 transition">
                      <td className="p-4">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-bold border border-blue-100">
                          {order?.store?.name}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-900 font-mono">#{order?.woo_id}</td>
                      <td className="p-4 font-medium text-slate-700">{order?.customer_name}</td>
                      <td className="p-4 text-xs text-slate-500">
                        {order?.created_at ? new Date(order.created_at).toLocaleDateString('sk-SK') : '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          {(order?.items || []).filter(Boolean).map(item => (
                            <div key={item?.id} className="text-xs text-gray-500 flex items-center gap-2">
                              {getStatusBadge(item?.status || '')}
                              <span className="text-[11px] text-slate-600 truncate max-w-[150px]">{item?.quantity}x {item?.product_name_raw}</span>
                              {(item as any)?.format && (
                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">
                                  {(item as any)?.format}
                                </span>
                              )}
                              {item?.material && (
                                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold">
                                  {item.material}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Quantity Column */}
                      <td className="p-4 text-center font-mono text-slate-600">
                        {itemDetails.map(d => d.qty + ' ks').join(' / ')}
                      </td>

                      {/* Unit Price Column */}
                      <td className="p-4 text-right font-mono text-slate-600">
                        {itemDetails.map(d => d.unit ? d.unit.toFixed(2) + ' €' : '-').join(' / ')}
                      </td>

                      {/* Total Price Column */}
                      <td className="p-4 text-right">
                        <div className="flex flex-col items-end">
                          {itemDetails.map((d, i) => (
                            <div key={i} className="font-bold text-slate-900">
                              {d.total ? d.total.toFixed(2) + ' €' : (
                                <div className="flex flex-col items-end">
                                  <span className="text-[10px] text-orange-400 font-normal italic">Chýba cenník</span>
                                  {/* Debug info: Check if we searched for something */}
                                  <span className="text-[9px] text-slate-300">
                                    {(order?.items?.[i] as any)?.template_key === 'UNKNOWN'
                                      ? `Kľúč: ${(order?.items?.[i]?.product_name_raw?.match(/(202[0-9]_\d+)/)?.[0]) || '?'}`
                                      : `Kľúč: ${order?.items?.[i]?.template_key}`}
                                  </span>
                                  <button
                                    onClick={() => setLinkModalItem(order?.items?.[i] || null)}
                                    className="mt-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded hover:bg-blue-100 flex items-center gap-1"
                                  >
                                    <LinkIcon className="w-3 h-3" /> Priradiť
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {/* Small Thumbnail Indicator */}
                          <div className="w-10 h-10 rounded border border-gray-100 overflow-hidden bg-slate-50 relative group">
                            {(() => {
                              const item = order?.items?.[0]; // Just show first item thumbnail
                              if (!item) return <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-300">N/A</div>;

                              let thumbUrl = item?.preview_url
                                || item?.product_metadata?.image_url
                                || (item as any)?.template?.image_url
                                || (item as any)?.template?.product_metadata?.image_url;

                              if (thumbUrl && thumbUrl.startsWith('http:')) {
                                // Try to upgrade to https if possible, or just log
                                thumbUrl = thumbUrl.replace('http:', 'https:');
                              }

                              if (!thumbUrl && item?.status === 'AI_READY' && item?.template_key !== 'UNKNOWN') {
                                thumbUrl = `/api/preview/generate?itemId=${item?.id}`;
                              }
                              return (thumbUrl || 'https://via.placeholder.com/150') ? (
                                <img src={thumbUrl || 'https://via.placeholder.com/150'} className="w-full h-full object-cover group-hover:scale-125 transition" referrerPolicy="no-referrer" />
                              ) : <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-300">N/A</div>;
                            })()}
                          </div>

                          <Link href={`/orders/${order.id}`}>
                            <button className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition shadow-sm font-bold text-xs">
                              Upraviť
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* MOBILE VIEW */}
            <div className="md:hidden space-y-4 p-4 bg-gray-50">
              {(orders || []).filter(item => item !== null && item !== undefined).map((order, index) => (
                <div key={order?.id || index} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">{order?.store?.name}</div>
                      <span className="text-lg font-bold text-slate-800">#{order?.woo_id}</span>
                      <div className="text-sm font-medium text-slate-500">{order?.customer_name}</div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                      {order?.created_at ? new Date(order.created_at).toLocaleDateString('sk-SK') : '-'}
                    </div>
                  </div>

                  <div className="space-y-2 mb-6 bg-gray-50 p-3 rounded-lg">
                    {(order?.items || []).filter(Boolean).map(item => (
                      <div key={item?.id} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-700 truncate">{item?.product_name_raw}</span>
                        {getStatusBadge(item?.status || '')}
                      </div>
                    ))}
                  </div>

                  <Link href={`/orders/${order?.id}`} className="block">
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


      {
        linkModalItem && (
          <ManualLinkModal
            itemId={linkModalItem.id}
            productName={linkModalItem.product_name_raw}
            currentMetadataId={linkModalItem.product_metadata?.id}
            onLink={() => {
              fetchOrders(); // Refresh to see changes
            }}
            onClose={() => setLinkModalItem(null)}
          />
        )
      }
    </AppLayout >
  );
}
