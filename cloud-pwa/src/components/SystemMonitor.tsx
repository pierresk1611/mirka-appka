'use client';
import React, { useState, useEffect } from 'react';

export default function SystemMonitor() {
  const [logs, setLogs] = useState<{msg: string, type: 'info' | 'error'}[]>([]);

  useEffect(() => {
    (window as any).logToMonitor = (msg: string, type: 'info' | 'error' = 'info') => {
      setLogs(prev => [{ msg: `${new Date().toLocaleTimeString()}: ${msg}`, type }, ...prev].slice(0, 5));
    };
  }, []);

  if (logs.length === 0) return null;

  return (
    <div className="bg-slate-900 border-b border-slate-700 p-2 max-h-40 overflow-y-auto font-mono text-[10px] sticky top-0 z-[9999]">
      <div className="flex justify-between items-center mb-1 border-b border-slate-800 pb-1">
        <span className="text-blue-400 font-bold uppercase">📡 System Live Logs</span>
        <button onClick={() => setLogs([])} className="text-slate-500 hover:text-white">Zmazať [x]</button>
      </div>
      {logs.map((log, i) => (
        <div key={i} className={log.type === 'error' ? 'text-red-400 animate-pulse' : 'text-green-400'}>
          {log.type === 'error' ? '❌' : 'ℹ️'} {log.msg}
        </div>
      ))}
    </div>
  );
}