'use client';

import { useState, useEffect } from 'react';
import DebugPanel from '@/components/DebugPanel';
import { getAuthHeaders } from '@/lib/config';
import { Loader2, Plus, Edit2, Trash2, X, Check, Save } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState({ id: '', name: '', email: '', password: '', role: 'USER', status: 'ACTIVE' });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users', { headers: getAuthHeaders() });
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

  const handleOpenCreate = () => {
    setFormData({ id: '', name: '', email: '', password: '', role: 'USER', status: 'ACTIVE' });
    setModalMode('create');
    setShowModal(true);
  };

  const handleOpenEdit = (user: any) => {
    setFormData({
      id: user.id,
      name: user.name,
      email: user.email,
      password: '', // Don't show existing password
      role: user.role,
      status: user.status
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = '/api/users';
      const method = modalMode === 'create' ? 'POST' : 'PATCH';
      const body = modalMode === 'create'
        ? { name: formData.name, email: formData.email, password: formData.password, role: formData.role }
        : { id: formData.id, status: formData.status, role: formData.role }; // Only status/role update allowed via PATCH for now per API

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setShowModal(false);
        fetchUsers();
        if (modalMode === 'create') alert('Užívateľ vytvorený!');
        else alert('Užívateľ aktualizovaný!');
      } else {
        const err = await res.json();
        alert(`Chyba: ${err.error || 'Neznáma chyba'}`);
      }
    } catch (err: any) {
      alert(`Chyba pripojenia: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (user: any) => {
    if (!confirm(`Zmeniť status užívateľa ${user.name} na ${user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'}?`)) return;

    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: user.id,
          status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
          role: user.role
        })
      });
      if (res.ok) fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <span>👥</span> Správa užívateľov
        </h1>
        <button onClick={handleOpenCreate} className="bg-slate-900 text-white px-5 py-2.5 rounded-lg hover:bg-slate-800 transition flex items-center gap-2 font-bold shadow-sm">
          <Plus className="w-5 h-5" /> Pridať užívateľa
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
                <tr key={user.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-bold text-slate-900">{user.name}</td>
                  <td className="p-4 text-slate-500">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 cursor-pointer" onClick={() => toggleStatus(user)}>
                    <span className={`flex items-center gap-1.5 font-bold text-xs ${user.status === 'ACTIVE' ? 'text-green-600' : 'text-red-500'}`}>
                      <span className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => handleOpenEdit(user)} className="text-slate-400 hover:text-blue-600 transition p-1"><Edit2 className="w-4 h-4" /></button>
                    <button className="text-slate-400 hover:text-red-500 transition p-1"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">{modalMode === 'create' ? 'Nový užívateľ' : 'Upraviť užívateľa'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Meno</label>
                <input disabled={modalMode === 'edit'} required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 border rounded-xl bg-slate-50 focus:bg-white transition outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Janko Hraško" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                <input disabled={modalMode === 'edit'} required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full p-3 border rounded-xl bg-slate-50 focus:bg-white transition outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="email@domena.sk" />
              </div>
              {modalMode === 'create' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Heslo</label>
                  <input required type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full p-3 border rounded-xl bg-slate-50 focus:bg-white transition outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="******" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rola</label>
                  <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full p-3 border rounded-xl bg-white outline-none">
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full p-3 border rounded-xl bg-white outline-none">
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <button disabled={submitting} type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition flex justify-center items-center gap-2 mt-4">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {modalMode === 'create' ? 'Vytvoriť užívateľa' : 'Uložiť zmeny'}
              </button>
            </form>
          </div>
        </div>
      )}

      <DebugPanel title="Užívatelia" data={users} error={error} loading={loading} />
    </div>
  );
}