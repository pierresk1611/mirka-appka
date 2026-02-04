"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Palette, Users, Clock, Settings, Zap, Menu, X } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    // Active link styles (Desktop & Mobile)
    const getLinkClass = (path: string) => pathname === path
        ? "bg-blue-600 text-white shadow-md"
        : "text-slate-400 hover:bg-slate-800 hover:text-white";

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">

            {/* MOBILE HEADER (Visible on md:hidden) */}
            <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white z-50 flex justify-between items-center px-6 py-4 border-b border-slate-700">
                <div className="text-lg font-bold tracking-wider flex items-center gap-2">
                    <Zap className="text-blue-400 w-5 h-5" fill="currentColor" /> AutoDesign
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* DESKTOP SIDEBAR (Hidden on mobile) */}
            <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col flex-shrink-0 transition-all duration-300">
                <div className="p-6 text-xl font-bold tracking-wider flex items-center gap-2">
                    <Zap className="text-blue-400 w-6 h-6" fill="currentColor" /> AutoDesign
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4 flex flex-col">
                    <Link href="/" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${getLinkClass('/')}`}>
                        <Package className="w-5 h-5" />
                        <span>Objednávky</span>
                    </Link>

                    <Link href="/users" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${getLinkClass('/users')}`}>
                        <Users className="w-5 h-5" />
                        <span>Užívatelia</span>
                    </Link>

                    <Link href="/templates" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${getLinkClass('/templates')}`}>
                        <Palette className="w-5 h-5" />
                        <span>Šablóny</span>
                    </Link>

                    <Link href="/history" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${getLinkClass('/history')}`}>
                        <Clock className="w-5 h-5" />
                        <span>História</span>
                    </Link>

                    <Link href="/settings" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition mt-auto mb-4 ${getLinkClass('/settings')}`}>
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

            {/* MOBILE MENU OVERLAY */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-slate-900 pt-20 px-6">
                    <nav className="flex flex-col space-y-4">
                        <Link href="/" onClick={closeMobileMenu} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${getLinkClass('/')}`}>
                            <Package className="w-5 h-5" />
                            <span>Objednávky</span>
                        </Link>
                        <Link href="/users" onClick={closeMobileMenu} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${getLinkClass('/users')}`}>
                            <Users className="w-5 h-5" />
                            <span>Užívatelia</span>
                        </Link>
                        <Link href="/templates" onClick={closeMobileMenu} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${getLinkClass('/templates')}`}>
                            <Palette className="w-5 h-5" />
                            <span>Šablóny</span>
                        </Link>
                        <Link href="/history" onClick={closeMobileMenu} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${getLinkClass('/history')}`}>
                            <Clock className="w-5 h-5" />
                            <span>História</span>
                        </Link>
                        <Link href="/settings" onClick={closeMobileMenu} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${getLinkClass('/settings')}`}>
                            <Settings className="w-5 h-5" />
                            <span>Nastavenia</span>
                        </Link>
                    </nav>
                </div>
            )}

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden pt-16 md:pt-0">
                <header className="hidden md:flex bg-white border-b px-8 py-4 justify-between items-center flex-shrink-0">
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

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
