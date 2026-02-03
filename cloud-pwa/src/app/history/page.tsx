"use client";

import React from 'react';
import AppLayout from '../../components/AppLayout';
import { Clock } from 'lucide-react';

export default function HistoryPage() {
    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">História spracovania</h2>
            </div>

            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-200 text-center">
                <div className="w-16 h-16 bg-gray-50 text-gray-500 rounded-full flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Archív objednávok</h3>
                <p className="text-gray-500 max-w-md mt-2">
                    História všetkých spracovaných a dokončených úloh sa zobrazí tu.
                    Funkcionalita sa pripravuje.
                </p>
            </div>
        </AppLayout>
    );
}
