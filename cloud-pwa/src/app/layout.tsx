import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import SystemMonitor from '@/components/SystemMonitor';

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = { title: "AutoDesign Cloud", description: "Automatizácia" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk">
      <body className={`${geistSans.variable} antialiased`}>
        <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
          <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0">
            <div className="p-6 text-xl font-bold tracking-wider flex items-center gap-2 border-b border-slate-800 italic">
               <span className="text-blue-400">⚡</span> AutoDesign
            </div>
            <nav className="flex-1 px-4 space-y-1 mt-4 flex flex-col font-medium">
              <Link href="/" className="flex items-center gap-3 px-4 py-3 text-white hover:bg-slate-800 rounded-lg transition">📦 Dashboard</Link>
              <Link href="/history" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 rounded-lg transition">📜 História</Link>
              <Link href="/users" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 rounded-lg transition">👥 Užívatelia</Link>
              <Link href="/templates" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 rounded-lg transition">🎨 Šablóny</Link>
              <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 rounded-lg transition mt-auto mb-6 border-t border-slate-800 pt-4">⚙️ Nastavenia</Link>
            </nav>
          </aside>
          <main className="flex-1 flex flex-col h-screen overflow-hidden">
            <SystemMonitor />
            <header className="bg-white border-b px-8 py-4 flex justify-between items-center shadow-sm z-10 font-bold text-slate-700 uppercase tracking-tight">
              AutoDesign Cloud System
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full text-[10px] text-green-700 border border-green-200">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span> Agent: Online
              </div>
            </header>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}