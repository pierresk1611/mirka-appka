import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Link from 'next/link';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AutoDesign Cloud",
  description: "Automatizácia svadobných oznámení",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sk">
      <body className={`${geistSans.variable} antialiased`}>
        <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
          
          {/* SIDEBAR (Tmavé menu) */}
          <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0">
            <div className="p-6 text-xl font-bold tracking-wider flex items-center gap-2 italic">
               <span className="text-blue-400">⚡</span> AutoDesign
            </div>
            
            <nav className="flex-1 px-4 space-y-2 mt-4 flex flex-col">
              <Link href="/" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition">
                <span>📦</span> Objednávky
              </Link>
              <Link href="/users" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition">
                <span>👥</span> Užívatelia
              </Link>
              <Link href="/templates" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition">
                <span>🎨</span> Šablóny
              </Link>
              <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition mt-auto mb-6">
                <span>⚙️</span> Nastavenia
              </Link>
            </nav>

            <div className="p-4 border-t border-slate-700 text-xs text-slate-500">
              Mirka Admin • Super Admin
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <main className="flex-1 flex flex-col h-screen overflow-hidden">
            <header className="bg-white border-b px-8 py-4 flex justify-between items-center flex-shrink-0 z-10 shadow-sm">
              <h1 className="text-xl font-bold text-slate-800">AutoDesign Cloud</h1>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-xs text-green-700 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Agent Online (Mac-Office)
              </div>
            </header>

            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}