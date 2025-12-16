import { useAccount, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { BaseToken } from '@/constants/baseTokens';

export interface WalletToken extends BaseToken {
    balance: string;
    balanceRaw: bigint;
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
            return result.map((t: any) => ({
                id: t.contractAddress, // Use contract address as ID for uniqueness vs CoinGecko ID
                symbol: t.symbol,
                name: t.name,
                address: t.contractAddress,
                decimals: Number(t.decimals),
                logoURI: '', // Blockscout doesn't always provide logos, might need fallback or lookup
                balance: formatUnits(BigInt(t.balance), Number(t.decimals)),
                balanceRaw: BigInt(t.balance)
            })).filter(t => t.balanceRaw > BigInt(0));
        },
        enabled: isConnected && !!address,
        staleTime: 30000,
    });

    return {
        tokens: walletTokens || [],
        isLoading: isLoading && isConnected
    };
}
