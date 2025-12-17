import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { TokenData } from './useTokenData';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export function useTopTokens() {
    return useQuery({
        queryKey: ['topTokens'],
        queryFn: async () => {
            try {
                const response = await axios.get(`${COINGECKO_API}/coins/markets`, {
                    params: {
                        vs_currency: 'usd',
                        order: 'market_cap_desc',
                        per_page: 100,
                        page: 1,
                        sparkline: false,
                    },
                });
                const stablecoins = ['usdc', 'usdt', 'dai', 'tusd', 'fdusd'];
                return (response.data as any[]).filter(t => !stablecoins.includes(t.symbol.toLowerCase())).map(t => ({
                    ...t,
                    price_change_percentage_24h: t.price_change_percentage_24h
                } as TokenData));
            } catch (error) {
                console.error("Error fetching top tokens:", error);
                return [];
            }
        },
        staleTime: 300000,
        placeholderData: (prev) => prev,
    });
}
