export interface BaseToken {
    id: string; // CoinGecko ID
    symbol: string;
    name: string;
    address: `0x${string}`;
    decimals: number;
    logoURI?: string;
}

export const BASE_TOKENS: BaseToken[] = [
    {
        id: 'weth',
        symbol: 'WETH',
        name: 'Wrapped Ether',
        address: '0x4200000000000000000000000000000000000006',
        decimals: 18,
        logoURI: 'https://assets.coingecko.com/coins/images/2518/large/weth.png'
    },
    {
        id: 'usd-coin',
        symbol: 'USDC',
        name: 'USDC',
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        decimals: 6,
        logoURI: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png'
    },
    {
        id: 'degen-base',
        symbol: 'DEGEN',
        name: 'Degen',
        address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed',
        decimals: 18,
        logoURI: 'https://assets.coingecko.com/coins/images/34194/large/degen.png'
    },
    {
        id: 'brett',
        symbol: 'BRETT',
        name: 'Brett',
        address: '0x532f27101965dd16442E59d40670Faf5ebb142E6',
        decimals: 18,
        logoURI: 'https://assets.coingecko.com/coins/images/35070/large/brett.png'
    },
    {
        id: 'aerodrome-finance',
        symbol: 'AERO',
        name: 'Aerodrome',
        address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
        decimals: 18,
        logoURI: 'https://assets.coingecko.com/coins/images/31967/large/aerodrome.png'
    },
    {
        id: 'coinbase-wrapped-staked-eth',
        symbol: 'cbETH',
        name: 'Coinbase Wrapped Staked ETH',
        address: '0xbe9895146f7af43049ca1c1ae358b0541ea49704',
        decimals: 18,
        logoURI: 'https://assets.coingecko.com/coins/images/26819/large/cbeth.png'
    },
    {
        id: 'toshi',
        symbol: 'TOSHI',
        name: 'Toshi',
        address: '0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4',
        decimals: 18,
        logoURI: 'https://assets.coingecko.com/coins/images/31201/large/toshi.png'
    },
    {
        id: 'mogn',
        symbol: 'MOG',
        name: 'Mog Coin',
        address: '0x2Da56AcB9Ea78330f947bD57C54119Debda7AF71',
        decimals: 18,
        logoURI: 'https://assets.coingecko.com/coins/images/31034/large/mog.png'
    }
];
