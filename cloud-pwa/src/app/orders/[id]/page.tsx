"use client";

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppLayout from '../../../components/AppLayout';

export default function OrderDetail() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id;

    // Demo State
    const [formData, setFormData] = useState({
        name_main: "Veronika & Zdeněk",
        date: "12.09.2026",
        place: "Kostel svaté Maří Magdalény",
        body_full: "Veronika Zahatlanová a Zdeněk Oleśków Vybrali jsme si navždy..."
    });

    const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

    return (
        <AppLayout>
            {/* Top Bar */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-slate-500 hover:bg-slate-200 p-2 rounded-full transition">← Späť</button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            Objednávka #{id}
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-200">Manuálna úprava</span>
                        </h1>
                        <p className="text-sm text-slate-500">Šablóna: <span className="font-mono font-bold text-slate-700">FINGERPRINTS</span></p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 text-red-600 bg-white border border-red-200 rounded text-sm font-medium hover:bg-red-50">Odmietnuť</button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium shadow-sm">Schváliť & Odoslať</button>
                </div>
            </div>

            {/* 3-Column Layout */}
            <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-200px)]">

                {/* 1. Source */}
                <div className="w-full md:w-1/4 bg-white border border-gray-200 rounded-xl flex flex-col shadow-sm">
                    <div className="p-3 bg-gray-50 border-b font-semibold text-xs text-slate-500 uppercase">Text zákazníka (Woo)</div>
                    <div className="p-4 flex-1 overflow-y-auto bg-yellow-50 font-mono text-sm text-slate-700 whitespace-pre-wrap">
                        Veronika Zahatlanová a Zdeněk Oleśków... (Originál text)
                    </div>
                </div>

                {/* 2. Editor */}
                <div className="w-full md:w-1/3 bg-white border border-blue-200 rounded-xl flex flex-col shadow-md ring-1 ring-blue-100">
                    <div className="p-3 bg-blue-600 text-white rounded-t-xl font-semibold text-xs uppercase flex justify-between">
                        <span>Editor Polí (JSON)</span><span>Auto-Save</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">NAME_MAIN</label>
                            <input name="name_main" value={formData.name_main} onChange={handleChange} className="w-full p-2 border rounded font-bold" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">DATE</label>
                            <input name="date" value={formData.date} onChange={handleChange} className="w-full p-2 border rounded" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">PLACE</label>
                            <input name="place" value={formData.place} onChange={handleChange} className="w-full p-2 border rounded" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">BODY_FULL</label>
                            <textarea name="body_full" value={formData.body_full} onChange={handleChange} className="w-full p-2 border rounded h-32 text-xs" />
                        </div>
                    </div>
                    <div className="p-4 border-t bg-gray-50">
                        <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow hover:bg-blue-700 transition">Generovať náhľad</button>
                    </div>
                </div>

                {/* 3. Preview */}
                <div className="flex-1 bg-slate-200 rounded-xl flex flex-col overflow-hidden relative border border-slate-300">
                    <div className="p-3 bg-slate-300 border-b font-semibold text-xs text-slate-600 uppercase">Výstup (Preview)</div>
                    <div className="flex-1 flex items-center justify-center p-4 bg-gray-300">
                        <div className="bg-white shadow-2xl p-4 text-center text-gray-400">Preview Image Placeholder</div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
