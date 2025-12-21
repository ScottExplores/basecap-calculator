import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Static fallbacks in case API is down or throttled
const TOP_COINS_FALLBACK = [
    { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 95000, market_cap: 1800000000000, market_cap_rank: 1, image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
    { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 2600, market_cap: 310000000000, market_cap_rank: 2, image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
    { id: 'solana', symbol: 'sol', name: 'Solana', current_price: 180, market_cap: 85000000000, market_cap_rank: 5, image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
    { id: 'binancecoin', symbol: 'bnb', name: 'BNB', current_price: 600, market_cap: 88000000000, market_cap_rank: 4, image: 'https://assets.coingecko.com/coins/images/825/large/binance-coin.png' },
    { id: 'ripple', symbol: 'xrp', name: 'XRP', current_price: 2.50, market_cap: 140000000000, market_cap_rank: 3, image: 'https://assets.coingecko.com/coins/images/44/large/xrp.png' },
];

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const query = searchParams.get('query');
    const category = searchParams.get('category');
    const per_page = searchParams.get('per_page') || '100';

    try {
        if (type === 'markets') {
            const response = await axios.get(`${COINGECKO_API}/coins/markets`, {
                params: {
                    vs_currency: 'usd',
                    order: 'market_cap_desc',
                    per_page,
                    page: 1,
                    sparkline: false,
                    category: category || undefined,
                    ids: searchParams.get('ids') || undefined,
                },
                timeout: 5000,
            });
            return NextResponse.json(response.data);
        }

        if (type === 'search' && query) {
            const response = await axios.get(`${COINGECKO_API}/search`, {
                params: { query },
                timeout: 5000,
            });
            return NextResponse.json(response.data);
        }

        return NextResponse.json({ error: 'Invalid type or missing parameters' }, { status: 400 });
    } catch (error: any) {
        console.error('API Proxy Error:', error.message);

        // Return fallback for markets if it fails
        if (type === 'markets' && !category) {
            return NextResponse.json(TOP_COINS_FALLBACK);
        }

        return NextResponse.json({ error: 'Failed to fetch from CoinGecko', details: error.message }, { status: 502 });
    }
}
