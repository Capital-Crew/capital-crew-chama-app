
import React from 'react';

export const Card: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4">
        <div className="bg-cyan-500/10 p-3 rounded-xl text-cyan-500">{icon}</div>
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
            <p className="text-2xl font-black text-slate-900">{value}</p>
        </div>
    </div>
);
