'use client';

import clsx from 'clsx';
import { LayoutGrid } from 'lucide-react';

interface AmountInputProps {
    amount: number | string;
    onChange: (val: number | string) => void;
    symbol?: string;
}

export function AmountInput({ amount, onChange, symbol }: AmountInputProps) {
    return (
        <div className="w-full">
            <div className="relative group">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest absolute -top-2.5 left-3 bg-white dark:bg-slate-900 px-2 rounded z-10 transition-colors">Amount</label>
                <div className="flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 transition-all shadow-sm">
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => onChange(e.target.value)}
                        className="bg-transparent text-xl md:text-2xl font-black text-slate-900 dark:text-white focus:outline-none w-full placeholder-slate-400 dark:placeholder-slate-700"
                        placeholder="1"
                        min="0"
                    />
                    {symbol && (
                        <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800 ml-2">
                            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{symbol.toUpperCase()}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
