'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchTokens, TokenData, useTokenContract } from '@/hooks/useTokenData';
import { Search, X, ChevronDown, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTopTokens } from '@/hooks/useTopTokens';
import { useAccount } from 'wagmi';
import { useWalletTokens } from '@/hooks/useWalletTokens';
import { useMoxieSearch } from '@/hooks/useMoxieSearch';
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
    onSelect: (token: { id: string; symbol: string; name: string; image?: string } | null) => void;
}

type TabType = 'crypto' | 'contracts' | 'wallet'; // Removed stocks

// Internal component to handle image fallback state preventing transparent bleed-through
function TokenImage({ token }: { token: any }) {
    const [error, setError] = useState(false);

    // Resolve helper (duplicated to avoid scoped complexity or move out)
    const resolve = (img: any) => {
        if (!img) return '';
        if (typeof img === 'string') return img;
        return img.large || img.thumb || img.small || '';
    };

    const defaultLogo = DEFAULT_LOGOS[token.symbol?.toLowerCase()];
    // Prioritize Default -> Token Image
    // Use token.image from wallet (which might include proper DexScreener url now)
    const src = defaultLogo || resolve(token.image);

    if (!error && src) {
        return (
            <img
                src={src}
                alt={token.symbol}
                className="w-10 h-10 rounded-full object-cover bg-white dark:bg-slate-800"
                onError={() => setError(true)}
            />
        );
    }

    return (
        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 flex-shrink-0">
            <span className="font-bold text-slate-500 dark:text-slate-400">{token.symbol?.[0]}</span>
        </div>
    );
}

