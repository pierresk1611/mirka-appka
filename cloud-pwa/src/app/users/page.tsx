"use client";

import React from 'react';
import AppLayout from '../../components/AppLayout';

export default function UserManagement() {
    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Správa užívateľov</h2>
                <button className="bg-slate-900 text-white px-5 py-2.5 rounded-lg hover:bg-slate-700 transition flex items-center gap-2 font-medium shadow-md">
                    <span>+</span> Pridať užívateľa
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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

                        {/* User 1 */}
                        <tr>
                            <td className="p-4 font-medium">Mirka Admin</td>
                            <td className="p-4 text-gray-600">mirka@autodesign.sk</td>
                            <td className="p-4"><span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">Super Admin</span></td>
                            <td className="p-4"><span className="text-green-600 text-xs font-bold">● Aktívny</span></td>
                            <td className="p-4 text-right">
                                <button className="text-gray-400 cursor-not-allowed">Upraviť</button>
                            </td>
                        </tr>

                        {/* User 2 */}
                        <tr>
                            <td className="p-4 font-medium">Jana Grafiková</td>
                            <td className="p-4 text-gray-600">jana@autodesign.sk</td>
                            <td className="p-4"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">Operátor</span></td>
                            <td className="p-4"><span className="text-green-600 text-xs font-bold">● Aktívny</span></td>
                            <td className="p-4 text-right">
                                <button onClick={() => alert('Edit User: Jana Grafiková')} className="text-blue-600 hover:underline mr-3">Upraviť</button>
                                <button onClick={() => alert('Delete User: Jana Grafiková')} className="text-red-500 hover:underline">Zmazať</button>
                            </td>
                        </tr>

                        {/* User 3 */}
                        <tr>
                            <td className="p-4 font-medium">Test Účet</td>
                            <td className="p-4 text-gray-600">test@autodesign.sk</td>
                            <td className="p-4"><span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-bold">Viewer</span></td>
                            <td className="p-4"><span className="text-gray-400 text-xs font-bold">● Neaktívny</span></td>
                            <td className="p-4 text-right">
                                <button onClick={() => alert('Activate User: Test Účet')} className="text-blue-600 hover:underline mr-3">Aktivovať</button>
                                <button onClick={() => alert('Delete User: Test Účet')} className="text-red-500 hover:underline">Zmazať</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
