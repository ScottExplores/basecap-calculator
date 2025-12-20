import { useAccount, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { getPortfolios } from '@coinbase/onchainkit/api';
import { BaseToken } from '@/constants/baseTokens';

export interface WalletToken extends BaseToken {
    balance: string;
    balanceRaw: bigint;
    image?: string;
    valueUsd?: number;
}

export function useWalletTokens() {
    const { address, isConnected } = useAccount();

    // Always fetch native ETH balance as a baseline
    const { data: ethBalance } = useBalance({
        address,
    });

    const { data: walletTokens, isLoading } = useQuery({
        queryKey: ['wallet-tokens-hybrid-v3', address, ethBalance?.value?.toString()],
        queryFn: async () => {
            if (!address) return [];

            const initialTokens: WalletToken[] = [];

            // 1. Add Native ETH
            if (ethBalance && ethBalance.value > BigInt(0)) {
                initialTokens.push({
                    id: 'ethereum',
                    symbol: 'ETH',
                    name: 'Ethereum',
                    address: '0x0000000000000000000000000000000000000000',
                    decimals: 18,
                    image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
                    balance: ethBalance.formatted,
                    balanceRaw: ethBalance.value
                });
            }

            // 2. Try OnchainKit
            try {
                const portfolios = await getPortfolios({ addresses: [address] });
                const portfolio = (portfolios as any).portfolios?.[0];
                if (portfolio?.tokenBalances) {
                    portfolio.tokenBalances.forEach((tb: any) => {
                        if (!tb.token || BigInt(tb.balance || '0') === BigInt(0)) return;

                        // Check for existing
                        if (initialTokens.find(t =>
                            (t.symbol === tb.token.symbol) ||
                            (t.address && tb.token.address && t.address.toLowerCase() === tb.token.address.toLowerCase())
                        )) return;

                        initialTokens.push({
                            id: tb.token.address || tb.token.symbol?.toLowerCase() || Math.random().toString(),
                            symbol: tb.token.symbol || '?',
                            name: tb.token.name || 'Unknown',
                            address: tb.token.address,
                            decimals: tb.token.decimals || 18,
                            image: tb.token.image || '',
                            balance: formatUnits(BigInt(tb.balance), tb.token.decimals || 18),
                            balanceRaw: BigInt(tb.balance)
                        });
                    });
                }
            } catch (error) {
                console.warn("OnchainKit portfolios failed:", error);
            }

            // 3. Blockscout V2 Fallback
            try {
                const bsRes = await axios.get(`https://base.blockscout.com/api/v2/addresses/${address}/token-balances`);
                if (Array.isArray(bsRes.data)) {
                    bsRes.data.forEach((item: any) => {
                        const t = item.token;
                        if (!t || BigInt(item.value || '0') === BigInt(0)) return;

                        // Avoid duplicates
                        if (initialTokens.find(existing =>
                            (existing.address && existing.address.toLowerCase() === t.address.toLowerCase()) ||
                            (existing.symbol === t.symbol)
                        )) return;

                        const decimals = Number(t.decimals || 18);
                        initialTokens.push({
                            id: t.address,
                            symbol: t.symbol || '?',
                            name: t.name || 'Unknown',
                            address: t.address,
                            decimals: decimals,
                            image: t.icon_url || `https://dd.dexscreener.com/ds-data/tokens/base/${t.address}.png`,
                            balance: formatUnits(BigInt(item.value), decimals),
                            balanceRaw: BigInt(item.value)
                        });
                    });
                }
            } catch (bsErr) {
                console.error("Blockscout V2 failed:", bsErr);
            }

            // 4. Pricing & Final Polish
            try {
                const priceMap = new Map<string, number>();
                const imageMap = new Map<string, string>();

                // Batch DexScreener Check
                const addresses = initialTokens.filter(t => t.address && t.address !== '0x0000000000000000000000000000000000000000').map(t => t.address);

                // Add ETH price specifically (WETH on Base)
                const ethLookupAddr = '0x4200000000000000000000000000000000000006';
                if (!addresses.includes(ethLookupAddr)) addresses.push(ethLookupAddr);

                if (addresses.length > 0) {
                    const chunkSize = 30;
                    for (let i = 0; i < addresses.length; i += chunkSize) {
                        const chunk = addresses.slice(i, i + chunkSize);
                        try {
                            const dsRes = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${chunk.join(',')}`);
                            dsRes.data.pairs?.forEach((p: any) => {
                                if (p.baseToken?.address && p.priceUsd) {
                                    const addr = p.baseToken.address.toLowerCase();
                                    if (!priceMap.has(addr)) priceMap.set(addr, parseFloat(p.priceUsd));
                                    if (p.info?.imageUrl) imageMap.set(addr, p.info.imageUrl);

                                    if (addr === ethLookupAddr.toLowerCase()) {
                                        priceMap.set('ethereum', parseFloat(p.priceUsd));
                                    }
                                }
                            });
                        } catch (e) { }
                    }
                }

                const finalTokens = initialTokens.map(t => {
                    const key = t.id === 'ethereum' ? 'ethereum' : t.address?.toLowerCase() || '';
                    const price = priceMap.get(key) || 0;
                    const val = parseFloat(t.balance) * price;
                    return {
                        ...t,
                        valueUsd: isNaN(val) ? 0 : val,
                        image: imageMap.get(key) || t.image
                    };
                });

                return finalTokens.sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0));

            } catch (err) {
                console.error("Pricing/Polish failed:", err);
                return initialTokens;
            }
        },
        enabled: isConnected && !!address,
        staleTime: 45000,
    });

    return {
        tokens: walletTokens || [],
        isLoading: isLoading && isConnected
    };
}

