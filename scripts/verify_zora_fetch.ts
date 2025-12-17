import { fetchCreatorCoin } from '../lib/fetchCreatorCoin';

const TEST_ADDRESS = '0xf5546bf64475b8ece6ac031e92e4f91a88d9dc5e'; // From prompt

async function main() {
    console.log(`Fetching metadata for ${TEST_ADDRESS}...`);
    const data = await fetchCreatorCoin(TEST_ADDRESS);
    console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
