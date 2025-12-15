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
}

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export function useTokenData(tokenId: string) {
    return useQuery({
        queryKey: ['token', tokenId],
        queryFn: async () => {
            if (!tokenId) return null;
            try {
                const response = await axios.get(`${COINGECKO_API}/coins/markets`, {
                    params: {
                        vs_currency: 'usd',
                        ids: tokenId,
                    },
                });
                if (response.data && response.data.length > 0) {
                    return response.data[0] as TokenData;
                }
                return null; // Token not found or error
            } catch (error) {
                console.error("Error fetching token data:", error);
                return null;
            }
        },
        enabled: !!tokenId,
        staleTime: 60000, // 1 minute cache
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

export function useTokenContract(contractAddress: string, platformId: string = 'ethereum') {
    return useQuery({
        queryKey: ['contract', platformId, contractAddress],
        queryFn: async () => {
            if (!contractAddress || contractAddress.length < 10) return null;
            try {
                const response = await axios.get(`${COINGECKO_API}/coins/${platformId}/contract/${contractAddress}`);
                return response.data as TokenData;
            } catch (error) {
                console.error("Error fetching token from contract:", error);
                return null;
            }
        },
        enabled: contractAddress.length > 10,
        staleTime: 300000,
    });
}
