"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Palette, Users, Clock, Settings, Zap } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Helper for active link styles
    const isActive = (path: string) => pathname === path
        ? "bg-blue-600 text-white shadow-md"
        : "text-slate-400 hover:bg-slate-800 hover:text-white";

    // Helper to determine page title
    const getPageTitle = () => {
        if (pathname === '/') return 'Dashboard';
        if (pathname.startsWith('/orders')) return 'Detail Objednávky';
        if (pathname === '/users') return 'Správa užívateľov';
        if (pathname === '/settings') return 'Nastavenia';
        if (pathname === '/templates') return 'Šablóny';
        if (pathname === '/history') return 'História';
        return 'AutoDesign Cloud';
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">

            {/* SIDEBAR */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0 transition-all duration-300">
                <div className="p-6 text-xl font-bold tracking-wider flex items-center gap-2">
                    <Zap className="text-blue-400 w-6 h-6" fill="currentColor" /> AutoDesign
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4 flex flex-col">
                    <Link href="/" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive('/')}`}>
                        <Package className="w-5 h-5" />
                        <span>Objednávky</span>
                    </Link>

                    <Link href="/users" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive('/users')}`}>
                        <Users className="w-5 h-5" />
                        <span>Užívatelia</span>
                    </Link>

                    <Link href="/templates" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive('/templates')}`}>
                        <Palette className="w-5 h-5" />
                        <span>Šablóny</span>
                    </Link>

                    <Link href="/history" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive('/history')}`}>
                        <Clock className="w-5 h-5" />
                        <span>História</span>
                    </Link>

                    {/* Settings Link (Bottom) */}
                    <Link href="/settings" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition mt-auto mb-4 ${isActive('/settings')}`}>
                        <Settings className="w-5 h-5" />
                        <span>Nastavenia</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white">M</div>
                        <div>
                            <p className="text-white">Mirka Admin</p>
                            <p className="text-xs">Super Admin</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="bg-white border-b px-8 py-4 flex justify-between items-center flex-shrink-0 z-10">
                    <h1 className="text-2xl font-bold text-slate-800">
                        {getPageTitle()}
                    </h1>

                    {/* Status Agenta */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-sm text-green-700 font-medium">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                            </span>
                            Agent Online (Mac-Office)
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
