'use client';

import clsx from 'clsx';
import { LayoutGrid } from 'lucide-react';

interface AmountInputProps {
    amount: number | string;
    onChange: (val: number | string) => void;
    symbol?: string;
    userBalance?: string;
}

export function AmountInput({ amount, onChange, symbol, userBalance }: AmountInputProps) {
    return (
        <div className="w-full">
            <div className="relative group">
                <label className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider absolute -top-3 left-4 bg-white dark:bg-slate-900 px-2 rounded z-10 transition-colors flex items-center gap-2 shadow-sm border border-slate-100 dark:border-slate-800 rotate-1">
                    👇 How much do you own? 👀
                </label>
                <div className="flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 transition-all shadow-sm">
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => onChange(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="bg-transparent text-xl md:text-2xl font-black text-slate-900 dark:text-white focus:outline-none w-full placeholder-slate-400 dark:placeholder-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="1"
                        min="0"
                    />
                    {symbol && (
                        <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800 ml-2">
                            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{symbol.toUpperCase()}</span>
                            {userBalance && (
                                <button
                                    onClick={() => onChange(userBalance)}
                                    className="text-[10px] font-black bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                >
                                    MAX
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
