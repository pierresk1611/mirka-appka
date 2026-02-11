'use client';

import { useState, useEffect } from 'react';
import DebugPanel from '@/components/DebugPanel';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Chyba pri načítaní užívateľov');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span>👥</span> Správa užívateľov
          </h1>
          <button className="bg-slate-900 text-white px-5 py-2.5 rounded-lg hover:bg-slate-800 transition flex items-center gap-2 font-bold shadow-sm">
              <span>+</span> Pridať užívateľa
          </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
                <tr className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                    <th className="p-4">Meno</th>
                    <th className="p-4">Email / Login</th>
                    <th className="p-4">Rola</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Akcie</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
                {loading ? (
                    <tr><td colSpan={5} className="p-10 text-center text-slate-400 italic">Načítavam užívateľov...</td></tr>
                ) : users.length === 0 ? (
                    <tr><td colSpan={5} className="p-10 text-center text-slate-400 italic">Žiadni užívatelia v databáze.</td></tr>
                ) : (
                    users.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50">
                            <td className="p-4 font-bold text-slate-900">{user.name}</td>
                            <td className="p-4 text-slate-500">{user.email}</td>
                            <td className="p-4">
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight">
                                    {user.role}
                                </span>
                            </td>
                            <td className="p-4">
                                <span className="flex items-center gap-1.5 text-green-600 font-bold text-xs">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Aktívny
                                </span>
                            </td>
                            <td className="p-4 text-right">
                                <button className="text-blue-600 hover:underline font-bold text-xs uppercase mr-3">Upraviť</button>
                                <button className="text-red-500 hover:underline font-bold text-xs uppercase">Zmazať</button>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>
      <DebugPanel title="Užívatelia" data={users} error={error} loading={loading} />
    </div>
  );
}