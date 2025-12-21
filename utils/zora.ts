import { getCoin, getProfileCoins, getProfile, getCoinsMostValuable, getCoinsNew, getMostValuableCreatorCoins, tradeCoin, getCoinsTopVolume24h, setApiKey } from "@zoralabs/coins-sdk";
import { base } from "viem/chains";

// Set up Zora API Key if available
if (process.env.NEXT_PUBLIC_ZORA_API_KEY) {
    setApiKey(process.env.NEXT_PUBLIC_ZORA_API_KEY);
}

// Tool: fetchZoraGlobalLeaderboard
// Purpose: Fetch global leaderboard data (using getMostValuableCreatorCoins as getFeaturedCreators is not available)
export async function fetchZoraGlobalLeaderboard(count: number = 10) {
    try {
        const response = await getMostValuableCreatorCoins({
            count
        });

        // console.log("Zora Leaderboard (Most Valuable):", response);

        const nodes = (response as any).data?.zora20Tokens?.nodes;

        if (!nodes) {
            console.warn("Zora Leaderboard: No nodes found", response);
            return [];
        }

        return nodes;
    } catch (error) {
        console.error("Error fetching Zora leaderboard:", error);
        return [];
    }
}

// Tool: tradeCreatorCoin
// Purpose: Execute a buy transaction for a Zora Creator Coin
export async function tradeCreatorCoin(
    tokenAddress: string,
    amountEth: string,
    walletClient: any,
    publicClient: any,
    minAmountOut?: string
) {
    try {
        if (!walletClient || !publicClient) throw new Error("Wallet or Public client missing");
        const account = walletClient.account.address;

        // Zora SDK tradeCoin expects tradeParameters wrappers
        const result = await tradeCoin({
            publicClient,
            walletClient,
            account,
            tradeParameters: {
                sell: {
                    type: "eth",
                },
                buy: {
                    type: "erc20",
                    address: tokenAddress as `0x${string}`,
                },
                amountIn: BigInt(Math.floor(parseFloat(amountEth) * 1e18)),
                sender: account,
            }
        });

        return result;
    } catch (error) {
        console.error("Error trading creator coin:", error);
        throw error;
    }
}

// Tool: fetchCoinMetadata
// Purpose: Retrieving name, symbol, and images for a token address on Base.
export async function fetchCoinMetadata(coinAddress: string) {
    try {
        // Fetch coin data specifically for Base network (Chain ID 8453)
        const response = await getCoin({
            address: coinAddress,
            chain: base.id,
        });

        // Check if data exists
        const tokenData = response.data?.zora20Token;
        // console.log(`[Zora Debug] Metadata for ${coinAddress}:`, tokenData); // Clean up debug log

        if (!tokenData) {
            // console.warn(`No metadata found for ${coinAddress}`);
            return null;
        }

        // Strict Check: Ensure it is a Creator Token (prevents Standard tokens from triggering Zora UI)
        if ((tokenData as any).__typename !== 'GraphQLZora20CreatorToken') {
            return null;
        }

        // Return the raw data object to be used in the UI
        return tokenData;

    } catch (error) {
        console.error("Error fetching Zora metadata:", error);
        return null;
    }
}

// Tool: fetchProfileCoins
// Purpose: Retrieving coins associated with a profile identifier (name or address).
export async function fetchProfileCoins(identifier: string) {
    try {
        const response = await getProfileCoins({
            identifier,
        });

        const coins = (response as any).data?.profileCoins?.nodes;

        if (!coins || coins.length === 0) {
            console.warn(`No coins found for profile ${identifier}`);
            return null;
        }

        // Return the first coin from the profile
        return coins[0].zora20Token;

    } catch (error) {
        console.error("Error fetching Zora profile coins:", error);
        return null;
    }
}

// Tool: fetchProfileMetadata
// Purpose: Retrieving a profile by identifier (handle or address).
export async function fetchProfileMetadata(identifier: string) {
    try {
        const response = await getProfile({
            identifier,
        });

        const profileData = response.data?.profile;

        if (!profileData) {
            console.warn(`No profile found for ${identifier}`);
            return null;
        }

        return profileData;

    } catch (error) {
        console.error("Error fetching Zora profile:", error);
        return null;
    }
}

// Tool: searchCoinsByName
// Purpose: Searching for coins that match a specific name or symbol.
export async function searchCoinsByName(query: string) {
    try {
        const lowerQuery = query.toLowerCase();

        // 1. Check for a single direct handle match as the first entry
        const directCoin = await fetchProfileCoins(query);
        const directMatchAddr = directCoin?.address?.toLowerCase();

        // 2. Fetch a broad list of most valuable coins to find name/symbol matches
        const response = await getCoinsMostValuable({
            count: 100 // Increased count for better discovery
        });

        const nodes = (response as any).data?.zora20Tokens?.nodes;
        if (!nodes) return directCoin ? [directCoin] : [];

        // Filter for name or symbol matches
        const matches = nodes.filter((node: any) =>
            (node.name?.toLowerCase().includes(lowerQuery) ||
                node.symbol?.toLowerCase().includes(lowerQuery)) &&
            node.address?.toLowerCase() !== directMatchAddr // Prevent duplicates
        );

        // Return combined list: direct match followed by name matches
        const results = directCoin ? [directCoin, ...matches] : matches;
        return results.slice(0, 5); // Limit to top 5 suggestions

    } catch (error) {
        console.error("Error searching coins by name:", error);
        return [];
    }
}
// Tool: fetchDiscoveryList
// Purpose: Gathering a broad set of active coins for local search suggestions.
export async function fetchDiscoveryList() {
    try {
        // Fetch from multiple sources for better coverage
        const [mostValuable, newest, creatorCoins] = await Promise.all([
            getCoinsMostValuable({ count: 50 }),
            getCoinsNew({ count: 50 }),
            getMostValuableCreatorCoins({ count: 50 })
        ]);

        const extractNodes = (res: any) => res?.data?.exploreList?.edges?.map((e: any) => e.node) || [];

        const allNodes = [
            ...extractNodes(mostValuable),
            ...extractNodes(newest),
            ...extractNodes(creatorCoins)
        ];

        // De-duplicate by address
        const seen = new Set();
        const uniqueNodes = allNodes.filter(node => {
            if (!node || seen.has(node.address)) return false;
            seen.add(node.address);
            return true;
        });

        return uniqueNodes;

    } catch (error) {
        console.error("Error fetching discovery list:", error);
        return [];
    }
}
