"use client";

import React from 'react';
import AppLayout from '../components/AppLayout';

export default function Dashboard() {
  return (
    <AppLayout>
      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-slate-500 text-sm font-medium uppercase">Čaká na kontrolu</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">12</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-slate-500 text-sm font-medium uppercase">Spracováva sa</p>
          <p className="text-3xl font-bold text-orange-500 mt-1">2</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-slate-500 text-sm font-medium uppercase">Hotovo dnes</p>
          <p className="text-3xl font-bold text-green-600 mt-1">45</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-slate-500 text-sm font-medium uppercase">Chyby</p>
          <p className="text-3xl font-bold text-red-500 mt-1">1</p>
        </div>
      </div>

      {/* ORDERS TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-bold text-lg">Aktuálne objednávky</h2>
          <button className="text-sm text-blue-600 font-medium hover:underline">Obnoviť zoznam</button>
        </div>

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

            {/* 1. READY TO REVIEW */}
            <tr className="hover:bg-blue-50 transition border-l-4 border-blue-500">
              <td className="p-4 font-medium text-slate-900">#41775</td>
              <td className="p-4">
                <div className="font-medium">Veronika Zahatlanová</div>
                <div className="text-xs text-slate-400">veronika@example.com</div>
              </td>
              <td className="p-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono font-bold">FINGERPRINTS</span></td>
              <td className="p-4">
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium border border-blue-200 inline-flex items-center gap-1">
                  🤖 AI Hotovo
                </span>
              </td>
              <td className="p-4 text-right">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition shadow-sm font-medium">
                  Skontrolovať
                </button>
              </td>
            </tr>

            {/* 2. PROCESSING */}
            <tr className="bg-white border-l-4 border-orange-400">
              <td className="p-4 font-medium text-slate-900">#41776</td>
              <td className="p-4">Peter Malý</td>
              <td className="p-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono font-bold">WED_042</span></td>
              <td className="p-4">
                <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded-full text-xs font-medium border border-orange-200 inline-flex items-center gap-1">
                  ⚙️ Generujem...
                </span>
              </td>
              <td className="p-4 text-right text-gray-400 italic text-xs">
                Čakajte...
              </td>
            </tr>

            {/* 3. ERROR */}
            <tr className="bg-red-50/40 border-l-4 border-red-500">
              <td className="p-4 font-medium text-slate-900">#41770</td>
              <td className="p-4">Jana Nová</td>
              <td className="p-4"><span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-mono font-bold">UNKNOWN_KEY</span></td>
              <td className="p-4">
                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium border border-red-200 inline-flex items-center gap-1">
                  ⚠️ Chyba
                </span>
              </td>
              <td className="p-4 text-right">
                <button className="text-slate-600 hover:text-blue-600 font-medium px-3 py-1 border border-slate-300 rounded bg-white hover:bg-gray-50">
                  Upraviť manuálne
                </button>
              </td>
            </tr>

          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
