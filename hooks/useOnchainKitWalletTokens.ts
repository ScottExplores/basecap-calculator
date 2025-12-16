import { useAccount } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { getPortfolios } from '@coinbase/onchainkit/api';
import { formatUnits } from 'viem';

export function useOnchainKitWalletTokens() {
    const { address, isConnected } = useAccount();

    return useQuery({
        queryKey: ['onchainkit-portfolio', address],
        queryFn: async () => {
            if (!address) return [];

            try {
                // Fetch portfolio data from OnchainKit
                const portfolios = await getPortfolios({
                    addresses: [address],
                });

                console.log("OnchainKit Portfolios Raw:", portfolios);

                // The API returns a list of portfolios, we take the first one (for our address)
                const portfolio = (portfolios as any).portfolios?.[0]; // Access nested portfolios array if response wraps it, or cast purely
                if (!portfolio || !portfolio.tokenBalances) {
                    console.warn("No portfolio or tokenBalances found");
                    return [];
                }

                const mapped = portfolio.tokenBalances.map((tb: any) => ({
                    id: tb.token.address,
                    name: tb.token.name,
                    symbol: tb.token.symbol,
                    decimals: tb.token.decimals,
                    image: tb.token.image,
                    balance: formatUnits(BigInt(tb.balance), tb.token.decimals),
                    balanceRaw: BigInt(tb.balance),
                    address: tb.token.address,
                })).filter((t: any) => t.balanceRaw > 0);

                console.log("Mapped Wallet Tokens:", mapped);
                return mapped;

            } catch (error) {
                console.error("Error fetching OnchainKit portfolio:", error);
                return [];
            }
        },
        enabled: isConnected && !!address,
    });
}
