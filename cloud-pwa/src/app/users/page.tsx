"use client";

import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/AppLayout';
import { User, Shield, Trash2, Edit2, CheckCircle, XCircle, Plus, Loader2, Users } from 'lucide-react';

interface UserData {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
}

export default function UserManagement() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'OPERATOR' });

    // Fetch Users
    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Handle Create
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });
            if (res.ok) {
                setIsModalOpen(false);
                setNewUser({ name: '', email: '', password: '', role: 'OPERATOR' });
                fetchUsers();
            } else {
                alert('Chyba pri vytváraní užívateľa');
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Handle Delete
    const handleDelete = async (id: string) => {
        if (!confirm('Naozaj chcete zmazať tohto užívateľa?')) return;
        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (res.ok) fetchUsers();
        } catch (error) {
            console.error(error);
        }
    };

    // Handle Toggle Status
    const handleToggleStatus = async (user: UserData) => {
        const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        try {
            const res = await fetch(`/api/users/${user.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) fetchUsers();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-600" /> Správa užívateľov
                </h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-slate-900 text-white px-5 py-2.5 rounded-lg hover:bg-slate-700 transition flex items-center gap-2 font-medium shadow-md"
                >
                    <Plus className="w-4 h-4" /> Pridať užívateľa
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 flex justify-center text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Meno</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Email (Login)</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Rola</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Akcie</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 font-medium flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                                            {user.name.charAt(0)}
                                        </div>
                                        {user.name}
                                    </td>
                                    <td className="p-4 text-gray-600 font-mono text-sm">{user.email}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
                                            user.role === 'OPERATOR' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button onClick={() => handleToggleStatus(user)} className="flex items-center gap-1 hover:opacity-80">
                                            {user.status === 'ACTIVE'
                                                ? <span className="text-green-600 text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Aktívny</span>
                                                : <span className="text-gray-400 text-xs font-bold flex items-center gap-1"><XCircle className="w-3 h-3" /> Neaktívny</span>
                                            }
                                        </button>
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <button className="text-blue-600 hover:bg-blue-50 p-2 rounded transition" title="Upraviť">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:bg-red-50 p-2 rounded transition" title="Zmazať">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-400 italic">Zatiaľ žiadni užívatelia.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Pridať nového užívateľa</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Meno</label>
                                <input required className="w-full border p-2 rounded" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input required type="email" className="w-full border p-2 rounded" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Heslo</label>
                                <input required type="password" className="w-full border p-2 rounded" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rola</label>
                                <select className="w-full border p-2 rounded" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                    <option value="OPERATOR">OPERATOR</option>
                                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                                    <option value="VIEWER">VIEWER</option>
                                </select>
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition">Vytvoriť užívateľa</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
