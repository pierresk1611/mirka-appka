"use client";

import React from 'react';
import AppLayout from '../../components/AppLayout';
import { Settings, Save } from 'lucide-react';

export default function SettingsPage() {
    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Nastavenia</h2>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-2xl">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                        <Settings className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Konfigurácia Systému</h3>
                        <p className="text-sm text-gray-500">Nastavenie prepojení a ciest.</p>
                    </div>
                </div>

                <form className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Dropbox Cesta (Templates)</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                defaultValue="/Users/apple/Dropbox/TEMPLATES"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Cesta k zložke so šablónami na lokálnom počítači agenta.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">OpenAI API Key</label>
                        <input
                            type="password"
                            defaultValue="sk-proj-**********************"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        />
                    </div>

                    <div className="pt-4">
                        <button type="button" className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-lg hover:bg-slate-700 transition font-medium">
                            <Save className="w-4 h-4" /> Uložiť nastavenia
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
