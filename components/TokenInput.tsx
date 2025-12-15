'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchTokens, TokenData, useTokenContract } from '@/hooks/useTokenData';
import { Search, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTopTokens } from '@/hooks/useTopTokens';
import clsx from 'clsx';

// User requested specific defaults
const DEFAULT_LOGOS: Record<string, string> = {
    'eth': 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    'btc': 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    'usdc': 'https://assets.coingecko.com/coins/images/6319/large/usdc.png',
    'ethereum': 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    'bitcoin': 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'
};

interface TokenInputProps {
    placeholder?: string;
    selectedToken: TokenData | null | undefined;
    onSelect: (token: { id: string; symbol: string; name: string; image?: string }) => void;
}

export function TokenInput({ placeholder, selectedToken, onSelect }: TokenInputProps) {
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'crypto' | 'contracts' | 'stocks'>('crypto');
    const [contractAddress, setContractAddress] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    // Hooks
    const { data: searchResults } = useSearchTokens(query);
    const { data: topTokens } = useTopTokens();
    const { data: contractToken } = useTokenContract(contractAddress, 'ethereum'); // Defaulting to Ethereum for now

    // Refs
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Effect to auto-select contract token if found
    useEffect(() => {
        if (contractToken && activeTab === 'contracts') {
            // We could auto-select, but maybe just showing it in a list is better so user clicks it
        }
    }, [contractToken, activeTab]);

    const handleSelect = (token: any) => {
        onSelect({
            id: token.id,
            symbol: token.symbol,
            name: token.name,
            image: resolveImage(token.image) || DEFAULT_LOGOS[token.symbol?.toLowerCase()] || resolveImage(token.large) || resolveImage(token.thumb),
        });
        setIsOpen(false);
        setQuery('');
        setContractAddress('');
    };

    // Helper to resolve image
    const resolveImage = (img: any): string => {
        if (!img) return '';
        if (typeof img === 'string') return img;
        return img.large || img.thumb || img.small || '';
    };

    // Filter top tokens if there is a query, but searchResults usually handles API search.
    // If query is empty, show Top Tokens. If query exists, show Search Results.
    const displayList = (query.length > 0 ? searchResults : topTokens) || [];

    const displayImage = resolveImage(selectedToken?.image) || (selectedToken?.symbol && DEFAULT_LOGOS[selectedToken.symbol.toLowerCase()]);

    return (
        <div className="w-full relative group" ref={dropdownRef}>
            {/* Main Display Box */}
            <div
                onClick={() => {
                    setIsOpen(true);
                    setTimeout(() => inputRef.current?.focus(), 100);
                }}
                className="cursor-pointer bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl p-4 w-full flex items-center justify-between transition-all shadow-lg hover:shadow-blue-500/10 min-h-[100px]"
            >
                {selectedToken ? (
                    <div className="flex items-center gap-5 w-full">
                        <div className="w-16 h-16 rounded-full bg-slate-800 p-2 flex-shrink-0 border border-slate-600 shadow-inner flex items-center justify-center">
                            {displayImage ? (
                                <img src={displayImage as string} alt={selectedToken.symbol} className="w-full h-full object-contain rounded-full" />
                            ) : (
                                <span className="text-2xl font-bold">{selectedToken.symbol[0]}</span>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-3xl tracking-tight text-white">{selectedToken.symbol.toUpperCase()}</span>
                            <span className="text-sm text-slate-400 font-medium">{selectedToken.name}</span>
                            {selectedToken.current_price && (
                                <span className="text-xs text-blue-400 mt-1 font-mono">${selectedToken.current_price.toLocaleString()}</span>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-4 text-slate-500 w-full h-full">
                        <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 border-dashed flex items-center justify-center">
                            <Search className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold text-slate-400">Select Token</span>
                            <span className="text-sm">{placeholder || "Search name or ticker..."}</span>
                        </div>
                    </div>
                )}
                <div className="text-slate-500 group-hover:text-blue-400 transition-colors">
                    {selectedToken ? <X className="w-6 h-6 hover:text-red-400" onClick={(e) => { e.stopPropagation(); setIsOpen(true); }} /> : <ChevronDown className="w-6 h-6" />}
                </div>
            </div>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-600 rounded-xl shadow-2xl z-50 overflow-hidden ring-1 ring-black/50"
                    >
                        {/* Tabs */}
                        <div className="flex items-center border-b border-slate-700 bg-slate-800/50">
                            {['crypto', 'contracts', 'stocks'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={clsx(
                                        "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors",
                                        activeTab === tab ? "text-blue-400 bg-slate-800 border-b-2 border-blue-500" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/30"
                                    )}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Search / Input Area */}
                        <div className="p-3 border-b border-slate-700 bg-slate-800/50">
                            {activeTab === 'contracts' ? (
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="w-full bg-slate-950 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-slate-600 text-sm font-mono"
                                    placeholder="Enter contract address (0x...)"
                                    value={contractAddress}
                                    onChange={(e) => setContractAddress(e.target.value)}
                                />
                            ) : (
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="w-full bg-slate-950 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-slate-600 text-lg"
                                    placeholder={activeTab === 'stocks' ? "Search stocks..." : "Search tokens..."}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            )}
                        </div>

                        {/* List Area */}
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {activeTab === 'contracts' && contractToken && (
                                <button
                                    className="w-full text-left px-5 py-4 hover:bg-slate-800 flex items-center gap-4 text-white transition-colors border-b border-slate-800/50 bg-blue-900/10"
                                    onClick={() => handleSelect(contractToken)}
                                >
                                    <img src={resolveImage(contractToken.image)} className="w-10 h-10 rounded-full" />
                                    <div className="flex flex-col">
                                        <span className="font-bold text-base">{contractToken.symbol.toUpperCase()}</span>
                                        <span className="text-xs text-slate-400">{contractToken.name}</span>
                                    </div>
                                    <span className="ml-auto text-xs font-mono text-blue-400 border border-blue-500/30 px-2 py-1 rounded">Contract Found</span>
                                </button>
                            )}

                            {activeTab === 'stocks' && (
                                <div className="p-8 text-center text-slate-500 text-sm">
                                    Stock data integration coming soon.
                                </div>
                            )}

                            {activeTab === 'crypto' && (
                                <>
                                    {displayList.map((token: any) => (
                                        <button
                                            key={token.id}
                                            className="w-full text-left px-5 py-4 hover:bg-slate-800 flex items-center gap-4 text-white transition-colors border-b border-slate-800/50 last:border-0"
                                            onClick={() => handleSelect(token)}
                                        >
                                            <img src={DEFAULT_LOGOS[token.symbol?.toLowerCase()] || token.thumb || token.image} className="w-10 h-10 rounded-full" onError={(e: any) => e.currentTarget.style.display = 'none'} />
                                            <div className="flex flex-col">
                                                <span className="font-bold text-base">{token.symbol.toUpperCase()}</span>
                                                <span className="text-xs text-slate-400">{token.name}</span>
                                            </div>
                                            {token.market_cap_rank && (
                                                <span className="ml-auto text-xs font-bold text-slate-600">#{token.market_cap_rank}</span>
                                            )}
                                        </button>
                                    ))}
                                    {query.length > 0 && searchResults?.length === 0 && (
                                        <div className="p-6 text-center text-slate-500">No tokens found</div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
