
import { createPublicClient, http, parseAbiItem } from 'viem';
import { base } from 'viem/chains';
import { getAddress } from '@coinbase/onchainkit/identity';

const client = createPublicClient({
    chain: base,
    transport: http('https://mainnet.base.org'),
});

async function debug() {
    const name = 'scottexplores.base.eth';
    console.log(`Resolving ${name}...`);

    try {
        const address = await getAddress({ name, chain: base });
        console.log(`Resolved Address: ${address}`);

        if (address) {
            console.log(`Resolved Address (User/Wallet): ${address}`);
            const knownToken = '0xf5546bf64475b8ece6ac031e92e4f91a88d9dc5e';

            // Check if this address OWNS the known token
            try {
                const owner = await client.readContract({
                    address: knownToken as `0x${string}`,
                    abi: [parseAbiItem('function owner() view returns (address)')],
                    functionName: 'owner'
                });
                console.log(`Known Token Owner: ${owner}`);
                if (owner && owner.toLowerCase() === address.toLowerCase()) {
                    console.log("SUCCESS: Resolved address OWNS the known token.");
                } else {
                    console.log("Resolved address does NOT own the known token.");
                }
            } catch (e) {
                console.log("Could not fetch owner of known token.");
            }
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

debug();
