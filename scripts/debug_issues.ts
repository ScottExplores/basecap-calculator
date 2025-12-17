import { fetchCreatorCoin } from '../lib/fetchCreatorCoin';

async function test() {
    console.log("--- Testing ENS Resolution ---");
    const ensResult = await fetchCreatorCoin('scottexplores.base.eth');
    console.log("ENS Result:", JSON.stringify(ensResult, null, 2));

    console.log("\n--- Testing Contract Address (Image Check) ---");
    const contractResult = await fetchCreatorCoin('0xf5546bf64475b8ece6ac031e92e4f91a88d9dc5e');
    console.log("Contract Result:", JSON.stringify(contractResult, null, 2));
}

test();
