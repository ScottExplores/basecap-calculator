'use client';
import {
    Swap,
    SwapAmountInput,
    SwapToggleButton,
    SwapButton,
    SwapMessage,
    SwapToast
} from '@coinbase/onchainkit/swap';
import { Wallet, ConnectWallet } from '@coinbase/onchainkit/wallet';
import { useAccount } from 'wagmi';
import type { Token } from '@coinbase/onchainkit/token';
import { X, Search, Users } from 'lucide-react';
import clsx from 'clsx';
import { TokenData } from '@/hooks/useTokenData';
import { useMoxieSearch, MoxieToken } from '@/hooks/useMoxieSearch';
import { useState } from 'react';

interface SwapModalProps {
    isOpen: boolean;
    onClose: () => void;
    tokenIn: TokenData | null;
    tokenOut: TokenData | null;
}

export function SwapModal({ isOpen, onClose, tokenIn, tokenOut }: SwapModalProps) {
    const { address } = useAccount();
    const [activeTab, setActiveTab] = useState<'standard' | 'farcaster'>('standard');
    const [searchQuery, setSearchQuery] = useState('');
    const { data: searchResults, isLoading } = useMoxieSearch(searchQuery);

    // Selected Moxie Token to override default 'to' token
    const [selectedMoxieToken, setSelectedMoxieToken] = useState<MoxieToken | null>(null);

    if (!isOpen) return null;

    // Helper to map TokenData to OnchainKit Token
    const mapToken = (t: TokenData | null): Token | undefined => {
        if (!t) return undefined;
        return {
            name: t.name,
            address: (t.address || "") as `0x${string}`, // Safe fallback if no address
            symbol: t.symbol,
            decimals: 18,
            image: typeof t.image === 'string' ? t.image : t.image?.large || t.image?.small || "",
            chainId: 8453,
        };
    };

    const fromToken = mapToken(tokenIn);

    // Determine To Token: If Farcaster mode & selected, use that. Else standard.
    const getToToken = (): Token | undefined => {
        if (selectedMoxieToken) {
            return {
                name: selectedMoxieToken.name,
                address: selectedMoxieToken.id as `0x${string}`,
                symbol: selectedMoxieToken.symbol,
                decimals: 18,
                image: "", // Moxie tokens might need separate image resolution
                chainId: 8453
            };
        }
        return mapToken(tokenOut);
    };

    const toToken = getToToken();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 relative shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors z-10"
                >
                    <X className="w-5 h-5 text-slate-500" />
                </button>

                <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Swap Tokens</h2>

                    {/* Tabs */}
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mt-4">
                        <button
                            onClick={() => setActiveTab('standard')}
                            className={clsx("flex-1 py-1.5 text-sm font-semibold rounded-lg transition-all", activeTab === 'standard' ? "bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
                        >
                            Standard
                        </button>
                        <button
                            onClick={() => setActiveTab('farcaster')}
                            className={clsx("flex-1 py-1.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2", activeTab === 'farcaster' ? "bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
                        >
                            <Users className="w-4 h-4" />
                            Farcaster Friend
                        </button>
                    </div>
                </div>

                {/* Farcaster Search UI */}
                {activeTab === 'farcaster' && !selectedMoxieToken && (
                    <div className="flex-1 overflow-y-auto min-h-[300px]">
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search username (e.g. dwr)"
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {isLoading && <div className="text-center text-slate-400 py-4">Searching...</div>}

                        <div className="space-y-2">
                            {searchResults?.map((token) => (
                                <button
                                    key={token.id}
                                    onClick={() => setSelectedMoxieToken(token)}
                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group"
                                >
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            {token.name}
                                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                                                {token.symbol}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500 truncate w-32 md:w-48">{token.id}</div>
                                    </div>
                                    <div className="text-xs text-slate-400 group-hover:text-blue-500 font-medium">
                                        Select
                                    </div>
                                </button>
                            ))}
                            {searchQuery && searchResults?.length === 0 && !isLoading && (
                                <div className="text-center text-slate-400 py-8">No fan tokens found.</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Swap Interface (Standard OR Farcaster Selected) */}
                {(activeTab === 'standard' || selectedMoxieToken) && (
                    <div className="animate-in slide-in-from-bottom-5 duration-300">
                        {activeTab === 'farcaster' && selectedMoxieToken && (
                            <button
                                onClick={() => setSelectedMoxieToken(null)}
                                className="mb-2 text-xs font-bold text-slate-500 hover:text-blue-500 flex items-center gap-1"
                            >
                                ← Back to Search
                            </button>
                        )}

                        {address ? (
                            <Swap>
                                <SwapAmountInput label="Sell" token={fromToken} type="from" />
                                <SwapToggleButton />
                                <SwapAmountInput label="Buy" token={toToken} type="to" />
                                <SwapButton />
                                <SwapMessage />
                                <SwapToast />
                            </Swap>
                        ) : (
                            <div className="flex flex-col items-center gap-4 py-8">
                                <p className="text-slate-500">Please connect your wallet to swap.</p>
                                <Wallet>
                                    <ConnectWallet className="bg-blue-600" />
                                </Wallet>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
