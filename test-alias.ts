
import { fetchCreatorCoin } from './lib/fetchCreatorCoin';

async function test() {
    console.log('Testing Alias for scottexplores.base.eth...');
    try {
        const result = await fetchCreatorCoin('scottexplores.base.eth');
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
