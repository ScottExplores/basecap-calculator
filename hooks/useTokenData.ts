import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { fetchCreatorCoin } from '../lib/fetchCreatorCoin';
import { fetchCoinMetadata, fetchZoraGlobalLeaderboard } from '../utils/zora';

export interface TokenData {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    market_cap: number;
    market_cap_rank: number;
    price_change_percentage_24h: number;
    ath: number;
    address?: string;
    decimals?: number;
    creator_name?: string;
    creator_avatar?: string;
}

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Search Hook
export function useSearchTokens(query: string) {
    return useQuery({
        queryKey: ['search', query],
        queryFn: async () => {
            if (!query || query.length < 2) return [];

            // 1. Search for IDs first
            const searchResponse = await axios.get('/api/tokens', {
                params: {
                    type: 'search',
                    query
                }
            });

            const coins = searchResponse.data.coins || [];
            if (coins.length === 0) return [];

            // 2. Get top 6 IDs to fetch rich market data
            // We take a few more than 5 just in case some don't have market data
            const topIds = coins.slice(0, 6).map((c: any) => c.id).join(',');

            // 3. Fetch Market Data for these IDs via our proxy
            try {
                const marketsResponse = await axios.get('/api/tokens', {
                    params: {
                        type: 'markets',
                        ids: topIds,
                        per_page: 6
                    }
                });

                // Map back to our TokenData fields
                // Note: The markets endpoint returns full data (current_price, market_cap, etc.)
                return marketsResponse.data.map((m: any) => ({
                    id: m.id,
                    symbol: m.symbol,
                    name: m.name,
                    image: m.image,
                    current_price: m.current_price,
                    market_cap: m.market_cap,
                    market_cap_rank: m.market_cap_rank,
                    price_change_percentage_24h: m.price_change_percentage_24h,
                    address: m.id // Fallback address as ID for general coins
                }));

            } catch (error) {
                console.warn("Failed to fetch rich market data for search, falling back to basic search results", error);
                // Fallback: Return basic search results if markets fetch fails
                return coins.slice(0, 5).map((c: any) => ({
                    id: c.id,
                    symbol: c.symbol,
                    name: c.name,
                    image: c.large || c.thumb,
                    current_price: 0, // Missing in basic search
                    market_cap: 0,    // Missing in basic search
                    market_cap_rank: c.market_cap_rank,
                    price_change_percentage_24h: 0,
                    address: c.id
                }));
            }
        },
        enabled: query.length >= 2,
        staleTime: 300000, // 5 minutes
    });
}

