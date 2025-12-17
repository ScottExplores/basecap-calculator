'use client';

import { Github, ExternalLink, Coins } from 'lucide-react';
import { useState } from 'react';
import { BuyCreatorCoinModal } from './BuyCreatorCoinModal';

export function Footer() {
    const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

    return (
        <>
            <BuyCreatorCoinModal
                isOpen={isBuyModalOpen}
                onClose={() => setIsBuyModalOpen(false)}
            />
            <footer className="w-full py-8 text-slate-500 dark:text-slate-500 text-sm flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800/50 mt-12 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-6 rounded-t-2xl z-0">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <span className="text-slate-600 dark:text-slate-400 font-semibold text-sm">
                        © {new Date().getFullYear()} CreatorCap Calculator
                    </span>
                    <div className="flex gap-6 text-sm font-medium text-slate-500 dark:text-slate-500">
                        <a href="https://docs.base.org" target="_blank" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors">Base Docs</a>
                        <a href="https://warpcast.com" target="_blank" className="hover:text-violet-500 dark:hover:text-violet-400 transition-colors">Warpcast</a>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setIsBuyModalOpen(true)}
                        className="hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center gap-2 font-bold bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800 cursor-pointer"
                    >
                        <Coins className="w-4 h-4" />
                        <span>Buy my Creator Coin</span>
                    </button>
                    <a href="https://github.com/ScottExplores/basecap-calculator" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors flex items-center gap-2">
                        <Github className="w-4 h-4" />
                        <span>GitHub</span>
                    </a>
                    <a href="https://x.com/ScottExplores29" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors flex items-center gap-2">
                        <span className="text-lg font-bold">𝕏</span>
                    </a>
                    <a href="https://base.org" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        <span>Built on Base</span>
                    </a>
                </div>
            </footer>
        </>
    );
}
