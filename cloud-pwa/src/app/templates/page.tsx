"use client";

import React from 'react';
import AppLayout from '../../components/AppLayout';
import { Palette } from 'lucide-react';

"use client";

import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import { Palette, Layers, RefreshCw, CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TemplatesPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState<string | null>(null);

    const fetchTemplates = async () => {
        try {
            const res = await fetch('/api/templates/dropbox');
            if (res.ok) {
                const data = await res.json();
                setTemplates(data.synced);
            }
        } catch (error) {
            console.error('Failed to fetch templates', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleScanLayers = async (key: string) => {
        setScanning(key);
        try {
            const res = await fetch(`/api/templates/${encodeURIComponent(key)}/scan`, {
                method: 'POST'
            });
            if (res.ok) {
                alert('Požiadavka na skenovanie odoslaná agentovi.');
                fetchTemplates(); // Refresh to show status
            } else {
                alert('Chyba pri odosielaní požiadavky.');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setScanning(null);
        }
    };

    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Palette className="w-6 h-6 text-blue-600" /> Šablóny (Dropbox)
                </h2>
                <button onClick={fetchTemplates} className="bg-white border text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 transition flex items-center gap-2 font-medium shadow-sm">
                    <RefreshCw className="w-4 h-4" /> Obnoviť zoznam
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((tmpl) => (
                        <div key={tmpl.key} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                            <div className="p-4 bg-gray-50 border-b font-mono font-bold text-slate-700 truncate">
                                {tmpl.key}
                            </div>
                            <div className="p-4 flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${tmpl.status === 'SCANNING' ? 'bg-yellow-100 text-yellow-700 animate-pulse' :
                                            tmpl.status === 'READY' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {tmpl.status || 'READY'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400">Layer Manifest: {tmpl.manifest === '{}' ? 'Empty' : 'Present'}</p>
                            </div>
                            <div className="p-4 border-t bg-gray-50/50 flex justify-end">
                                <button
                                    onClick={() => handleScanLayers(tmpl.key)}
                                    disabled={tmpl.status === 'SCANNING' || scanning === tmpl.key}
                                    className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                                >
                                    {tmpl.status === 'SCANNING' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Layers className="w-3 h-3" />}
                                    {tmpl.status === 'SCANNING' ? 'Skenujem...' : 'Načítať vrstvy'}
                                </button>
                            </div>
                        </div>
                    ))}
                    {templates.length === 0 && (
                        <div className="col-span-full text-center p-12 text-gray-400 italic">
                            Žiadne šablóny. Skontrolujte Dropbox zložku /AutoDesign/TEMPLATES.
                        </div>
                    )}
                </div>
            )}
        </AppLayout>
    );
}
