'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchTokens, TokenData, useTokenContract, useTrendingTokens } from '@/hooks/useTokenData';
import { Search, X, ChevronDown, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTopTokens } from '@/hooks/useTopTokens';
import { useAccount } from 'wagmi';
import { useWalletTokens } from '@/hooks/useWalletTokens';
import { useMoxieSearch } from '@/hooks/useMoxieSearch';
import { handleCoinSearch, getSearchSuggestions } from '@/utils/searchHandler';
import clsx from 'clsx';

// User requested specific defaults
const DEFAULT_LOGOS: Record<string, string> = {
    'eth': 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    'btc': 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    'usdc': 'https://assets.coingecko.com/coins/images/6319/large/usdc.png',
    'ethereum': 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    'bitcoin': 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'
};

const FEATURED_TOKENS = [
    {
        id: '0xf5546bf64475b8ece6ac031e92e4f91a88d9dc5e',
        name: 'Scott Explores',
        symbol: 'scottexplores',
        address: '0xf5546bf64475b8ece6ac031e92e4f91a88d9dc5e',
        image: 'https://scontent-iad4-1.choicecdn.com/-/rs:fit:600:600/f:best/aHR0cHM6Ly9tYWdpYy5kZWNlbnRyYWxpemVkLWNvbnRlbnQuY29tL2lwZnMvYmFmeWJlaWVpaDVvaHV1bTJhbDZhdHV6Z2k1dGJ1c3FiNGVtM3lxbHp4cHVndWs1b2x1Y2c1cDJsa2E=',
        current_price: 0
    },
    {
        id: '0xb6d6c6ede07db3cef403131bd85a26971e5c73aa',
        name: 'lani_loves',
        symbol: 'lani_loves',
        address: '0xb6d6c6ede07db3cef403131bd85a26971e5c73aa',
        image: 'https://scontent-iad4-1.choicecdn.com/-/rs:fit:600:600/f:best/aHR0cHM6Ly9tYWdpYy5kZWNlbnRyYWxpemVkLWNvbnRlbnQuY29tL2lwZnMvYmFmeWJlaWFwaWZ3c29sYmQ1YjNkNXl6ZzRseTU0ZmxkeHM2d28zd3czajRjeGc0Zmk0NW9heGltbmk=',
        current_price: 0
    },
    {
        id: '0x50f88fe97f72cd3e75b9eb4f747f59bceba80d59',
        name: 'Jesse Pollak',
        symbol: 'JESSEPOLLAK',
        address: '0x50f88fe97f72cd3e75b9eb4f747f59bceba80d59',
        image: 'https://dd.dexscreener.com/ds-data/tokens/base/0x50f88fe97f72cd3e75b9eb4f747f59bceba80d59.png', // DexScreener fallback or Zora if found
        current_price: 0
    },
    {
        id: '0x787b7b7117848c1f9fc79a8fa543202c231c1edb',
        name: 'crypticpoet',
        symbol: 'crypticpoet',
        address: '0x787b7b7117848c1f9fc79a8fa543202c231c1edb',
        image: 'https://scontent-iad4-1.choicecdn.com/-/rs:fit:600:600/f:best/aHR0cHM6Ly9tYWdpYy5kZWNlbnRyYWxpemVkLWNvbnRlbnQuY29tL2lwZnMvYmFmeWJlaWhuNjR6b3hvZGNwazN1czY0Y29uZWtseHJ0N2ZkZTdkdHQ0YjVvYmNtZmlneDVtZm14c3U=',
        current_price: 0
    },
    {
        id: '0x9f62b62cf8cc3aea56a3ce8808cf13503d1131e7',
        name: 'The Nick Shirley',
        symbol: 'THENICKSHIRLEY',
        address: '0x9f62b62cf8cc3aea56a3ce8808cf13503d1131e7',
        image: 'https://dd.dexscreener.com/ds-data/tokens/base/0x9f62b62cf8cc3aea56a3ce8808cf13503d1131e7.png',
        current_price: 0
    }
];

interface TokenInputProps {
    placeholder?: string;
    selectedToken: TokenData | null | undefined;
    onSelect: (token: TokenData | null) => void;
    defaultTab?: TabType;
    allowCustom?: boolean;
}

type TabType = 'creator_coins' | 'crypto' | 'wallet' | 'custom'; // Added custom section

