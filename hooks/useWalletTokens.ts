import { useAccount, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { BaseToken } from '@/constants/baseTokens';

export interface WalletToken extends BaseToken {
    balance: string;
    balanceRaw: bigint;
    image?: string; // Enhanced with TrustWallet/CoinGecko fallback
    valueUsd?: number;
}

export function useWalletTokens() {
    const { address, isConnected } = useAccount();

    const { data: walletTokens, isLoading } = useQuery({
        queryKey: ['wallet-tokens', address],
        queryFn: async () => {
            if (!address) return [];

            // 1. Fetch from Blockscout
            const response = await axios.get(`https://base.blockscout.com/api?module=account&action=tokenlist&address=${address}`);
            const result = response.data.result;

            if (!Array.isArray(result)) return [];

            // 2. Map to WalletToken format
            const mappedTokens = result.map((t: any) => ({
                id: t.contractAddress,
                symbol: t.symbol,
                name: t.name,
                address: t.contractAddress,
                decimals: Number(t.decimals),
                // Fallback to TrustWallet assets or generic placeholder if Blockscout data missing
                image: t.logoURI || `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/${t.contractAddress}/logo.png`,
                logoURI: t.logoURI,
                balance: formatUnits(BigInt(t.balance), Number(t.decimals)),
                balanceRaw: BigInt(t.balance)
            })).filter(t => t.balanceRaw > BigInt(0));

            // 3. Fetch Prices from DexScreener for sorting
            try {
                // Batch requests in chunks of 30 due to URL length limits/API best practices
                const tokens = mappedTokens as WalletToken[];
                const addresses = tokens.map(t => t.address).filter(Boolean);
                const chunkSize = 30;
                const priceMap = new Map<string, number>();
                const imageMap = new Map<string, string>();

                for (let i = 0; i < addresses.length; i += chunkSize) {
                    const chunk = addresses.slice(i, i + chunkSize);
                    const url = `https://api.dexscreener.com/latest/dex/tokens/${chunk.join(',')}`;
                    const dsRes = await axios.get(url);
                    if (dsRes.data.pairs) {
                        dsRes.data.pairs.forEach((pair: any) => {
                            if (pair.baseToken && pair.priceUsd) {
                                const addr = pair.baseToken.address.toLowerCase();
                                // Store price and image if not already set
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

                // 4. Assign Values, Images and Sort
                const withValues = tokens.map(t => {
                    const price = priceMap.get(t.address?.toLowerCase() || '') || 0;
                    const dsImage = imageMap.get(t.address?.toLowerCase() || '');

                    // Prefer DexScreener image if Blockscout/TrustWallet failed or we just want better coverage
                    // logic: if existing image is the fallback trustwallet one (which might be 404), prefer DS
                    const isTrustWallet = t.image && t.image.includes('trustwallet');
                    const finalImage = (dsImage) ? dsImage : (t.image || '');

                    return {
                        ...t,
                        valueUsd: parseFloat(t.balance) * price,
                        image: finalImage || t.image // update image
                    };
                });

                return withValues.sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0));

            } catch (err) {
                console.error("Error fetching token prices:", err);
                return mappedTokens; // Return unsorted/unpriced on error
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
