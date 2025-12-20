import { handleCoinSearch } from './utils/searchHandler';
import * as fs from 'fs';

async function main() {
    console.log("Searching for 'scottexplores'...");
    try {
        const result = await handleCoinSearch('scottexplores');
        fs.writeFileSync('scottexplores_metadata.json', JSON.stringify(result, null, 2));
        console.log("Saved metadata to scottexplores_metadata.json");
    } catch (error) {
        console.error("Error:", error);
    }
}

main();