// Helper to resolve image from various metadata structures (CG, DexScreener, Zora)
const resolveImage = (img: any): string => {
    if (!img) return '';
    if (typeof img === 'string') return img;

    // Zora / common preview formats
    if (img.previewImage) {
        if (typeof img.previewImage === 'string') return img.previewImage;
        return img.previewImage.url || img.previewImage.medium || img.previewImage.large || img.previewImage.thumbnail || img.previewImage.small || '';
    }

    // Direct object with size keys
    if (img.url || img.medium || img.large || img.thumbnail || img.small) {
        return img.url || img.medium || img.large || img.thumbnail || img.small || '';
    }

    // CoinGecko / DexScreener formats
    if (img.large || img.thumb || img.small) return img.large || img.thumb || img.small;

    return '';
};

// Internal component to handle image fallback state
function TokenImage({ token, className = "w-10 h-10" }: { token: any; className?: string }) {
    const [error, setError] = useState(false);
    const symbol = token.symbol || '?';

    const defaultLogo = DEFAULT_LOGOS[symbol.toLowerCase()];
    // Prioritize Default -> Token Image Source
    const src = defaultLogo || resolveImage(token.image || token.logoURI || token.mediaContent);

    if (!error && src) {
        return (
            <img
                src={src}
                alt={symbol}
                className={clsx(className, "rounded-full object-cover bg-white dark:bg-slate-800")}
                onError={() => setError(true)}
            />
        );
    }

    return (
        <div className={clsx(className, "rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 flex-shrink-0")}>
            <span className="font-bold text-slate-500 dark:text-slate-400 uppercase">{symbol[0]}</span>
        </div>
    );
}

