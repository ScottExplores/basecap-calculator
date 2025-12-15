'use client';

import { useState } from 'react';
import { TokenData } from '@/hooks/useTokenData';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { AmountInput } from './AmountInput';

interface MarketCapDisplayProps {
    tokenA: TokenData | null;
    tokenB: TokenData | null;
    amount?: number;
    onAmountChange?: (val: number | string) => void;
}

export function MarketCapDisplay({ tokenA, tokenB, amount = 1, onAmountChange }: MarketCapDisplayProps) {
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
    const xValue = multiplier.toFixed(2);
    const percentChange = ((multiplier - 1) * 100).toFixed(0);

    const formatMoney = (p: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(p);
    };
    const formatMcap = (m: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: "compact" }).format(m);
    };

    return (
        <div className="w-full bg-slate-800/50 backdrop-blur-md rounded-3xl p-8 border border-slate-700 shadow-2xl flex flex-col items-center relative overflow-hidden">

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

            {/* Big Price */}
            <div className="flex items-baseline gap-3 mb-8">
                <span className="text-5xl md:text-6xl font-black text-white drop-shadow-lg">
                    {formatMoney(totalValue / amount)} {/* Price per token implied */}
                </span>
                <span className={clsx("text-2xl font-bold", isUpside ? "text-green-400" : "text-red-400")}>
                    ({xValue}x)
                </span>
            </div>

            {/* Amount Input */}
            <div className="w-full max-w-md mb-8 z-10">
                {onAmountChange && (
                    <AmountInput
                        amount={amount}
                        onChange={onAmountChange}
                        symbol={tokenA.symbol.toUpperCase()}
                    />
                )}
            </div>

            {/* Equation */}
            <div className="text-center mb-6">
                <span className="text-xl md:text-3xl font-bold tracking-wider">
                    <span className="text-blue-400">{tokenA.symbol.toUpperCase()}</span> IS <span className={isUpside ? "text-green-400" : "text-red-400"}>{xValue}X</span> {isUpside ? "ABOVE" : "UNDER"} <span className="text-violet-400">{tokenB.symbol.toUpperCase()}</span>
                </span>
            </div>

            {/* Visual Progress Bars */}
            <div className="w-full max-w-lg mb-8 space-y-3">
                {/* Bar A */}
                <div className="w-full flex items-center gap-4">
                    <div className="flex-grow h-3 bg-slate-700/50 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: isUpside ? '100%' : `${multiplier * 100}%` }}
                            className={clsx("h-full rounded-full", isUpside ? "bg-green-500" : "bg-red-500")}
                        />
                    </div>
                    <div className="w-24 text-right font-mono text-xs text-slate-400">{tokenA.symbol}</div>
                    <div className={clsx("w-24 font-mono text-sm text-right", isUpside ? "text-green-400" : "text-red-400")}>{formatMcap(mcapA)}</div>
                </div>

                {/* Bar B */}
                <div className="w-full flex items-center gap-4">
                    <div className="flex-grow h-3 bg-slate-700/50 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: isUpside ? `${(1 / multiplier) * 100}%` : '100%' }} // If A is upside (bigger), B is smaller relative to A.
                            className="h-full bg-violet-500 rounded-full"
                        />
                    </div>
                    <div className="w-24 text-right font-mono text-xs text-slate-400">{tokenB.symbol}</div>
                    <div className="w-24 font-mono text-sm text-right text-violet-400">{formatMcap(targetMcapB)}</div>
                </div>
            </div>

            <div className="text-slate-500 text-xs mt-4">Data powered by CoinGecko</div>
        </div>
    );
}
