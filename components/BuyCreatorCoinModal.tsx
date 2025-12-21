import { Wallet, ConnectWallet } from '@coinbase/onchainkit/wallet';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { tradeCreatorCoin } from '@/utils/zora';

interface BuyCreatorCoinModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BuyCreatorCoinModal({ isOpen, onClose }: BuyCreatorCoinModalProps) {
    const { address } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();

    const [buyAmount, setBuyAmount] = useState('');
    const [isBuying, setIsBuying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Hardcoded Creator Token Address
    const SCOTT_EXPLORES_ADDRESS = '0xf5546bf64475b8ece6ac031e92e4f91a88d9dc5e';

    if (!isOpen) return null;

    const handleBuy = async () => {
        if (!walletClient || !publicClient || !buyAmount) return;
        setIsBuying(true);
        setError(null);
        try {
            await tradeCreatorCoin(SCOTT_EXPLORES_ADDRESS, buyAmount, walletClient, publicClient);
            onClose();
        } catch (e: any) {
            console.error("Buy failed:", e);
            setError(e.message || "Transaction failed");
        } finally {
            setIsBuying(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 relative shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors z-10"
                >
                    <X className="w-5 h-5 text-slate-500" />
                </button>

                <div className="mb-6 text-center">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Support Scott Explores</h2>
                    <p className="text-sm text-slate-500 mt-1">Buy Creator Coin on Zora</p>
                </div>

                <div className="animate-in slide-in-from-bottom-5 duration-300">
                    {address ? (
                        <div className="flex flex-col gap-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                        <img src="https://avatars.githubusercontent.com/u/168605286?v=4" alt="Scott Explores" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Scott Explores</p>
                                        <p className="text-xs text-blue-600 dark:text-blue-300">Zora Creator Coin</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    This purchase happens directly on the Zora Protocol.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Amount (ETH)
                                </label>
                                <input
                                    type="number"
                                    value={buyAmount}
                                    onChange={(e) => setBuyAmount(e.target.value)}
                                    placeholder="0.01"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none text-xl font-bold"
                                />
                            </div>

                            {error && (
                                <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleBuy}
                                disabled={!buyAmount || isBuying}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                {isBuying && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isBuying ? 'Processing...' : 'Buy Scott Explores'}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <p className="text-slate-500">Please connect your wallet to buy.</p>
                            <Wallet>
                                <ConnectWallet className="bg-blue-600" />
                            </Wallet>
                        </div>
                    )}
                </div>

                <div className="mt-4 text-xs text-center text-slate-400">
                    Contract: {SCOTT_EXPLORES_ADDRESS.slice(0, 6)}...{SCOTT_EXPLORES_ADDRESS.slice(-4)}
                </div>
            </div>
        </div>
    );
}
