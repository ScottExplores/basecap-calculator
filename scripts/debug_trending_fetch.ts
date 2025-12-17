import axios from 'axios';

const PINNED_TOKENS = [
    { id: 'jesse-pollak', symbol: 'jesse', address: '0x50f88fe97f72cd3e75b9eb4f747f59bceba80d59', name: 'Jesse Pollak' },
    { id: 'based-brett', symbol: 'brett', address: '0x532f27101965dd16442e59d40670faf5ebb142e4' },
    { id: 'degen-base', symbol: 'degen', address: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed' },
    { id: 'toshi-base', symbol: 'toshi', address: '0xac1bd2486aaf3b5c0fc3fd868558b082a531b2b4' },
    { id: 'higher', symbol: 'higher', address: '0x27d2decb4bfc9c76f0309b8e88dec3a601fe25a8' },
    { id: 'keyboard-cat', symbol: 'keycat', address: '0x9a26f5433671751c3276a065f57e5a02d2817973' },
    { id: 'mister-miggles', symbol: 'miggles', address: '0xb1a03eda10342529bbf8eb700a06c60441fef25d' },
    { id: 'ski-mask-dog', symbol: 'ski', address: '0x768be13e1680b5ebe0024c42c896e3db59ec0149' },
    { id: 'based-pepe', symbol: 'pepe', address: '0x52b492a33e447cdb854c7fc19f1e57e8bfa1777d' },
    { id: 'mochi-the-cat-coin', symbol: 'mochi', address: '0xf6e932ca12afa26665dc4dde7e27be02a7c02e50' },
    { id: 'doginme', symbol: 'doginme', address: '0x6921b130d297cc43754afba22e5eac0fbf8db75b' },
    { id: 'bloo-foster-coin', symbol: 'bloo', address: '0x8a5f9a6b653ecbdb406f9eb5f0c8ddba10919aec' },
    { id: 'base-god', symbol: 'tybg', address: '0x0d97f261b1e88845184f678e2d1e7a98d9fd38de' },
    { id: 'briun-armstrung', symbol: 'briun', address: '0x8c81b4c816d66d36c4bf348bdec01dbcbc70e987' },
    { id: 'base-dawgz', symbol: 'dawgz', address: '0xb34be2f34a662655760ce9c908f4ad594b7837f6' },
    { id: 'chuck-on-base', symbol: 'chuck', address: '0x7a8a5012022bccbf3ea4b03cd2bb5583d915fb1a' },
    { id: 'boom-on-base', symbol: 'boomer', address: '0x178129f780521e20235372338210d597fb77ac15' },
    { id: 'crow-with-knife', symbol: 'caw', address: '0xdfbea88c4842d30c26669602888d746d30f9d60d' },
    { id: 'basenji', symbol: 'benji', address: '0xbc45647ea894030a4e9801ec03479739fa2485f0' },
    { id: 'normie-base', symbol: 'normie', address: '0x47b464edb8dc9bc67b5cd4c9310bb87b773845bd' }
];

async function main() {
    try {
        const pinnedAddresses = PINNED_TOKENS.map(t => t.address).join(',');
        console.log("Fetching DexScreener for addresses:", pinnedAddresses);

        const dsResponse = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${pinnedAddresses}`);

        if (!dsResponse.data?.pairs) {
            console.log("No pairs returned from DexScreener");
            return;
        }

        console.log(`Received ${dsResponse.data.pairs.length} pairs`);

        const pinnedDataMap = new Map();
        dsResponse.data.pairs.forEach((pair: any) => {
            const baseAddr = pair.baseToken.address.toLowerCase();
            const quoteAddr = pair.quoteToken.address.toLowerCase();

            // Log if we see Jesse involved at all
            if (baseAddr.includes('50f88fe') || quoteAddr.includes('50f88fe')) {
                console.log(`Found Jesse Pair: Base=${pair.baseToken.symbol} (${baseAddr}), Quote=${pair.quoteToken.symbol} (${quoteAddr}), Liquidity=$${pair.liquidity?.usd}`);
            }

            // Normal Logic simulation
            if (!pinnedDataMap.has(baseAddr) || (pair.liquidity?.usd > (pinnedDataMap.get(baseAddr).liquidity || 0))) {
                pinnedDataMap.set(baseAddr, {
                    price: parseFloat(pair.priceUsd),
                    mcap: pair.fdv || pair.marketCap || 0,
                    symbol: pair.baseToken.symbol
                });
            }
        });

        console.log("--- Results ---");
        PINNED_TOKENS.forEach(pin => {
            const data = pinnedDataMap.get(pin.address.toLowerCase());
            if (data) {
                console.log(`[OK] ${pin.symbol}: Price $${data.price}, Mcap $${data.mcap}`);
            } else {
                console.log(`[MISSING] ${pin.symbol} (${pin.address}) - No DexScreener data found`);
            }
        });

    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

main();
