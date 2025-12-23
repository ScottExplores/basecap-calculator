import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem';
import { getAddress } from '@coinbase/onchainkit/identity';
import { base, mainnet } from 'viem/chains';
import { normalize } from 'viem/ens';
import { request, gql } from 'graphql-request';
import axios from 'axios';

// Interfaces
interface CreatorCoinResponse {
    token: {
        name: string;
        symbol: string;
        address: string;
        supply: string;
        decimals: number;
        image: string;
        creator: {
            name: string;
            avatar: string;
            ens: string;
        };
        marketCap: number;
    };
    comparison: {
        vsBitcoin: {
            marketCapRatio: number;
            insights: string;
        };
    };
}

// Clients
const publicClient = createPublicClient({
    chain: base,
    transport: http('https://mainnet.base.org'),
});

const mainnetClient = createPublicClient({
    chain: mainnet,
    transport: http('https://eth.merkle.io'),
});

const ZORA_API = 'https://api.zora.co/graphql';
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Manual Aliases for Creator Coins where Basename points to Wallet, not Token
const CREATOR_ALIASES: Record<string, string> = {
    'scottexplores.base.eth': '0xf5546bf64475b8ece6ac031e92e4f91a88d9dc5e'
};

export async function fetchCreatorCoin(input: string): Promise<CreatorCoinResponse | { error: string }> {
    try {
        let address = input;

        // 0. Check Aliases (Fast Path)
        if (CREATOR_ALIASES[input.toLowerCase()]) {
            address = CREATOR_ALIASES[input.toLowerCase()];
        }
        // 1. Resolve Basename (Base Chain)
        else if (input.toLowerCase().endsWith('.base.eth')) {
            try {
                const resolved = await getAddress({ name: input, chain: base });
                if (resolved) {
                    address = resolved;
                } else {
                    return { error: 'Basename not resolved' };
                }
            } catch (e) {
                console.warn('Basename resolution failed', e);
                // Continue to try other methods or return error?
                // If it ends in .base.eth and failed, it's likely invalid.
                return { error: 'Basename resolution failed' };
            }
        }
        // 2. Resolve ENS (Mainnet) - Fallback for other .eth
        else if (input.toLowerCase().endsWith('.eth')) {
            try {
                const resolved = await mainnetClient.getEnsAddress({ name: normalize(input) });
                if (resolved) {
                    address = resolved;
                } else {
                    return { error: 'ENS name not resolved' };
                }
            } catch (e) {
                console.warn('ENS resolution failed', e);
                return { error: 'ENS resolution failed' };
            }
        }

        // 2. Validate Address
        if (!address.startsWith('0x') || address.length !== 42) {
            return { error: 'Invalid address format' };
        }
        const safeAddress = address as `0x${string}`;

        // 2. Fetch On-Chain Data (Viem)
        let name = '', symbol = '', decimals = 18;
        let totalSupply = BigInt(0), owner = '0x0000000000000000000000000000000000000000';

        try {
            const results = await publicClient.multicall({
                contracts: [
                    { address: safeAddress, abi: [parseAbiItem('function name() view returns (string)')], functionName: 'name' },
                    { address: safeAddress, abi: [parseAbiItem('function symbol() view returns (string)')], functionName: 'symbol' },
                    { address: safeAddress, abi: [parseAbiItem('function decimals() view returns (uint8)')], functionName: 'decimals' },
                    { address: safeAddress, abi: [parseAbiItem('function totalSupply() view returns (uint256)')], functionName: 'totalSupply' },
                    { address: safeAddress, abi: [parseAbiItem('function owner() view returns (address)')], functionName: 'owner' }
                ]
            });

            if (results[0].status === 'success') name = results[0].result as string;
            if (results[1].status === 'success') symbol = results[1].result as string;
            if (results[2].status === 'success') decimals = results[2].result as number;
            if (results[3].status === 'success') totalSupply = results[3].result as bigint;
            if (results[4].status === 'success') owner = (results[4].result as string) || owner;

        } catch (e) {
            console.error('On-chain fetch failed', e);
        }

        if (!symbol) return { error: 'Not a valid ERC-20 on Base' };

        const supplyFormatted = Number(formatUnits(totalSupply, decimals));

        // Zora Creator Coins have a 50% / 50% split (Liquid / Vested).
        // To emphasize potential upside and show accurate "Circulating Market Cap", we use 50% of the total supply.
        const circulatingSupply = supplyFormatted / 2;

        // 3. (Optional) ETH Price - skipping for speed if not needed directly here, but fine to keep if used elsewhere.

        // 4. Fetch Token Price & BTC Price
        let tokenPriceUsd = 0;
        let btcPriceUsd = 0;

        try {
            const [dsRes, cgBtcRes] = await Promise.all([
                axios.get(`https://api.dexscreener.com/latest/dex/tokens/${address}`).catch(() => null),
                axios.get(`${COINGECKO_API}/simple/price?ids=bitcoin&vs_currencies=usd`).catch(() => null)
            ]);

            if (dsRes?.data?.pairs?.[0]) {
                tokenPriceUsd = parseFloat(dsRes.data.pairs[0].priceUsd);
            }

            if (cgBtcRes?.data?.bitcoin?.usd) {
                btcPriceUsd = cgBtcRes.data.bitcoin.usd;
            }

        } catch (e) {
            console.warn('Price fetch failed', e);
        }

        const marketCap = circulatingSupply * tokenPriceUsd;

        // 5. Zora Metadata (Refined Query)
        let zoraData: any = {};
        try {
            // Trying 'tokens' query directly
            const query = gql`
                query TokenMetadata($address: String!) {
                  tokens(networks: [{network: BASE, chain: BASE_MAINNET}], where: {collectionAddresses: [$address]}) {
                    nodes {
                      token {
                        name
                        description
                        image {
                          url
                        }
                        owner
                      }
                    }
                  }
                }
            `;
            const zoraRes: any = await request(ZORA_API, query, { address });
            zoraData = zoraRes?.tokens?.nodes?.[0]?.token || {};
        } catch (e) {
            // Silent fail
        }

        // Use Zora owner if available, else contract owner
        const finalOwner = zoraData.owner || (owner !== '0x0000000000000000000000000000000000000000' ? owner : '');

        // ENS Resolution (for Owner Name/Avatar)
        let ownerEns = '';
        let ownerAvatar = '';
        const ownerAddress = finalOwner;
        if (ownerAddress && ownerAddress !== '0x0000000000000000000000000000000000000000') {
            try {
                // Use Mainnet for reverse resolution of owner address usually
                const ensName = await mainnetClient.getEnsName({ address: ownerAddress as `0x${string}` });
                if (ensName) {
                    ownerEns = ensName;
                    const avatar = await mainnetClient.getEnsAvatar({ name: ensName });
                    if (avatar) ownerAvatar = avatar;
                }
            } catch (e) { }
        }

        const btcMarketCap = 19700000 * btcPriceUsd; // approx supply or hardcoded 21m
        const ratio = btcMarketCap > 0 ? marketCap / btcMarketCap : 0;

        return {
            token: {
                name,
                symbol,
                address,
                supply: circulatingSupply.toLocaleString(),
                decimals,
                image: zoraData.image?.url || `https://dd.dexscreener.com/ds-data/tokens/base/${address}.png`, // FALLBACK ADDED
                creator: {
                    name: ownerEns || (ownerAddress ? `${ownerAddress.slice(0, 6)}...${ownerAddress.slice(-4)}` : 'Unknown'),
                    avatar: ownerAvatar, // If empty, UI handles fallback
                    ens: ownerEns
                },
                marketCap
            },
            comparison: {
                vsBitcoin: {
                    marketCapRatio: ratio,
                    insights: `At current prices, ${symbol} is ${(ratio * 100).toFixed(6)}% of Bitcoin's potential market cap.`
                }
            }
        };

    } catch (error: any) {
        return { error: error.message || 'Unknown error' };
    }
}
