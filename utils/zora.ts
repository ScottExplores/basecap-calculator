import { getCoin } from "@zoralabs/coins-sdk";
import { base } from "viem/chains";

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

        if (!tokenData) {
            console.warn(`No metadata found for ${coinAddress}`);
            return null;
        }

        // Return the raw data object to be used in the UI
        return tokenData;

    } catch (error) {
        console.error("Error fetching Zora metadata:", error);
        return null;
    }
}
