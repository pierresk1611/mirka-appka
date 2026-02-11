'use client';
import React, { useState, useEffect } from 'react';

interface DebugProps {
  title: string;
  data: any;
  error: any;
  loading: boolean;
}

export default function DebugPanel({ title, data, error, loading }: DebugProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [envStatus, setEnvStatus] = useState<any>({});

  // Zisťujeme, či sú kľúče prítomné (bezpečným spôsobom)
  useEffect(() => {
    setEnvStatus({
      HAS_DB: '❓ (Server-Side)', // Client cannot see DB URL
      HAS_WOO: process.env.NEXT_PUBLIC_WOO_CK ? '✅' : '❌',
      NODE_ENV: process.env.NODE_ENV
    });
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-sm w-full font-mono shadow-2xl">
      <div className={`rounded-lg overflow-hidden border-2 ${error ? 'border-red-500 animate-pulse' : 'border-slate-800'}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full p-2 text-left text-[10px] font-bold flex justify-between items-center ${error ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'}`}
        >
          <span>🐞 DEBUG: {title}</span>
          <span>{isOpen ? '▼ CLOSE' : '▲ OPEN'}</span>
        </button>

        {isOpen && (
          <div className="bg-white p-3 text-[10px] max-h-[400px] overflow-y-auto border-t border-slate-200">
            <div className="grid grid-cols-2 gap-1 mb-3 pb-2 border-b">
              <span className="text-gray-500 uppercase font-bold">Status:</span>
              <span className={loading ? 'text-orange-500' : error ? 'text-red-600' : 'text-green-600'}>
                {loading ? '⏳ LOADING' : error ? '❌ ERROR' : '✅ SUCCESS'}
              </span>

              <span className="text-gray-500 uppercase font-bold">Items count:</span>
              <span className="font-bold">{Array.isArray(data) ? data.length : data ? '1' : '0'}</span>
            </div>

            {/* ERROR DISPLAY */}
            {error && (
              <div className="mb-3 p-2 bg-red-50 text-red-700 rounded border border-red-200 overflow-x-auto">
                <p className="font-bold mb-1 underline">Error Details:</p>
                <pre className="whitespace-pre-wrap">{typeof error === 'string' ? error : JSON.stringify(error, null, 2)}</pre>
              </div>
            )}

            {/* DATA PREVIEW */}
            {!loading && !error && data && (
              <div className="mb-3 p-2 bg-blue-50 text-blue-700 rounded border border-blue-200 overflow-x-auto font-bold text-[9px]">
                <p className="font-bold mb-1 underline">Data Snapshot:</p>
                <pre>{JSON.stringify(data, null, 2).substring(0, 500)}...</pre>
              </div>
            )}

            {/* ENV VARIABLES STATUS */}
            <div className="pt-2 border-t text-[9px] text-slate-400">
              <p className="font-bold text-slate-600 mb-1">Environment Config:</p>
              <div className="flex gap-4">
                <span>DB: {envStatus.HAS_DB}</span>
                <span>WOO: {envStatus.HAS_WOO}</span>
                <span>MODE: {envStatus.NODE_ENV}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}