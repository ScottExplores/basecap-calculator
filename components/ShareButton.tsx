'use client';

import { Share2, Check, Copy } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

interface ShareButtonProps {
    tokenA: string;
    tokenB: string;
    price: string;
    multiplier: string;
}

export function ShareButton({ tokenA, tokenB, price, multiplier }: ShareButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const text = `${tokenA} with the market cap of ${tokenB} is ${price} (${multiplier}x)! 🚀 Checked on Base Market Cap.`;
        const url = window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Market Cap Calculator',
                    text: text,
                    url: url,
                });
            } catch (err) {
                console.log('Share canceled', err);
            }
        } else {
            // Fallback to clipboard
            try {
                await navigator.clipboard.writeText(`${text} ${url}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy', err);
            }
        }
    };

    return (
        <button
            onClick={handleShare}
            className={clsx(
                "flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all transform active:scale-95 shadow-lg border",
                copied
                    ? "bg-green-500/20 text-green-400 border-green-500/50"
                    : "bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white"
            )}
        >
            {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
            <span>{copied ? 'Copied!' : 'Share Result'}</span>
        </button>
    );
}
