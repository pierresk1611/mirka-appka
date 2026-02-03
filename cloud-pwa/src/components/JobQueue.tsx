"use client";

import React, { useState } from 'react';
import { Play, FileEdit, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Job {
    id: string;
    orderId: string;
    productName: string;
    templateKey: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    customer: string;
    date: string;
}

const MOCK_JOBS: Job[] = [
    { id: '1', orderId: '#1001', productName: 'Svadobné oznámenie JSO 15', templateKey: 'JSO_15', status: 'pending', customer: 'Peter & Jana', date: '2026-02-02' },
    { id: '2', orderId: '#1002', productName: 'Narodeninová Pozvánka BIR 001', templateKey: 'BIR_001', status: 'processing', customer: 'Martin', date: '2026-02-02' },
    { id: '3', orderId: '#1003', productName: 'Svadobné menu WED 042', templateKey: 'WED_042', status: 'error', customer: 'Elena & Tomáš', date: '2026-02-01' },
];

export default function JobQueue() {
    const [jobs] = useState<Job[]>(MOCK_JOBS);

    const getStatusLabel = (status: Job['status']) => {
        switch (status) {
            case 'pending': return 'Čaká';
            case 'processing': return 'Spracováva sa';
            case 'completed': return 'Hotovo';
            case 'error': return 'Chyba';
            default: return status;
        }
    };

    return (
        <div className="w-full bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Tlačová fronta</h2>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
                    {jobs.length} Čakajúce
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-medium">Objednávka</th>
                            <th className="px-6 py-4 font-medium">Produkt / Šablóna</th>
                            <th className="px-6 py-4 font-medium">Zákazník</th>
                            <th className="px-6 py-4 font-medium">Stav</th>
                            <th className="px-6 py-4 font-medium text-right">Akcie</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {jobs.map((job) => (
                            <tr
                                key={job.id}
                                className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                onClick={() => window.location.href = `/mapping?id=${job.id}`}
                            >
                                <td className="px-6 py-4 font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{job.orderId}</td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-800">{job.productName}</span>
                                        <span className="text-xs text-gray-400 font-mono mt-1">{job.templateKey}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">{job.customer}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${job.status === 'processing' ? 'bg-blue-100 text-blue-800' : ''}
                    ${job.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                    ${job.status === 'error' ? 'bg-red-100 text-red-800' : ''}
                  `}>
                                        {job.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                                        {job.status === 'processing' && <Play className="w-3 h-3 mr-1" />}
                                        {job.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                                        {job.status === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
                                        {getStatusLabel(job.status)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button className="text-gray-400 hover:text-blue-600 transition-colors" title="Upraviť Mapovanie">
                                        <FileEdit className="w-5 h-5" />
                                    </button>
                                    <button className="text-gray-400 hover:text-green-600 transition-colors" title="Spustiť">
                                        <Play className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
