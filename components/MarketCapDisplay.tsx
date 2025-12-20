'use client';

import { useState } from 'react';
import { TokenData } from '@/hooks/useTokenData';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { AmountInput } from './AmountInput';
import { ShareButton } from '@/components/ShareButton';

interface MarketCapDisplayProps {
    tokenA: TokenData | null;
    tokenB: TokenData | null;
    amount?: number;
    onAmountChange?: (val: number | string) => void;
    onSwapClick?: () => void;
    userBalance?: string;
}

export function MarketCapDisplay({ tokenA, tokenB, amount = 1, onAmountChange, onSwapClick, userBalance }: MarketCapDisplayProps) {
    const [useATH, setUseATH] = useState(false);

    if (!tokenA || !tokenB) return null;

    const mcapA = tokenA.market_cap;
    const priceB = tokenB.current_price;
    const athPriceB = tokenB.ath;
    const mcapB_Current = tokenB.market_cap;

    const mcapB_ATH = mcapB_Current * (athPriceB / priceB);
    const targetMcapB = useATH ? mcapB_ATH : mcapB_Current;

    const multiplier = targetMcapB / mcapA;
    const projectedPricePerToken = tokenA.current_price * multiplier;
    const totalValue = projectedPricePerToken * amount;

    const isUpside = multiplier >= 1;
    const xValue = multiplier.toFixed(2); // Growth multiplier (e.g. 4.82x)

    // Relative Ratio for "Under/Above" text (e.g. 0.21x)
    const relativeRatio = (mcapA / targetMcapB);
    const relativeRatioDisplay = relativeRatio < 0.01
        ? relativeRatio.toExponential(2)
        : relativeRatio.toFixed(2);

    // Use simple string check for very small decimals to avoid scientific notation if preferred, or just more fixed digits
    const displayMultiplier = multiplier < 0.01 ? multiplier.toPrecision(2) : multiplier.toFixed(2);

    // Logic: If A is smaller than B (ratio < 1), it is "0.21x UNDER". 
    // If A is bigger (ratio > 1), it is "1.5x ABOVE" (or just show ratio).
    const isUnder = relativeRatio < 1;

    // Helper to resolve image (copied from TokenInput, ideally shared)
    const resolveImage = (img: any): string => {
        if (!img) return '';
        if (typeof img === 'string') return img;
        return img.large || img.thumb || img.small || '';
    };

    const formatMoney = (p: number) => {
        if (p === 0) return '$0.00';
        const absP = Math.abs(p);
        if (absP < 1) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: absP < 0.0001 ? 10 : 6
            }).format(p);
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(p);
    };
    const formatMcap = (m: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: "compact" }).format(m);
    };

    return (
        <div className="w-full bg-slate-800/50 backdrop-blur-md rounded-3xl p-8 border border-slate-700 shadow-2xl flex flex-col items-center relative overflow-hidden">

            {/* Action Buttons: Share (Left) & Swap (Right) */}
            <div className="mb-6 z-20 flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-2xl">

                <ShareButton
                    tokenA={tokenA.symbol.toUpperCase()}
                    tokenB={tokenB.symbol.toUpperCase()}
                    price={formatMoney(projectedPricePerToken)}
                    multiplier={multiplier.toFixed(2)}
                    className="!w-full md:!w-auto flex-1 h-14 !px-6 !py-0 !rounded-full !bg-slate-800 !border-slate-700 hover:!bg-slate-700 hover:!border-slate-600 !text-base"
                />

                {/* Valid on Base Check used for Buy Button Visibility */}
                {/* We count 'ETH' (Native), 'BTC' (cbBTC), or any token with a valid address as swappable on Base */}
                {(tokenA.symbol.toUpperCase() === 'ETH' || tokenA.symbol.toUpperCase() === 'BTC' || (tokenA.address && tokenA.address.startsWith('0x'))) ? (
                    <button
                        onClick={onSwapClick}
                        className="flex-1 h-14 w-full md:w-auto flex items-center justify-center gap-2 px-6 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-full font-bold shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-95 text-base whitespace-nowrap"
                    >
                        BUY {tokenA.symbol.toUpperCase()}
                    </button>
                ) : (
                    <div className="hidden md:flex flex-1 h-14 w-full md:w-auto items-center justify-center gap-2 px-6 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full font-bold cursor-not-allowed text-base whitespace-nowrap border border-slate-200 dark:border-slate-700">
                        Buy Unavailable
                    </div>
                )}
            </div>

            {/* Toggle */}
            <div className="flex bg-slate-900 rounded-lg p-1 mb-6 border border-slate-700 z-10">
                <button
                    onClick={() => setUseATH(false)}
                    className={clsx(
                        "px-6 py-2 text-sm font-bold rounded-md transition-all",
                        !useATH ? "bg-white text-slate-900 shadow" : "text-slate-400 hover:text-white"
                    )}
                >
                    {tokenB.symbol.toUpperCase()} NOW
                </button>
                <button
                    onClick={() => setUseATH(true)}
                    className={clsx(
                        "px-6 py-2 text-sm font-bold rounded-md transition-all",
                        useATH ? "bg-white text-slate-900 shadow" : "text-slate-400 hover:text-white"
                    )}
                >
                    {tokenB.symbol.toUpperCase()} ATH
                </button>
            </div>

            {/* Title */}
            <h3 className="text-xl md:text-2xl font-bold text-center mb-2 tracking-wide text-blue-200">
                {tokenA.symbol.toUpperCase()} WITH THE MARKET CAP OF {tokenB.symbol.toUpperCase()}
            </h3>

            {/* Projected Value (Moved) */}
            <div className="flex flex-col items-center text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                <div className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-1 tracking-wider uppercase">Projected Value</div>
                <div className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-violet-700 dark:from-white dark:to-slate-200 tracking-tighter filter drop-shadow-sm mb-2">
                    {formatMoney(totalValue)}
                </div>
                <div className="flex items-center gap-2">
                    <div className={clsx("px-3 py-1 rounded-full text-sm font-bold border",
                        multiplier > 1 ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" : "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                    )}>
                        {multiplier.toFixed(2)}x
                    </div>
                    <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">potential upside</span>
                </div>
            </div>



            <div className="flex flex-col items-center justify-center gap-8 relative z-10 w-full">

                {/* Token A Input Amount */}
                <div className="flex flex-col gap-2 w-full md:w-auto min-w-[200px]">
                    <AmountInput
                        amount={amount}
                        onChange={onAmountChange || (() => { })}
                        symbol={tokenA ? tokenA.symbol : 'TOKEN'}
                        userBalance={userBalance}
                    />
                    <div className="text-sm text-slate-500 dark:text-slate-500 pl-2">
                        Current Value: <span className="font-mono text-slate-900 dark:text-slate-300 font-bold">{formatMoney(projectedPricePerToken * amount / multiplier)}</span>
                    </div>
                </div>




            </div>

            {/* Visual Bar Graph */}
            <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto mt-8">
                {/* Bar A */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm mobile-text-adjust">
                        <span className="font-bold text-slate-700 dark:text-slate-200">{tokenA.symbol.toUpperCase()} NOW</span>
                        <span className="font-mono text-slate-500 dark:text-slate-400">{formatMcap(mcapA)}</span>
                    </div>
                    <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative border border-slate-200 dark:border-slate-700">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(mcapA / Math.max(mcapA, targetMcapB)) * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-blue-500 dark:bg-blue-500 relative"
                        >
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white flex items-center justify-center overflow-hidden">
                                <img src={resolveImage(tokenA.image)} className="w-full h-full object-cover" />
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Bar B (Target) */}
                <div className="space-y-2 opacity-50">
                    <div className="flex justify-between text-sm mobile-text-adjust">
                        <span className="font-bold text-slate-700 dark:text-slate-200">{tokenB.symbol.toUpperCase()} NOW</span>
                        <span className="font-mono text-slate-500 dark:text-slate-400">{formatMcap(targetMcapB)}</span>
                    </div>
                    <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative border border-slate-200 dark:border-slate-700">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(targetMcapB / Math.max(mcapA, targetMcapB)) * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-violet-500 dark:bg-violet-500 relative"
                        >
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white flex items-center justify-center overflow-hidden">
                                <img src={resolveImage(tokenB.image)} className="w-full h-full object-cover" />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="text-slate-500 text-xs mt-4">Data powered by CoinGecko</div>
        </div>
    );
}