export function TokenInput({ placeholder, selectedToken, onSelect }: TokenInputProps) {
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('crypto');
    const [contractAddress, setContractAddress] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    // Wallet Hooks
    const { isConnected } = useAccount();
    const { tokens: walletTokens, isLoading: isLoadingWallet } = useWalletTokens();

    // Data Hooks
    const { data: searchResults } = useSearchTokens(query);
    const { data: topTokens } = useTopTokens();

    // Contract Tab Logic: Check if input looks like a contract address
    const isAddress = contractAddress.startsWith('0x') && contractAddress.length === 42;
    const { data: contractToken } = useTokenContract(isAddress ? contractAddress : '', 'base');

    // Moxie Search for usernames (only if not an address and has length)
    // We reuse the same input state 'contractAddress' for this dual purpose
    const { data: moxieTokens } = useMoxieSearch(!isAddress ? contractAddress : '');

    // Refs
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Auto-select wallet tab if connected
    useEffect(() => {
        if (isConnected && isOpen) {
            setActiveTab('wallet');
        } else if (!isConnected && activeTab === 'wallet') {
            setActiveTab('crypto');
        }
    }, [isConnected, isOpen]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (token: any) => {
        onSelect({
            id: token.id,
            symbol: token.symbol,
            name: token.name,
            image: resolveImage(token.image || token.logoURI),
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
    const displayList = (query.length > 0 ? searchResults : topTokens) || [];

    // Available tabs based on connection
    const tabs: TabType[] = isConnected
        ? ['wallet', 'crypto', 'contracts']
        : ['crypto', 'contracts']; // Removed stocks

    const displayImage = resolveImage(selectedToken?.image) || (selectedToken?.symbol && DEFAULT_LOGOS[selectedToken.symbol.toLowerCase()]);

    return (
        <div className="w-full relative group" ref={dropdownRef}>
            {/* Main Display Box */}
            <div
                onClick={() => {
                    const nextState = !isOpen;
                    setIsOpen(nextState);
                    if (nextState) {
                        setTimeout(() => inputRef.current?.focus(), 100);
                    }
                }}
                className="cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-3 w-full flex items-center justify-between transition-all shadow-lg hover:shadow-blue-500/10 h-[72px]"
            >
                {selectedToken ? (
                    <div className="flex items-center gap-3 w-full overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 p-1.5 flex-shrink-0 border border-slate-200 dark:border-slate-600 shadow-inner flex items-center justify-center">
                            {displayImage ? (
                                <img src={displayImage as string} alt={selectedToken.symbol} className="w-full h-full object-contain rounded-full" />
                            ) : (
                                <span className="text-xl font-bold dark:text-white">{selectedToken.symbol[0]}</span>
                            )}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-baseline gap-2">
                                <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white truncate">{selectedToken.symbol.toUpperCase()}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate hidden sm:block">{selectedToken.name}</span>
                            </div>
                        </div>
                        <div className="ml-auto flex flex-col items-end flex-shrink-0">
                            {selectedToken.current_price > 0 && (
                                <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                                    ${selectedToken.current_price < 0.01
                                        ? selectedToken.current_price.toLocaleString(undefined, { maximumSignificantDigits: 6 })
                                        : selectedToken.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-500 w-full h-full">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 border-dashed flex items-center justify-center flex-shrink-0">
                            <Search className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base font-bold text-slate-600 dark:text-slate-400">Select Token</span>
                        </div>
                    </div>
                )}
                <div className="text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors ml-3 border-l border-slate-200 dark:border-slate-800 pl-3">
                    {selectedToken ? (
                        <X
                            className="w-5 h-5 hover:text-red-600 dark:hover:text-red-400"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(null); // Clear selection
                                setIsOpen(true); // Open dropdown
                                setTimeout(() => inputRef.current?.focus(), 100);
                            }}
                        />
                    ) : (
                        <ChevronDown className="w-5 h-5" />
                    )}
                </div>
            </div>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl shadow-2xl z-50 overflow-hidden ring-1 ring-black/5 dark:ring-black/50"
                    >
                        {/* Tabs */}
                        <div className="flex items-center border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={clsx(
                                        "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2",
                                        activeTab === tab
                                            ? "text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 border-b-2 border-blue-500"
                                            : "text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/30"
                                    )}
                                >
                                    {tab === 'wallet' && <Wallet className="w-3 h-3" />}
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Search / Input Area */}
                        {(activeTab === 'crypto' || activeTab === 'contracts') && (
                            <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                {activeTab === 'contracts' ? (
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 border border-slate-200 dark:border-slate-800 placeholder-slate-400 dark:placeholder-slate-600 text-sm font-mono"
                                        placeholder="Enter contract address (0x...) or Farcaster username"
                                        value={contractAddress}
                                        onChange={(e) => setContractAddress(e.target.value)}
                                    />
                                ) : (
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 border border-slate-200 dark:border-slate-800 placeholder-slate-400 dark:placeholder-slate-600 text-lg"
                                        placeholder="Search tokens..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                    />
                                )}
                            </div>
                        )}

                        {/* List Area */}
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">

                            {/* Wallet Tab Content */}
                            {activeTab === 'wallet' && (
                                <div className="flex flex-col">
                                    {(walletTokens && walletTokens.length > 0) ? (
                                        walletTokens.map((token: any) => (
                                            <button
                                                key={token.id}
                                                className="w-full text-left px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-4 text-slate-900 dark:text-white transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0"
                                                onClick={() => handleSelect(token)}
                                            >
                                                <TokenImage token={token} />
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-base">{token.symbol.toUpperCase()}</span>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">{token.name}</span>
                                                </div>
                                                <div className="ml-auto flex flex-col items-end">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {token.valueUsd ? `$${token.valueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : parseFloat(token.balance).toFixed(4)}
                                                    </span>
                                                    <span className="text-xs text-slate-500">{token.valueUsd ? `${parseFloat(token.balance).toFixed(4)} ${token.symbol}` : 'Balance'}</span>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center flex flex-col items-center justify-center gap-4 text-slate-500">
                                            {isLoadingWallet ? (
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                            ) : (
                                                <>
                                                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-2">
                                                        <Wallet className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-bold text-slate-900 dark:text-white">No tokens found</span>
                                                        <span className="text-xs max-w-[200px] mx-auto opacity-70">We couldn't find any supported tokens in this wallet.</span>
                                                    </div>
                                                    <button
                                                        onClick={() => setActiveTab('crypto')}
                                                        className="mt-2 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 text-sm font-bold bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full border border-blue-200 dark:border-blue-500/30 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
                                                    >
                                                        Search all tokens
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'contracts' && (
                                <div className="flex flex-col">
                                    {contractToken && (
                                        <button
                                            className="w-full text-left px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-4 text-slate-900 dark:text-white transition-colors border-b border-slate-100 dark:border-slate-800/50 bg-blue-50 dark:bg-blue-900/10"
                                            onClick={() => handleSelect(contractToken)}
                                        >
                                            <img src={resolveImage(contractToken.image)} className="w-10 h-10 rounded-full" />
                                            <div className="flex flex-col">
                                                <span className="font-bold text-base">{contractToken.symbol.toUpperCase()}</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">{contractToken.name}</span>
                                            </div>
                                            <span className="ml-auto text-xs font-mono text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 px-2 py-1 rounded">Contract</span>
                                        </button>
                                    )}

                                    {moxieTokens?.map((token) => (
                                        <button
                                            key={token.id}
                                            className="w-full text-left px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-4 text-slate-900 dark:text-white transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0"
                                            onClick={() => handleSelect({ ...token, image: '' })} // Moxie tokens usually rely on default letter avatar if no image
                                        >
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                                <span className="font-bold text-slate-500 dark:text-slate-400">{token.symbol[0]}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-base">{token.name}</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">{token.symbol}</span>
                                            </div>
                                            <span className="ml-auto text-xs font-mono text-blue-600 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Fan Token</span>
                                        </button>
                                    ))}

                                    {!contractToken && (!moxieTokens || moxieTokens.length === 0) && contractAddress.length > 2 && (
                                        <div className="p-6 text-center text-slate-500">No results found</div>
                                    )}
                                </div>
                            )}



                            {activeTab === 'crypto' && (
                                <>
                                    {displayList.map((token: any) => (
                                        <button
                                            key={token.id}
                                            className="w-full text-left px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-4 text-slate-900 dark:text-white transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0"
                                            onClick={() => handleSelect(token)}
                                        >
                                            <img src={DEFAULT_LOGOS[token.symbol?.toLowerCase()] || resolveImage(token.image) || token.thumb} className="w-10 h-10 rounded-full" onError={(e: any) => e.currentTarget.style.display = 'none'} />
                                            <div className="flex flex-col">
                                                <span className="font-bold text-base">{token.symbol.toUpperCase()}</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">{token.name}</span>
                                            </div>
                                            {token.market_cap_rank && (
                                                <span className="ml-auto text-xs font-bold text-slate-400 dark:text-slate-600">#{token.market_cap_rank}</span>
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
