import { fetchCoinMetadata } from './zora';

/**
 * Handler for coin search functionality.
 * This function takes the user input (e.g., a contract address) and 
 * fetches the corresponding coin metadata using the Zora SDK.
 */
export async function handleCoinSearch(userInput: string) {
    if (!userInput) return null;

    // Clean the input
    const cleanInput = userInput.trim();

    // If it's a contract address (starts with 0x and length 42)
    if (cleanInput.startsWith('0x') && cleanInput.length === 42) {
        try {
            const coinData = await fetchCoinMetadata(cleanInput);
            return coinData;
        } catch (error) {
            console.error("Error in handleCoinSearch:", error);
            return null;
        }
    }

    // Future: Handle ENS or other search types here if needed
    return null;
}