// Single Token Data Hook
export function useTokenData(tokenId: string) {
    return useQuery({
        queryKey: ['token', tokenId],
        queryFn: async () => {
            if (!tokenId) return null;

            try {
                // If it's a contract address, try Zora first (high quality for Base)
                if (tokenId.startsWith('0x') && tokenId.length === 42) {
                    try {
                        const zoraData = await fetchCoinMetadata(tokenId);
                        if (zoraData) {
                            return {
                                id: tokenId,
                                symbol: zoraData.symbol,
                                name: zoraData.name,
                                image: typeof zoraData.mediaContent?.previewImage === 'string'
                                    ? zoraData.mediaContent.previewImage
                                    : ((zoraData.mediaContent?.previewImage as any)?.url || (zoraData.mediaContent?.previewImage as any)?.medium || (zoraData.mediaContent?.previewImage as any)?.large || ''),
                                current_price: parseFloat(zoraData.tokenPrice?.priceInUsdc || '0'),
                                market_cap: parseFloat(zoraData.marketCap || '0'),
                                ath: 0,
                                market_cap_rank: 0,
                                price_change_percentage_24h: 0,
                                address: tokenId,
                                decimals: 18 // Default for Zora20
                            } as TokenData;
                        }
                    } catch (e) {
                        console.warn("Zora lookup failed for tokenId", tokenId, e);
                    }
                }

                // Check for ENS OR Creator Coin logic
                if (tokenId.startsWith('0x') || tokenId.toLowerCase().endsWith('.eth')) {
                    const creatorData = await fetchCreatorCoin(tokenId);

                    if ('token' in creatorData) {
                        const { token } = creatorData;
                        return {
                            id: token.address,
                            symbol: token.symbol,
                            name: token.name,
                            image: token.image || `https://dd.dexscreener.com/ds-data/tokens/base/${token.address}.png`,
                            current_price: (token.marketCap / parseFloat(token.supply.replace(/,/g, ''))) || 0,
                            market_cap: token.marketCap,
                            ath: 0,
                            market_cap_rank: 0,
                            address: token.address,
                            decimals: token.decimals,
                            price_change_percentage_24h: 0,
                            creator_name: token.creator.name,
                            creator_avatar: token.creator.avatar
                        } as TokenData;
                    }
                }

                // If ID looks like a contract address but Creator Fetch failed, fetch by contract via CG (standard fallback)
                if (tokenId.startsWith('0x')) {
                    try {
                        const response = await axios.get(`${COINGECKO_API}/coins/base/contract/${tokenId}`);
                        const data = response.data;
                        return {
                            id: data.id,
                            symbol: data.symbol,
                            name: data.name,
                            image: data.image?.large || data.image?.thumb || '',
                            current_price: data.market_data?.current_price?.usd || 0,
                            market_cap: data.market_data?.market_cap?.usd || 0,
                            ath: data.market_data?.ath?.usd || 0,
                            market_cap_rank: data.market_cap_rank,
                            address: tokenId
                        } as TokenData;
                    } catch (e) {
                        // Fallback to DexScreener immediately if CoinGecko fails (common for new Creator Coins)
                        throw new Error("CoinGecko Contract Fetch Failed");
                    }
                }

                // Regular ID fetch... (unchanged logic below for non-0x ids)

                // Otherwise fetch by CoinGecko ID (Detailed fetch to get Contract Address)
                // We need the specific platform address for Base to allow Swaps/Balance checks.
                try {
                    const response = await axios.get(`${COINGECKO_API}/coins/${tokenId}`, {
                        params: {
                            localization: false,
                            tickers: false,
                            market_data: true,
                            community_data: false,
                            developer_data: false,
                            sparkline: false
                        },
                    });

                    const data = response.data;
                    // Try to find Base address. Fallback to 'base' key or 'base-network' etc if CG changes keys, but usually 'base'.
                    const platforms = data.platforms || {};
                    const baseAddress = platforms['base'];

                    // If no Base address found, we can still return the data for visualization, but address will be missing (disabling swap)
                    // We'll map what we have.
                    return {
                        id: data.id,
                        symbol: data.symbol,
                        name: data.name,
                        image: data.image?.large || data.image?.thumb || '',
                        current_price: data.market_data?.current_price?.usd || 0,
                        market_cap: data.market_data?.market_cap?.usd || 0,
                        ath: data.market_data?.ath?.usd || 0,
                        market_cap_rank: data.market_cap_rank,
                        address: baseAddress || '', // Empty if not on Base
                        decimals: data.detail_platforms?.base?.decimal_place || 18,
                    } as TokenData;

                } catch (cgError) {
                    // If detailed fetch fails, maybe it wasn't a valid ID?
                    throw cgError;
                }
            } catch (error) {
                // Global Fallback for ANY failure (including the forced throw from above)
                // Try DexScreener if it looks like an address or even a symbol (though symbol search is harder via direct endpoint)
                if (tokenId.startsWith('0x')) {
                    try {
                        const dsRes = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenId}`);
                        const pair = dsRes.data?.pairs?.[0];
                        if (pair) {
                            return {
                                id: pair.baseToken.address,
                                symbol: pair.baseToken.symbol,
                                name: pair.baseToken.name,
                                image: pair.info?.imageUrl || `https://dd.dexscreener.com/ds-data/tokens/base/${tokenId}.png`,
                                current_price: parseFloat(pair.priceUsd),
                                market_cap: pair.fdv || pair.marketCap || 0,
                                ath: 0,
                                market_cap_rank: 0,
                                address: tokenId
                            } as TokenData;
                        }
                    } catch (dsErr) {
                        console.error("Final DexScreener fallback failed:", dsErr);
                    }
                }

                console.error("Error fetching token data:", error);
                return null;
            }
        },
        enabled: !!tokenId,
        staleTime: 60000,
    });
}

