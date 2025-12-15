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
        <div className="w-full relative group">
            <div className="bg-slate-900 border border-slate-700 focus-within:border-blue-500 rounded-xl p-4 w-full flex items-center gap-4 transition-all shadow-lg min-h-[80px]">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700/50">
                    <LayoutGrid className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex flex-col flex-grow">
                    <span className="text-xs text-slate-500 font-bold uppercase mb-1">
                        Amount of {symbol || 'Tokens'}
                    </span>
                    <input
                        type="number"
                        min="0"
                        value={amount}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="1"
                        className="bg-transparent text-2xl font-bold text-white placeholder-slate-600 focus:outline-none w-full appearance-none"
                    />
                </div>
            </div>
        </div>
    );
}
