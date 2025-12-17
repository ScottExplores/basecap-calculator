import { useAccount } from 'wagmi';
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

    const { data: walletTokens, isLoading } = useQuery({
        queryKey: ['wallet-tokens-hybrid', address],
        queryFn: async () => {
            if (!address) return [];

            let initialTokens: WalletToken[] = [];
            let source = 'onchainkit';

            try {
                // 1. Try OnchainKit First (Official Data)
                console.log("Fetching OnchainKit Portfolios...");
                const portfolios = await getPortfolios({
                    addresses: [address],
                });

                const portfolio = (portfolios as any).portfolios?.[0];
                if (portfolio && portfolio.tokenBalances) {
                    initialTokens = portfolio.tokenBalances.map((tb: any) => ({
                        id: tb.token.address,
                        symbol: tb.token.symbol,
                        name: tb.token.name,
                        address: tb.token.address,
                        decimals: tb.token.decimals,
                        image: tb.token.image || '',
                        balance: formatUnits(BigInt(tb.balance), tb.token.decimals),
                        balanceRaw: BigInt(tb.balance)
                    })).filter((t: any) => t.balanceRaw > BigInt(0));
                }

                if (initialTokens.length === 0) {
                    throw new Error("No tokens found in OnchainKit, trying fallback");
                }

            } catch (error) {
                console.warn("OnchainKit fetch failed/empty, falling back to Blockscout:", error);
                source = 'blockscout';

                // 2. Fallback to Blockscout if OnchainKit fails
                try {
                    const response = await axios.get(`https://base.blockscout.com/api?module=account&action=tokenlist&address=${address}`);
                    const result = response.data.result;

                    if (Array.isArray(result)) {
                        initialTokens = result.map((t: any) => {
                            const decimal = Number(t.decimals);
                            const raw = BigInt(t.balance);
                            return {
                                id: t.contractAddress,
                                symbol: t.symbol,
                                name: t.name,
                                address: t.contractAddress,
                                decimals: decimal,
                                image: t.logoURI || `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/${t.contractAddress}/logo.png`,
                                balance: formatUnits(raw, decimal),
                                balanceRaw: raw
                            };
                        }).filter(t => t.balanceRaw > BigInt(0));
                    }
                } catch (bsError) {
                    console.error("Blockscout fallback also failed:", bsError);
                    return []; // Both failed
                }
            }

            // 3. Shared Price Fetching (DexScreener)
            // This runs regardless of where we got the tokens
            try {
                const addresses = initialTokens.map(t => t.address).filter(Boolean);
                if (addresses.length === 0) return initialTokens;

                const chunkSize = 30;
                const priceMap = new Map<string, number>();
                const imageMap = new Map<string, string>(); // Use DexScreener images if better

                for (let i = 0; i < addresses.length; i += chunkSize) {
                    const chunk = addresses.slice(i, i + chunkSize);
                    const url = `https://api.dexscreener.com/latest/dex/tokens/${chunk.join(',')}`;
                    const dsRes = await axios.get(url);
                    if (dsRes.data.pairs) {
                        dsRes.data.pairs.forEach((pair: any) => {
                            if (pair.baseToken && pair.priceUsd) {
                                const addr = pair.baseToken.address.toLowerCase();
                                if (!priceMap.has(addr)) {
                                    priceMap.set(addr, parseFloat(pair.priceUsd));
                                }
                                if (!imageMap.has(addr) && pair.info?.imageUrl) {
                                    imageMap.set(addr, pair.info.imageUrl);
                                }
                            }
                        });
                    }
                }

                // 4. Assign Values and Sort
                const withValues = initialTokens.map(t => {
                    const addrInfo = t.address?.toLowerCase() || '';
                    const price = priceMap.get(addrInfo) || 0;
                    const dsImage = imageMap.get(addrInfo);

                    // If source was Blockscout (often 404 images), prefer DexScreener Image
                    // If source was OnchainKit, its images are usually good, but dsImage is verified recently traded
                    const finalImage = dsImage || t.image || `https://dd.dexscreener.com/ds-data/tokens/base/${t.address}.png`;

                    return {
                        ...t,
                        valueUsd: parseFloat(t.balance) * price,
                        image: finalImage
                    };
                });

                return withValues.sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0));

            } catch (priceErr) {
                console.error("Pricing fetch failed, returning unsorted list", priceErr);
                return initialTokens;
            }
        },
        enabled: isConnected && !!address,
        staleTime: 30000,
    });

    return {
        tokens: walletTokens || [],
        isLoading: isLoading && isConnected
    };
}