// Contract Hook
export function useTokenContract(contractAddress: string, platformId: string = 'base') {
    return useQuery({
        queryKey: ['contract', platformId, contractAddress],
        queryFn: async () => {
            if (!contractAddress || contractAddress.length < 10) return null;

            // Priority 1: Fetch using Zora SDK
            try {
                const zoraData = await fetchCoinMetadata(contractAddress);
                if (zoraData) {
                    return {
                        id: contractAddress,
                        symbol: zoraData.symbol,
                        name: zoraData.name,
                        image: typeof zoraData.mediaContent?.previewImage === 'string'
                            ? zoraData.mediaContent.previewImage
                            : ((zoraData.mediaContent?.previewImage as any)?.url || (zoraData.mediaContent?.previewImage as any)?.medium || (zoraData.mediaContent?.previewImage as any)?.large || ''),
                        current_price: parseFloat(zoraData.tokenPrice?.priceInUsdc || '0'),
                        market_cap: parseFloat(zoraData.marketCap || '0'),
                        ath: 0,
                        market_cap_rank: 0,
                        price_change_percentage_24h: 0,
                        address: contractAddress,
                        decimals: 18
                    } as TokenData;
                }
            } catch (e) { }


            // Priority 2: Fetch using Creator Coin Utility
            try {
                const creatorData = await fetchCreatorCoin(contractAddress);
                if ('token' in creatorData) {
                    const { token } = creatorData;
                    return {
                        id: token.address,
                        symbol: token.symbol,
                        name: token.name,
                        image: token.image || `https://dd.dexscreener.com/ds-data/tokens/base/${token.address}.png`,
                        current_price: (token.marketCap / parseFloat(token.supply.replace(/,/g, ''))) || 0,
                        market_cap: token.marketCap,
                        ath: 0,
                        market_cap_rank: 0,
                        address: token.address,
                        price_change_percentage_24h: 0,
                        creator_name: token.creator.name,
                        creator_avatar: token.creator.avatar
                    } as TokenData;
                }
            } catch (e) { }


            try {
                const response = await axios.get(`${COINGECKO_API}/coins/${platformId}/contract/${contractAddress}`);
                const data = response.data;
                return {
                    id: data.id,
                    symbol: data.symbol,
                    name: data.name,
                    image: data.image?.large || data.image?.thumb || '',
                    current_price: data.market_data?.current_price?.usd || 0,
                    market_cap: data.market_data?.market_cap?.usd || 0,
                    ath: data.market_data?.ath?.usd || 0,
                    market_cap_rank: data.market_cap_rank,
                    address: contractAddress
                } as TokenData;
            } catch (error) {
                console.error("Error fetching token from contract:", error);

                // DexScreener Fallback
                try {
                    const dsRes = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`);
                    const pair = dsRes.data?.pairs?.[0];
                    if (pair) {
                        return {
                            id: pair.baseToken.address,
                            symbol: pair.baseToken.symbol,
                            name: pair.baseToken.name,
                            image: pair.info?.imageUrl || '',
                            current_price: parseFloat(pair.priceUsd),
                            market_cap: pair.fdv || pair.marketCap || 0,
                            ath: 0,
                            market_cap_rank: 0,
                            address: contractAddress
                        } as TokenData;
                    }
                } catch (dsError) {
                    console.error("DexScreener fallback failed:", dsError);
                }

                return null;
            }
        },
        enabled: contractAddress.length > 10,
        staleTime: 300000,
    });
}

// Trending Tokens Hook
export function useTrendingTokens() {
    return useQuery({
        queryKey: ['trending-base-50-hybrid'],
        queryFn: async () => {
            try {
                // 1. Fetch Top Base Tokens (Local Proxy)
                const cgResponse = await axios.get('/api/tokens', {
                    params: {
                        type: 'markets',
                        category: 'base-ecosystem',
                        per_page: 50,
                    }
                }).catch(e => ({ data: [] })); // Fail gracefully

                const cgTokens = (cgResponse.data || []).map((t: any) => ({
                    id: t.id,
                    symbol: t.symbol,
                    name: t.name,
                    image: t.image,
                    current_price: t.current_price,
                    market_cap: t.market_cap,
                    market_cap_rank: t.market_cap_rank,
                    price_change_24h: t.price_change_percentage_24h,
                    address: t.id, // Fallback
                    price_change_percentage_24h: t.price_change_percentage_24h // alias
                }));

                const finalList: any[] = [];
                const seenSymbols = new Set<string>();
                const STABLE_AND_WRAPPED = ['usdc', 'usdt', 'dai', 'weth', 'cbeth', 'axlusdc', 'ezeth', 'aeth', 'wbtc', 'eurc'];

                for (const t of cgTokens) {
                    if (finalList.length >= 50) break;
                    if (!seenSymbols.has(t.symbol.toLowerCase()) && !STABLE_AND_WRAPPED.includes(t.symbol.toLowerCase())) {
                        finalList.push(t);
                        seenSymbols.add(t.symbol.toLowerCase());
                    }
                }

                return finalList;
            } catch (e) {
                console.error("Error fetching trending:", e);
                return [];
            }
        },
        staleTime: 60000 * 5, // 5 mins
        placeholderData: (prev) => prev
    });
}

// Hook: useZoraLeaderboard
// Purpose: Fetch Zora Leaderboard data
export function useZoraLeaderboard() {
    return useQuery({
        queryKey: ['zora-leaderboard'],
        queryFn: async () => {
            const nodes = await fetchZoraGlobalLeaderboard(20);
            return nodes.map((n: any) => ({
                id: n.address,
                symbol: n.symbol,
                name: n.name,
                image: typeof n.mediaContent?.previewImage === 'string'
                    ? n.mediaContent.previewImage
                    : ((n.mediaContent?.previewImage as any)?.url || ''),
                current_price: parseFloat(n.tokenPrice?.priceInUsdc || '0'),
                market_cap: parseFloat(n.marketCap || '0'),
                price_change_24h: 0
            }));
        },
        staleTime: 60000
    });
}
