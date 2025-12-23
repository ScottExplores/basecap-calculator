'use client';

import { Github, Coins } from 'lucide-react';
import { useState } from 'react';
export function Footer({ onBuyClick }: { onBuyClick?: () => void }) {

    return (
        <>
            <footer className="w-full py-8 text-slate-500 dark:text-slate-500 text-sm flex flex-col items-center justify-center gap-6 border-t border-slate-200 dark:border-slate-800/50 mt-12 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-6 rounded-t-2xl z-0">
                <div className="flex items-center gap-6">
                    <button
                        onClick={onBuyClick}
                        className="hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center gap-1.5 font-bold bg-green-50 dark:bg-green-900/20 px-2.5 py-1 text-xs rounded-full border border-green-200 dark:border-green-800 cursor-pointer"
                    >
                        <Coins className="w-3.5 h-3.5" />
                        <span>Buy my Creator Coin</span>
                    </button>
                    <a href="https://github.com/ScottExplores/basecap-calculator" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors flex items-center gap-2">
                        <Github className="w-4 h-4" />
                    </a>
                    <a href="https://x.com/ScottExplores29" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors flex items-center gap-2">
                        <span className="text-lg font-bold">𝕏</span>
                    </a>
                </div>
                <span className="text-slate-600 dark:text-slate-400 font-semibold text-xs opacity-75">
                    © 2026 CreatorCap Calculator
                </span>
            </footer>
        </>
    );
}
