'use client';
import React, { useState } from 'react';

interface DebugProps {
  title: string;
  data: any;
  error: any;
  loading: boolean;
}

export default function DebugPanel({ title, data, error, loading }: DebugProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full">
      <div className={`shadow-2xl rounded-lg overflow-hidden border ${error ? 'border-red-500' : 'border-gray-300'}`}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full p-2 text-left text-xs font-bold flex justify-between items-center ${error ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'}`}
        >
          <span>🐞 DEBUG: {title}</span>
          <span>{isOpen ? '▼' : '▲'}</span>
        </button>
        
        {isOpen && (
          <div className="bg-white p-3 text-[10px] font-mono max-h-60 overflow-y-auto">
            <p className="mb-1"><strong>Status:</strong> {loading ? '⏳ Loading' : error ? '❌ Error' : '✅ Success'}</p>
            <p className="mb-1"><strong>Items:</strong> {Array.isArray(data) ? data.length : data ? '1' : '0'}</p>
            
            {error && (
              <div className="mt-2 p-2 bg-red-50 text-red-700 rounded border border-red-200 whitespace-pre-wrap">
                <strong>Error Details:</strong><br />
                {typeof error === 'string' ? error : JSON.stringify(error, null, 2)}
              </div>
            )}

            <div className="mt-2 pt-2 border-t text-[9px] text-gray-400">
              Check Vercel Environment Variables if items = 0
            </div>
          </div>
        )}
      </div>
    </div>
  );
}