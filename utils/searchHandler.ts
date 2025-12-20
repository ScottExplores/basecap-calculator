import { fetchCoinMetadata, fetchProfileMetadata, searchCoinsByName, fetchDiscoveryList } from './zora';

// Cache for the discovery list to prevent excessive API calls
let discoveryListCache: any[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute

/**
 * Handler for coin search functionality.
 */
export async function handleCoinSearch(userInput: string) {
    if (!userInput) return null;

    const cleanInput = userInput.trim();

    // 1. Address Match
    if (cleanInput.startsWith('0x') && cleanInput.length === 42) {
        try {
            return await fetchCoinMetadata(cleanInput);
        } catch (error) {
            console.error("Error in handleCoinSearch (address):", error);
            return null;
        }
    }

    // 2. Profile Match
    try {
        const profile = await fetchProfileMetadata(cleanInput);
        const coinAddress = profile?.creatorCoin?.address;

        if (coinAddress) {
            const fullMetadata = await fetchCoinMetadata(coinAddress);
            if (fullMetadata) {
                if (!fullMetadata.mediaContent?.previewImage && profile.avatar) {
                    (fullMetadata as any).mediaContent = {
                        previewImage: profile.avatar
                    };
                }
                return fullMetadata;
            }
            return profile.creatorCoin;
        }
    } catch (error) {
        console.warn("Zora profile lookup failed, falling back to name search", error);
    }

    // 3. Name/Symbol Match Fallback
    try {
        const matches = await searchCoinsByName(cleanInput);
        return matches.length > 0 ? matches[0] : null;
    } catch (error) {
        console.error("Error in handleCoinSearch (name search):", error);
        return null;
    }
}

/**
 * Fetches a list of suggestions as the user types.
 * Uses a discovery-based approach with local filtering.
 */
export async function getSearchSuggestions(userInput: string) {
    if (!userInput || userInput.length < 2) return [];

    const query = userInput.trim().toLowerCase();

    // If it looks like an address, don't show suggestions
    if (query.startsWith('0x') && query.length === 42) return [];

    try {
        // Refresh cache if needed
        const now = Date.now();
        if (!discoveryListCache || now - lastFetchTime > CACHE_DURATION) {
            discoveryListCache = await fetchDiscoveryList();
            lastFetchTime = now;
        }

        // Filter locally: name or symbol starts with the query
        return discoveryListCache.filter((coin: any) =>
            coin.name?.toLowerCase().startsWith(query) ||
            coin.symbol?.toLowerCase().startsWith(query)
        ).slice(0, 5);

    } catch (error) {
        console.error("Error in getSearchSuggestions:", error);
        return [];
    }
}
