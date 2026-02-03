"use client";

import React from 'react';
import AppLayout from '../../components/AppLayout';
import { Palette } from 'lucide-react';

export default function TemplatesPage() {
    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Šablóny</h2>
                <button className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium shadow-md">
                    <span>+</span> Nahrať novú šablónu
                </button>
            </div>

            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-200 text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                    <Palette className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Správa šablón</h3>
                <p className="text-gray-500 max-w-md mt-2">
                    Tu bude zoznam všetkých PSD šablón synchronizovaných z Dropboxu.
                    Zatiaľ je táto sekcia vo vývoji.
                </p>
            </div>
        </AppLayout>
    );
}
