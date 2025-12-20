import { handleCoinSearch } from './utils/searchHandler';
import * as fs from 'fs';

async function main() {
    console.log("Searching for 'jesse'...");
    try {
        const result = await handleCoinSearch('jesse');
        fs.writeFileSync('jesse_metadata.json', JSON.stringify(result, null, 2));
        console.log("Saved metadata to jesse_metadata.json");
    } catch (error) {
        console.error("Error:", error);
    }
}

main();
