import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem';
import { base } from 'viem/chains';
import axios from 'axios';
import { fetchCreatorCoin } from '../lib/fetchCreatorCoin';

// Target Wallet (User provided partial, ideally we need full. Using a placeholder or the specific contract if they meant that)
// "0x3a8d...64bf" - I will use a dummy or ask, but for script I'll use process.argv
const TARGET_WALLET = process.argv[2] || '0x3a8d3...'; // Placeholder

// Specific Zora Contract mentioned (Updated to match App Default / Jesse)
const ZORA_CONTRACT = '0x50f88fe97f72cd3e75b9eb4f747f59bceba80d59';

// List of tokens to scan (Top 50 + Specifics)
// In a real "Indexerless" app, we'd use a curated list or user added list.
const TOKENS_TO_SCAN = [
    ZORA_CONTRACT,
    '0x50f88fe97f72cd3e75b9eb4f747f59bceba80d59', // JESSE
    '0x532f27101965dd16442e59d40670faf5ebb142e4', // BRETT
    '0x4ed4e862860bed51a9570b96d89af5e1b0efefed', // DEGEN
    '0xac1bd2486aaf3b5c0fc3fd868558b082a531b2b4', // TOSHI
    '0x27d2decb4bfc9c76f0309b8e88dec3a601fe25a8', // HIGHER
    // ... add more from our top list if needed
];

const client = createPublicClient({
    chain: base,
    transport: http('https://mainnet.base.org')
});

async function main() {
    const wallet = TARGET_WALLET; // In reality verify this
    if (!wallet.startsWith('0x') || wallet.length !== 42) {
        console.error("Please provide a valid full wallet address as argument.");
        // For demo, I will use a known generous wallet or just exit
        // process.exit(1); 
        // I will let it run to show structure
    }

    console.log(`Scanning wallet: ${wallet} for ${TOKENS_TO_SCAN.length} tokens...`);

    // 1. Multicall Balances
    const balanceCalls = TOKENS_TO_SCAN.map(token => ({
        address: token as `0x${string}`,
        abi: [parseAbiItem('function balanceOf(address) view returns (uint256)')],
        functionName: 'balanceOf',
        args: [wallet]
    }));

    const balances = await client.multicall({ contracts: balanceCalls });

    const portfolio = [];

    for (let i = 0; i < TOKENS_TO_SCAN.length; i++) {
        const result = balances[i];
        if (result.status === 'success') {
            const rawBalance = result.result as bigint;
            if (rawBalance > 0n) {
                // Fetch Details
                console.log(`Found balance for ${TOKENS_TO_SCAN[i]}`);
                const details = await fetchCreatorCoin(TOKENS_TO_SCAN[i]);

                if ('token' in details) {
                    const { token } = details;
                    const bal = Number(formatUnits(rawBalance, token.decimals));
                    const price = token.marketCap / parseFloat(token.supply.replace(/,/g, '')); // Derived price

                    portfolio.push({
                        name: token.name,
                        symbol: token.symbol,
                        balance: bal.toFixed(4),
                        usd_value: (bal * price).toFixed(2),
                        image: token.image || token.creator.avatar,
                        creator_ens: token.creator.ens
                    });
                }
            }
        }
    }

    // Output JSON
    console.log(JSON.stringify(portfolio, null, 2));
}

main();
