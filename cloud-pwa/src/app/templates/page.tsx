"use client";

import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../../components/AppLayout';
import {
    Search,
    RefreshCw,
    Edit3,
    FileType,
    Link,
    CheckCircle2,
    Loader2,
    Folder,
    Save,
    Upload,
    FileSpreadsheet,
    Image as ImageIcon
} from 'lucide-react';

interface Template {
    key: string;
    name: string | null;
    folder_path: string | null;
    main_file: string | null;
    files: string | null; // JSON
    status: string;
    is_verified: boolean;
    image_url: string | null;
}

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [search, setSearch] = useState('');
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editData, setEditData] = useState({ name: '', main_file: '' });

    // Hidden file input ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchTemplates = async () => {
        try {
            const res = await fetch('/api/templates');
            if (res.ok) {
                const data = await res.json();
                // Sort: Verified first, then by name/key
                data.sort((a: Template, b: Template) => {
                    if (a.is_verified === b.is_verified) return 0;
                    return a.is_verified ? -1 : 1;
                });
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

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/templates/import', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (res.ok) {
                alert(`Import úspešný!\nSpracované: ${data.processed}\nVytvorené cenníky: ${data.created}\nSpárované šablóny: ${data.matched}`);
                fetchTemplates(); // Refresh list
            } else {
                alert('Chyba pri importe: ' + data.error);
            }
        } catch (error) {
            alert('Chyba pripojenia');
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
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

                    {/* Hidden File Input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".csv"
                        className="hidden"
                    />

                    <button
                        onClick={handleImportClick}
                        disabled={importing}
                        className="bg-green-600 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition shadow-lg disabled:opacity-50"
                    >
                        {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                        Import CSV
                    </button>

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
                    const isVerified = template.is_verified;

                    return (
                        <div key={template.key} className={`relative bg-white border-2 rounded-2xl p-6 transition-all duration-300 group
                            ${isEditing ? 'border-blue-500 shadow-2xl ring-4 ring-blue-500/5' :
                                isVerified ? 'border-green-500/20 bg-green-50/30 hover:border-green-500/40' :
                                    'border-white hover:border-slate-100 shadow-sm hover:shadow-md'}
                        `}>
                            {isVerified && (
                                <div className="absolute top-0 right-0 bg-green-500 text-white text-[9px] font-black uppercase px-2 py-1 rounded-bl-xl rounded-tr-lg shadow-sm">
                                    Overená Šablóna
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    {/* Thumbnail or Icon */}
                                    {template.image_url ? (
                                        <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-sm flex-shrink-0 bg-white">
                                            <img src={template.image_url} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className={`w-12 h-12 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 ${template.status === 'READY' ? 'bg-green-50 text-green-500' : 'bg-orange-50 text-orange-400'}`}>
                                            <Folder className="w-6 h-6" />
                                        </div>
                                    )}

                                    <div>
                                        {isEditing ? (
                                            <input
                                                value={editData.name}
                                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                                placeholder="Alias šablóny (napr. JSO_15)"
                                                className="text-lg font-bold text-blue-600 border-b-2 border-blue-500 outline-none w-full bg-blue-50/50 px-2 py-1 rounded"
                                            />
                                        ) : (
                                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition flex items-center gap-2">
                                                {template.name || template.key}
                                                {isVerified && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                            </h3>
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
                    <p className="text-slate-500 text-sm">Skúste spustiť skenovanie Dropboxu alebo import CSV.</p>
                </div>
            )}
        </AppLayout>
    );
}
