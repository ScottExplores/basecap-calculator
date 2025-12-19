import { Buy } from '@coinbase/onchainkit/buy';
import { Wallet, ConnectWallet } from '@coinbase/onchainkit/wallet';
import { useAccount } from 'wagmi';
import type { Token } from '@coinbase/onchainkit/token';
import { X } from 'lucide-react';
import { TokenData } from '@/hooks/useTokenData';

interface SwapModalProps {
    isOpen: boolean;
    onClose: () => void;
    tokenIn: TokenData | null;
    tokenOut: TokenData | null;
}

export function SwapModal({ isOpen, onClose, tokenIn, tokenOut }: SwapModalProps) {
    const { address } = useAccount();

    if (!isOpen) return null;

    // Helper to map TokenData to OnchainKit Token
    const mapToken = (t: TokenData | null): Token | undefined => {
        // Default to ETH if null (useful for "Sell" token defaults)
        if (!t) {
            return {
                name: 'Ether',
                address: '',
                symbol: 'ETH',
                decimals: 18,
                image: 'https://wallet-api-production.s3.amazonaws.com/uploads/tokens/eth_288.png',
                chainId: 8453,
            };
        }

        let addr = t.address;
        let decimals = t.decimals || 18;
        let symbol = t.symbol;

        // Special Handling for Bitcoin -> cbBTC and ETH -> Native
        if (t.id === 'bitcoin' || t.symbol.toUpperCase() === 'BTC') {
            addr = '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf'; // cbBTC on Base
            symbol = 'cbBTC';
            decimals = 8;
        } else if (t.symbol.toUpperCase() === 'ETH') {
            // Native ETH uses empty string address in OnchainKit
            addr = '';
        }

        // Validate Address (Allow empty string ONLY for ETH)
        if (symbol !== 'ETH' && (!addr || !addr.startsWith('0x'))) {
            console.warn("Invalid Swap Token Address:", t.symbol, addr);
            return undefined; // Will create empty state in Swap, preventing disabled button "stuck" state or showing defaults
        }

        return {
            name: t.name,
            address: addr as `0x${string}`,
            symbol: symbol,
            decimals: decimals,
            image: t.image || "",
            chainId: 8453,
        };
    };

    const toToken = mapToken(tokenOut);
    // Note: Buy component handles 'fromToken' (ETH) internally usually, 
    // or we can pass it if we want specific source. 
    // For now we just focus on the target token.

    const ethToken: Token = {
        name: 'Ether',
        address: '',
        symbol: 'ETH',
        decimals: 18,
        image: 'https://wallet-api-production.s3.amazonaws.com/uploads/tokens/eth_288.png',
        chainId: 8453,
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 relative shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors z-10"
                >
                    <X className="w-5 h-5 text-slate-500" />
                </button>

                <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Buy {toToken?.symbol || 'Token'}</h2>
                </div>

                {/* Buy Interface */}
                <div className="animate-in slide-in-from-bottom-5 duration-300">
                    {address ? (
                        toToken ? (
                            <Buy
                                toToken={toToken}
                                fromToken={ethToken}
                                experimental={{ useAggregator: true }}
                            />
                        ) : (
                            <div className="text-center p-4 text-slate-500">
                                Invalid Token Data
                            </div>
                        )
                    ) : (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <p className="text-slate-500">Please connect your wallet to buy.</p>
                            <Wallet>
                                <ConnectWallet className="bg-blue-600" />
                            </Wallet>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
