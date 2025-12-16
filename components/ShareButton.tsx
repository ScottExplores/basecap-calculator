'use client';

import { Share2, Check } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import sdk from '@farcaster/miniapp-sdk';

interface ShareButtonProps {
    tokenA: string;
    tokenB: string;
    price: string;
    multiplier: string;
}

export function ShareButton({ tokenA, tokenB, price, multiplier }: ShareButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const text = `${tokenA} with the market cap of ${tokenB} is ${price} (${multiplier}x)! 🚀 Checked on Base Market Cap app.`;
        const url = window.location.href; // Or a specific canonical URL if needed

        try {
            // Attempt to use Farcaster SDK first
            // Note: The specific method might be addCast or just via intent if strictly miniapp
            // We'll try the intent URL method as a primary robust fallback for "miniapps" which often just open the composer

            // Standard Warpcast Intent (works in web and mobile app usually)
            const intentUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(url)}`;

            // If we are in the SDK context, native actions are preferred, but intent links are universally supported for now
            // until we confirm exact SDK method support for "createCast" in this version.
            window.open(intentUrl, '_blank');

        } catch (err) {
            console.error('Share failed', err);
            // Fallback to clipboard
            try {
                await navigator.clipboard.writeText(`${text} ${url}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (clipboardErr) {
                console.error('Clipboard failed', clipboardErr);
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
                    : "bg-blue-600 text-white border-blue-500 hover:bg-blue-500"
            )}
        >
            {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
            <span>{copied ? 'Copied!' : 'Share on Farcaster'}</span>
        </button>
    );
}
