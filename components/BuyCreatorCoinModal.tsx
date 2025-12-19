import { Buy } from '@coinbase/onchainkit/buy';
import { Wallet, ConnectWallet } from '@coinbase/onchainkit/wallet';
import { useAccount } from 'wagmi';
import { Token } from '@coinbase/onchainkit/token';
import { X } from 'lucide-react';

interface BuyCreatorCoinModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BuyCreatorCoinModal({ isOpen, onClose }: BuyCreatorCoinModalProps) {
    const { address } = useAccount();

    if (!isOpen) return null;

    // Hardcoded Creator Token
    const creatorToken: Token = {
        name: 'Scott Explores',
        address: '0xf5546bf64475b8ece6ac031e92e4f91a88d9dc5e',
        symbol: 'Scott Explores', // Forcing full name display as per user request
        decimals: 18,
        image: 'https://avatars.githubusercontent.com/u/168605286?v=4',
        chainId: 8453,
    };

    // ETH as default input
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
                    <p className="text-sm text-slate-500 mt-1">Buy Creator Coin</p>
                </div>

                <div className="animate-in slide-in-from-bottom-5 duration-300">
                    {address ? (
                        <Buy
                            toToken={creatorToken}
                            fromToken={ethToken}
                            experimental={{ useAggregator: true }}
                        />
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
                    Contract: {creatorToken.address.slice(0, 6)}...{creatorToken.address.slice(-4)}
                </div>
            </div>
        </div>
    );
}
