import { Buy } from '@coinbase/onchainkit/buy';
import { Wallet, ConnectWallet } from '@coinbase/onchainkit/wallet';
import { useAccount, useWalletClient, usePublicClient, useBalance } from 'wagmi';
import type { Token } from '@coinbase/onchainkit/token';
import { X, Loader2 } from 'lucide-react';
import { TokenData } from '@/hooks/useTokenData';
import { useState, useEffect } from 'react';
import { fetchCoinMetadata, tradeCreatorCoin } from '@/utils/zora';
import { parseEther } from 'viem';

interface SwapModalProps {
    isOpen: boolean;
    onClose: () => void;
    tokenIn: TokenData | null;
    tokenOut: TokenData | null;
}

export function SwapModal({ isOpen, onClose, tokenIn, tokenOut }: SwapModalProps) {
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();
    const { data: dataBalance } = useBalance({ address });

    const [isCreatorCoin, setIsCreatorCoin] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [zoraBuyAmount, setZoraBuyAmount] = useState('');
    const [isBuyingZora, setIsBuyingZora] = useState(false);
    const [zoraError, setZoraError] = useState<string | null>(null);

    // Detect if tokenOut is a Creator Coin
    useEffect(() => {
        const checkCreatorCoin = async () => {
            if (isOpen && tokenOut?.address) {
                setIsDetecting(true);
                setIsCreatorCoin(false);
                setZoraError(null);
                try {
                    // Start detection
                    const metadata = await fetchCoinMetadata(tokenOut.address);
                    // Use metadata existence as proxy for Zora Coin (since our fetcher uses Zora SDK)
                    if (metadata) {
                        setIsCreatorCoin(true);
                    }
                } catch (e) {
                    console.error("Detection error:", e);
                } finally {
                    setIsDetecting(false);
                }
            }
        };
        checkCreatorCoin();
    }, [isOpen, tokenOut]);

    const handleZoraBuy = async () => {
        if (!tokenOut?.address || !walletClient || !publicClient || !zoraBuyAmount) return;

        setIsBuyingZora(true);
        setZoraError(null);
        try {
            await tradeCreatorCoin(tokenOut.address, zoraBuyAmount, walletClient, publicClient);
            onClose(); // Close on success (or we could show success state)
        } catch (e: any) {
            console.error("Zora Buy Failed:", e);
            setZoraError(e.message || "Transaction failed");
        } finally {
            setIsBuyingZora(false);
        }
    };

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
            // console.warn("Invalid Swap Token Address:", t.symbol, addr); // Suppress warn
            return undefined;
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
                    {isDetecting ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                            <p>Checking token availability...</p>
                        </div>
                    ) : (
                        address ? (
                            isCreatorCoin ? (
                                <div className="flex flex-col gap-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">Creator Coin Detected</p>
                                        <p className="text-xs text-blue-600 dark:text-blue-300">
                                            This token is using Zora Protocol. Buying directly via Zora SDK.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                                            <label>Amount (ETH)</label>
                                            {address && (
                                                <span className="text-xs text-slate-500 font-mono">
                                                    Balance: {dataBalance ? Number(dataBalance.formatted).toFixed(4) : '...'} ETH
                                                </span>
                                            )}
                                        </div>
                                        <input
                                            type="number"
                                            value={zoraBuyAmount}
                                            onChange={(e) => setZoraBuyAmount(e.target.value)}
                                            placeholder="0.01"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none text-xl font-bold"
                                        />
                                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium italic">
                                            Note: You need some Ethereum to swap.
                                        </p>
                                    </div>

                                    {zoraError && (
                                        <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900">
                                            {zoraError}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleZoraBuy}
                                        disabled={!zoraBuyAmount || isBuyingZora}
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isBuyingZora && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {isBuyingZora ? 'buying...' : `Buy ${tokenOut?.symbol || 'Token'}`}
                                    </button>
                                </div>
                            ) : (
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
                            )
                        ) : (
                            <div className="flex flex-col items-center gap-4 py-8">
                                <p className="text-slate-500">Please connect your wallet to buy.</p>
                                <Wallet>
                                    <ConnectWallet className="bg-blue-600" />
                                </Wallet>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
