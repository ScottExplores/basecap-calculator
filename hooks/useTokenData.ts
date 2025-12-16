import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface TokenData {
    id: string;
    symbol: string;
    name: string;
    image: string | { large: string; thumb: string; small: string };
    current_price: number;
    market_cap: number;
    ath: number;
    market_cap_rank: number;
    address?: string; // Optional contract address
}

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export function useTokenData(tokenId: string) {
    return useQuery({
        queryKey: ['token', tokenId],
        queryFn: async () => {
            if (!tokenId) return null;

            try {
                // If ID looks like a contract address, fetch by contract
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
                        // Fallback to DexScreener for low-cap tokens
                        console.log("CoinGecko failed, trying DexScreener for", tokenId);
                        const dsRes = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenId}`);
                        const pair = dsRes.data?.pairs?.[0]; // Use most liquid pair
                        if (pair) {
                            return {
                                id: pair.baseToken.address,
                                symbol: pair.baseToken.symbol,
                                name: pair.baseToken.name,
                                image: pair.info?.imageUrl || `https://dd.dexscreener.com/ds-data/tokens/base/${tokenId}.png`, // Try constructing image URL or fallback
                                current_price: parseFloat(pair.priceUsd),
                                market_cap: pair.fdv || pair.marketCap || 0,
                                ath: 0, // Not available
                                market_cap_rank: 0, // Not available
                                address: tokenId
                            } as TokenData;
                        }
                        return null;
                    }
                }

                // Otherwise fetch by CoinGecko ID
                const response = await axios.get(`${COINGECKO_API}/coins/markets`, {
                    params: {
                        vs_currency: 'usd',
                        ids: tokenId,
                    },
                });
                if (response.data && response.data.length > 0) {
                    return response.data[0] as TokenData;
                }
                return null;
            } catch (error) {
                console.error("Error fetching token data:", error);
                return null;
            }
        },
        enabled: !!tokenId,
        staleTime: 60000,
    });
}

export function useSearchTokens(query: string) {
    return useQuery({
        queryKey: ['search', query],
        queryFn: async () => {
            if (!query || query.length < 2) return [];
            const response = await axios.get(`${COINGECKO_API}/search`, {
                params: { query }
            });
            // CoinGecko search returns a 'coins' array with partial data. 
            // We might need to fetch full market data if selected, but this is enough for the dropdown.
            return response.data.coins.slice(0, 5);
        },
        enabled: query.length >= 2,
        staleTime: 300000, // 5 minutes
    });
}

export function useTokenContract(contractAddress: string, platformId: string = 'base') {
    return useQuery({
        queryKey: ['contract', platformId, contractAddress],
        queryFn: async () => {
            if (!contractAddress || contractAddress.length < 10) return null;
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