export function TokenInput({
    placeholder = "Select Token",
    selectedToken,
    onSelect,
    defaultTab = 'creator_coins',
    allowCustom = true
}: TokenInputProps) {
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>(defaultTab); // Initialize with prop
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [customMarketCap, setCustomMarketCap] = useState('');

    // Wallet Hooks
    const { isConnected } = useAccount();
    const { tokens: walletTokens, isLoading: isLoadingWallet } = useWalletTokens();

    // Debounce Query Effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 500); // 500ms debounce
        return () => clearTimeout(timer);
    }, [query]);

    // Data Hooks
    // Requests for specific tabs
    const { data: searchResults } = useSearchTokens(activeTab === 'crypto' ? debouncedQuery : ''); // Only search CG if in Crypto tab and using debounced query
    const { data: trendingTokens, isLoading: isLoadingTrending } = useTrendingTokens(); // Legacy hook, might still be used for generic crypto trending? Or remove if replacing entirely
    // Wait, User said "Instead of having trending in the creator coins section". 
    // We can keep useTrendingTokens for Crypto tab if we want, but for now focusing on Creator Coins tab replacement.

    const { data: topTokens } = useTopTokens();

    // Contract Search Logic: Check if QUERY looks like a contract address OR ENS
    // Only active in Creator Coins tab or if explicitly pasting an address? 
    // User wants Creator Coins to be Zora APIs.
    const isAddress = (query.startsWith('0x') && query.length === 42) || query.toLowerCase().endsWith('.eth');

    // We use the 'query' as the address/input if it matches pattern
    const { data: contractToken } = useTokenContract((activeTab === 'creator_coins' && isAddress) ? query : '', 'base');

    // Moxie Search for usernames (only if not an address and has length)
    // We use 'query' context
    const { data: moxieTokens } = useMoxieSearch((activeTab === 'creator_coins' && !isAddress && query.startsWith('@')) ? query : '');

    // Zora Search State
    const [zoraResult, setZoraResult] = useState<any>(null);
    const [isSearchingZora, setIsSearchingZora] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);

    // Suggestions Fetching logic (faster/debounced API) - Only for Creator Coins
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (activeTab === 'creator_coins' && query.trim().length >= 2 && !isAddress) {
                setIsSearchingSuggestions(true);
                try {
                    const results = await getSearchSuggestions(query);
                    setSuggestions(results);
                } catch (error) {
                    console.error("Suggestions fetch error:", error);
                    setSuggestions([]);
                } finally {
                    setIsSearchingSuggestions(false);
                }
            } else {
                setSuggestions([]);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        const performZoraSearch = async () => {
            if (activeTab === 'creator_coins' && query.trim().length >= 3) {
                setIsSearchingZora(true);
                try {
                    const result = await handleCoinSearch(query);
                    setZoraResult(result);
                } catch (error) {
                    console.error("Zora search error:", error);
                    setZoraResult(null);
                } finally {
                    setIsSearchingZora(false);
                }
            } else {
                setZoraResult(null);
            }
        };

        const timer = setTimeout(performZoraSearch, 300);
        return () => clearTimeout(timer);
    }, [query, activeTab]);

    // Refs
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Default to Creator Coins tab on open
    useEffect(() => {
        if (isOpen) {
            setActiveTab(defaultTab);
        }
    }, [isOpen, defaultTab]);

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
            ...token,
            image: resolveImage(token.image || token.logoURI || token.mediaContent),
            current_price: token.current_price || 0,
            market_cap: token.market_cap || 0,
            market_cap_rank: token.market_cap_rank || 0,
            price_change_percentage_24h: token.price_change_percentage_24h || 0,
            ath: token.ath || 0
        });
        setIsOpen(false);
        setQuery('');
        // setContractAddress(''); // Removed state
    };

    const handleSelectCustom = () => {
        if (!customMarketCap) return;
        const mcap = parseFloat(customMarketCap.replace(/,/g, ''));
        if (isNaN(mcap)) return;

        onSelect({
            id: `custom-mcap-${Date.now()}`,
            symbol: 'Market Cap',
            name: 'Market Cap',
            image: '', // No image for custom
            current_price: 0, // We'll display MC instead
            market_cap: mcap,
            market_cap_rank: 0,
            price_change_percentage_24h: 0,
            ath: 0,
            isCustom: true
        });

        setIsOpen(false);
        setQuery('');
        setCustomMarketCap('');
    };

    // Helper is now top-level

    // Filter top tokens if there is a query, but searchResults usually handles API search.
    // Filter top tokens if there is a query, but searchResults usually handles API search.
    // If in top100 and searching, use searchResults. If in top100 and NOT searching, use topTokens.
    // Filter top tokens if there is a query, but searchResults usually handles API search.
    // If in crypto and searching, use searchResults. If in crypto and NOT searching, use topTokens.
    const displayList = (activeTab === 'crypto' && query.length > 0) ? (searchResults || []) : (topTokens || []);

    // Available tabs based on connection. Start with Search (creator_coins)
    // User requested "search section as the new default view" and "replace contracts with top 100"

    const orderedTabs: TabType[] = ['creator_coins', 'crypto', 'wallet', 'custom'];
    const visibleTabs = (isConnected ? orderedTabs : (['creator_coins', 'crypto', 'custom'] as TabType[]))
        .filter(tab => tab !== 'custom' || allowCustom);


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
                        <TokenImage token={selectedToken} />
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-baseline gap-2">
                                <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white truncate">{selectedToken?.symbol?.toUpperCase() || 'TOKEN'}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate hidden sm:block">{selectedToken?.name || ''}</span>
                            </div>
                        </div>
                        <div className="ml-auto flex flex-col items-end flex-shrink-0">
                            {selectedToken?.isCustom ? (
                                <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                                    ${new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 2 }).format(selectedToken?.market_cap || 0)}
                                </span>
                            ) : (selectedToken?.current_price && selectedToken.current_price > 0) ? (
                                <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                                    {new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'USD',
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: selectedToken.current_price < 0.0001 ? 10 : 6
                                    }).format(selectedToken.current_price)}
                                </span>
                            ) : null}
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
                            {visibleTabs.map((tab: TabType) => (
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
                                    {tab === 'creator_coins' ? 'Creator Coins' : tab === 'crypto' ? 'Crypto' : tab === 'custom' ? 'Custom' : tab}
                                </button>
                            ))}
                        </div>

                        {/* Search / Input Area */}
                        {/* Search / Input Area */}
                        {/* Show input for Crypto (Search) and now Top 100 too (to filter?) or just Crypto? */}
                        {/* Usually Top 100 is just a list, but maybe filterable. For now, only Crypto has search bar input by default behavior */}
                        {/* Search / Input Area - Visible for both Creator Coins and Crypto */}
                        {(activeTab === 'creator_coins' || activeTab === 'crypto') && (
                            <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 border border-slate-200 dark:border-slate-800 placeholder-slate-400 dark:placeholder-slate-600 text-lg font-sans"
                                    placeholder={activeTab === 'creator_coins' ? "Search creator coins (Zora)..." : "Search all crypto (CoinGecko)..."}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />

                                {/* Suggestions Dropdown - ONLY for Creator Coins */}
                                <AnimatePresence>
                                    {activeTab === 'creator_coins' && suggestions.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className="absolute left-3 right-3 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-[60] overflow-hidden"
                                        >
                                            <div className="flex flex-col">
                                                {suggestions.map((coin: any) => (
                                                    <button
                                                        key={coin.address}
                                                        className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-3 text-slate-900 dark:text-white transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0"
                                                        onClick={() => {
                                                            setQuery(coin.address); // Trigger full match
                                                            setSuggestions([]); // Clear suggestions
                                                        }}
                                                    >
                                                        <TokenImage
                                                            token={{
                                                                symbol: coin.symbol,
                                                                mediaContent: coin.mediaContent
                                                            }}
                                                            className="w-6 h-6"
                                                        />
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <span className="font-bold text-sm">{coin.symbol?.toUpperCase()}</span>
                                                            <span className="text-xs text-slate-500 truncate">{coin.name}</span>
                                                        </div>
                                                        <span className="ml-auto text-[10px] text-blue-500 bg-blue-50 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">Zora</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
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
                                                    <span className="font-bold text-base">{(token.symbol || '?').toUpperCase()}</span>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">{token.name || 'Unknown'}</span>
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
                                                        onClick={() => setActiveTab('creator_coins')}
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

                            {activeTab === 'crypto' && (
                                <div className="flex flex-col">
                                    {/* Header for Crypto */}
                                    {(!query || query.length === 0) && (
                                        <div className="px-5 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/30 flex justify-between">
                                            <span>Token</span>
                                            <span>Price / 24h</span>
                                        </div>
                                    )}

                                    {displayList?.map((token: any) => (
                                        <button
                                            key={token.id}
                                            className="w-full text-left px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-4 text-slate-900 dark:text-white transition-colors border-b border-slate-100 dark:border-slate-800/50"
                                            onClick={() => handleSelect(token)}
                                        >
                                            <div className="flex items-center justify-center w-8 h-8 font-bold text-xs text-slate-400 mr-1">
                                                {token.market_cap_rank}
                                            </div>
                                            <div className="relative">
                                                <TokenImage token={token} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-base flex items-center gap-2">
                                                    {token.symbol.toUpperCase()}
                                                    {typeof token.price_change_percentage_24h === 'number' && (
                                                        <span className={clsx("text-xs font-mono", token.price_change_percentage_24h >= 0 ? "text-green-500" : "text-red-500")}>
                                                            {token.price_change_percentage_24h > 0 ? '+' : ''}{token.price_change_percentage_24h.toFixed(2)}%
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 max-w-[120px] truncate">{token.name}</span>
                                            </div>
                                            <div className="ml-auto flex flex-col items-end">
                                                <span className="font-mono font-bold text-sm">${token.current_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                                                <span className="text-[10px] text-slate-500">
                                                    MC: ${new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 2 }).format(token.market_cap)}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                    {displayList?.length === 0 && <div className="p-8 text-center text-slate-500">Loading top tokens...</div>}
                                </div>
                            )}



                            {activeTab === 'creator_coins' && (
                                <>
                                    {query.length === 0 && FEATURED_TOKENS.map((token: any) => (
                                        <button
                                            key={token.id}
                                            className="w-full text-left px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-4 text-slate-900 dark:text-white transition-colors border-b border-slate-100 dark:border-slate-800/50"
                                            onClick={() => handleSelect({
                                                id: token.address, // Ensure address is used for Zora coins
                                                symbol: token.symbol,
                                                name: token.name,
                                                image: token.image,
                                                current_price: token.current_price
                                            })}
                                        >
                                            <div className="relative">
                                                <TokenImage token={token} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-base">{token.name}</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{token.symbol.toUpperCase()}</span>
                                            </div>
                                            <div className="ml-auto">
                                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-full font-bold">
                                                    Recommended
                                                </span>
                                            </div>
                                        </button>
                                    ))}

                                    {/* Zora Search Result (New) */}
                                    {zoraResult && (
                                        <div className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/30 flex items-center gap-2">
                                            <span>Zora Metadata</span>
                                        </div>
                                    )}
                                    {zoraResult && (
                                        <button
                                            className="w-full text-left px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-4 text-slate-900 dark:text-white transition-colors border-b border-slate-100 dark:border-slate-800/50 bg-blue-50/50 dark:bg-blue-900/10"
                                            onClick={() => handleSelect({
                                                id: zoraResult.address,
                                                symbol: zoraResult.symbol,
                                                name: zoraResult.name,
                                                image: zoraResult.mediaContent?.previewImage,
                                                current_price: parseFloat(zoraResult.tokenPrice?.priceInUsdc || '0')
                                            })}
                                        >
                                            <div className="relative">
                                                <TokenImage
                                                    token={{
                                                        symbol: zoraResult.symbol,
                                                        mediaContent: zoraResult.mediaContent
                                                    }}
                                                />
                                                <div className="absolute -bottom-1 -right-1 bg-blue-600 text-[10px] text-white px-1 rounded-full border border-blue-400 shadow-sm">
                                                    Zora
                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-base">{zoraResult.symbol?.toUpperCase()}</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">{zoraResult.name}</span>
                                            </div>
                                            <div className="ml-auto flex flex-col items-end">
                                                <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                                                    {zoraResult.tokenPrice?.priceInUsdc ?
                                                        new Intl.NumberFormat('en-US', {
                                                            style: 'currency',
                                                            currency: 'USD',
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 6
                                                        }).format(parseFloat(zoraResult.tokenPrice.priceInUsdc)) :
                                                        '$0.00'
                                                    }
                                                </span>
                                                <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-700/50 mt-1">MATCH</span>
                                            </div>
                                        </button>
                                    )}

                                    {query.length > 0 && !zoraResult && !isSearchingZora && (
                                        <div className="p-8 text-center flex flex-col items-center justify-center gap-4 text-slate-500">
                                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-2">
                                                <Search className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-slate-900 dark:text-white">No Zora Coin Found</span>
                                                <span className="text-xs max-w-[200px] mx-auto opacity-70">We couldn't find any Zora metadata for this address on Base.</span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {activeTab === 'custom' && (
                                <div className="p-6 flex flex-col gap-6 bg-slate-50 dark:bg-slate-800/20">
                                    <div className="flex flex-col gap-3">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Quick Presets</label>
                                        <div className="flex flex-wrap gap-2">
                                            {[1000000, 10000000, 100000000, 250000000, 1000000000].map((val) => (
                                                <button
                                                    key={val}
                                                    onClick={() => {
                                                        const formatted = new Intl.NumberFormat('en-US').format(val);
                                                        setCustomMarketCap(formatted);
                                                    }}
                                                    className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white dark:hover:text-white text-slate-600 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-800 transition-all shadow-sm"
                                                >
                                                    ${new Intl.NumberFormat('en-US', { notation: 'compact' }).format(val)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Target Market Cap (USD)</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 border border-slate-200 dark:border-slate-800 placeholder-slate-400 dark:placeholder-slate-600 text-2xl font-mono transition-all"
                                                placeholder="e.g. 1,000,000"
                                                value={customMarketCap}
                                                onChange={(e) => {
                                                    // Only allow numbers and decimal point
                                                    const rawValue = e.target.value.replace(/[^0-9.]/g, '');
                                                    if (rawValue === '') {
                                                        setCustomMarketCap('');
                                                        return;
                                                    }

                                                    const parts = rawValue.split('.');
                                                    const integerPart = parts[0];
                                                    const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

                                                    // Format with commas
                                                    const formattedInteger = new Intl.NumberFormat('en-US').format(parseFloat(integerPart) || 0);

                                                    // If the input was just '0', Intl.NumberFormat might return '0'. 
                                                    // But we want to preserve empty if it was literally filtered out.
                                                    setCustomMarketCap(formattedInteger + decimalPart);
                                                }}
                                            />
                                        </div>
                                        {customMarketCap && !isNaN(parseFloat(customMarketCap.replace(/,/g, ''))) && (
                                            <div className="text-xs text-blue-500 font-bold ml-1">
                                                Selected: ${new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 2 }).format(parseFloat(customMarketCap.replace(/,/g, '')))}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleSelectCustom}
                                        disabled={!customMarketCap}
                                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 mt-2"
                                    >
                                        Use Custom Market Cap
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
