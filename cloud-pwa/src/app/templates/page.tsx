'use client';

import { useState, useEffect } from 'react';
import DebugPanel from '@/components/DebugPanel';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/templates');
            const data = await res.json();
            setTemplates(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    fetchTemplates();
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span>🎨</span> Správa šablón
          </h1>
          <button className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-bold shadow-md">
              Aktualizovať z Dropboxu
          </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-20 text-center text-slate-400 italic">
        {loading ? "Načítavam šablóny..." : "Zatiaľ žiadne šablóny. Prepojte Dropbox v nastaveniach."}
      </div>

      <DebugPanel title="Šablóny" data={templates} error={error} loading={loading} />
    </div>
  );
}