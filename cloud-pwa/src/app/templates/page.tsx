"use client";

import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/AppLayout';
import {
    Search,
    RefreshCw,
    Edit3,
    FileType,
    Link,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Folder,
    ExternalLink,
    Save
} from 'lucide-react';

interface Template {
    key: string;
    name: string | null;
    folder_path: string | null;
    main_file: string | null;
    files: string | null; // JSON
    status: string;
}

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [search, setSearch] = useState('');
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editData, setEditData] = useState({ name: '', main_file: '' });

    const fetchTemplates = async () => {
        try {
            const res = await fetch('/api/templates');
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error('Failed to fetch templates');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch('/api/templates/dropbox');
            if (res.ok) {
                await fetchTemplates();
                alert('Synchronizácia úspešná!');
            }
        } catch (e) {
            alert('Chyba pri synchronizácii');
        } finally {
            setSyncing(false);
        }
    };

    const startEdit = (t: Template) => {
        setEditingKey(t.key);
        setEditData({
            name: t.name || t.key,
            main_file: t.main_file || ''
        });
    };

    const saveEdit = async (key: string) => {
        try {
            const res = await fetch(`/api/templates/${key}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData)
            });
            if (res.ok) {
                setEditingKey(null);
                fetchTemplates();
            }
        } catch (e) {
            alert('Chyba pri ukladaní');
        }
    };

    const filtered = templates.filter(t =>
        t.key.toLowerCase().includes(search.toLowerCase()) ||
        (t.name && t.name.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <AppLayout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Manažér Šablón
                        <span className="text-sm font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{filtered.length} celkom</span>
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Upracite neporiadok z Dropboxu priamo tu.</p>
                </div>

                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Hľadať šablónu..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition outline-none shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="bg-slate-900 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition shadow-lg disabled:opacity-50"
                    >
                        {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        Skenovať Dropbox
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filtered.map(template => {
                    const isEditing = editingKey === template.key;
                    const files: string[] = JSON.parse(template.files || '[]');

                    return (
                        <div key={template.key} className={`bg-white border-2 rounded-2xl p-6 transition-all duration-300 ${isEditing ? 'border-blue-500 shadow-2xl ring-4 ring-blue-500/5' : 'border-white hover:border-slate-100 shadow-sm hover:shadow-md'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 ${template.status === 'READY' ? 'bg-green-50 text-green-500' : 'bg-orange-50 text-orange-400'}`}>
                                        <Folder className="w-6 h-6" />
                                    </div>
                                    <div>
                                        {isEditing ? (
                                            <input
                                                value={editData.name}
                                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                                placeholder="Alias šablóny (napr. JSO_15)"
                                                className="text-lg font-bold text-blue-600 border-b-2 border-blue-500 outline-none w-full bg-blue-50/50 px-2 py-1 rounded"
                                            />
                                        ) : (
                                            <h3 className="text-lg font-bold text-slate-900">{template.name || template.key}</h3>
                                        )}
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{template.key}</span>
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${template.status === 'READY' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {template.status === 'READY' ? 'Pripravená' : 'Nová / Neuprataná'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isEditing ? (
                                        <button
                                            onClick={() => saveEdit(template.key)}
                                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg transition"
                                        >
                                            <Save className="w-5 h-5" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => startEdit(template)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                        >
                                            <Edit3 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Master Design File (.PSD / .AI)</label>
                                    {isEditing ? (
                                        <select
                                            value={editData.main_file}
                                            onChange={(e) => setEditData({ ...editData, main_file: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        >
                                            <option value="">-- Vyberte hlavný súbor --</option>
                                            {files.map(f => (
                                                <option key={f} value={f}>{f.split('/').pop()}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-blue-500 shadow-sm flex-shrink-0">
                                                    <FileType className="w-4 h-4" />
                                                </div>
                                                <span className="text-xs font-mono text-slate-600 truncate">
                                                    {template.main_file ? template.main_file.split('/').pop() : 'Nenastavené'}
                                                </span>
                                            </div>
                                            {template.main_file && (
                                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium truncate max-w-[70%]">
                                        <Link className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{template.folder_path}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-[10px] font-bold text-slate-400">
                                            {files.length} súborov
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && !loading && (
                <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 mt-8">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                        <Folder className="w-10 h-10" />
                    </div>
                    <h3 className="text-slate-900 font-bold mb-1">Žiadne šablóny</h3>
                    <p className="text-slate-500 text-sm">Skúste spustiť skenovanie Dropboxu.</p>
                </div>
            )}
        </AppLayout>
    );
}
