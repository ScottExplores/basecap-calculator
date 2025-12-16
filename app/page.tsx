'use client';

import { useState, useEffect } from 'react';
import { Wallet } from "@coinbase/onchainkit/wallet";
import { TokenInput } from '@/components/TokenInput';
import { MarketCapDisplay } from '@/components/MarketCapDisplay';
import { ShareButton } from '@/components/ShareButton';
import { useTokenData } from '@/hooks/useTokenData';
import sdk from '@farcaster/miniapp-sdk';
import { Footer } from '@/components/Footer';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowRightLeft } from 'lucide-react';

export default function Home() {
  // Initialize with ETH and BTC IDs
  const [tokenAId, setTokenAId] = useState<string | null>('ethereum');
  const [tokenBId, setTokenBId] = useState<string | null>('bitcoin');
  const [amount, setAmount] = useState<number | string>(1);

  const { data: tokenA } = useTokenData(tokenAId || '');
  const { data: tokenB } = useTokenData(tokenBId || '');

  useEffect(() => {
    const init = async () => {
      try {
        await sdk.actions.ready();
      } catch (e) {
        console.log("Not in Farcaster environment or SDK error:", e);
      }
    };
    init();
  }, []);

  const handleSwap = () => {
    const temp = tokenAId;
    setTokenAId(tokenBId);
    setTokenBId(temp);
  };


  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center p-4 md:p-8 font-sans selection:bg-blue-500/30 relative overflow-hidden transition-colors duration-300">

      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[100px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/20 blur-[100px] rounded-full pointer-events-none z-0" />

      <div className="w-full flex justify-end mb-8 relative z-10 gap-4 items-center">
        <ThemeToggle />
        <Wallet className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 transition-all shadow-lg shadow-blue-500/20 border-0 rounded-full font-bold" />
      </div>

      <div className="w-full max-w-5xl flex flex-col items-center justify-center relative z-10 gap-12 flex-grow">

        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl hidden md:block">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight drop-shadow-lg leading-tight text-slate-900 dark:text-white">
            Show the price of <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600">{tokenA ? tokenA.symbol.toUpperCase() : 'ETH'}</span> with the market cap of <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-violet-800 dark:from-violet-400 dark:to-violet-600">{tokenB ? tokenB.symbol.toUpperCase() : 'BTC'}</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">
            Visualize potential growth and compare valuations
          </p>
        </div>

        {/* Comparison Section */}
        <div className="flex flex-col md:flex-row items-center gap-3 w-full justify-center relative animate-in fade-in slide-in-from-bottom-5 duration-700 z-20">

          {/* Input A */}
          <div className="w-full md:w-[45%] z-40 flex flex-col gap-4">
            <TokenInput
              placeholder="Select Token (e.g. ETH)"
              selectedToken={tokenA}
              onSelect={(t) => setTokenAId(t ? t.id : null)}
            />
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            className="p-4 bg-slate-800/80 backdrop-blur-md border border-slate-600 rounded-full hover:bg-slate-700 hover:border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all z-30 group"
          >
            <ArrowRightLeft className="w-6 h-6 text-slate-400 group-hover:text-white transition-transform duration-300 md:group-hover:rotate-180 rotate-90 md:rotate-0" />
          </button>

          {/* Input B */}
          <div className="w-full md:w-[45%] z-20">
            <TokenInput
              placeholder="Select Target (e.g. BTC)"
              selectedToken={tokenB}
              onSelect={(t) => setTokenBId(t ? t.id : null)}
            />
          </div>
        </div>

        {/* Result Section */}
        <div className="w-full max-w-3xl animate-in fade-in zoom-in duration-700 delay-150 flex flex-col items-center gap-6 relative z-10">
          <MarketCapDisplay
            tokenA={tokenA || null}
            tokenB={tokenB || null}
            amount={Number(amount) || 1}
            onAmountChange={setAmount}
          />
          {(tokenA && tokenB) && (
            <ShareButton
              tokenA={tokenA.symbol.toUpperCase()}
              tokenB={tokenB.symbol.toUpperCase()}
              price={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(tokenA.current_price * ((tokenB.market_cap / tokenA.market_cap)))}
              multiplier={(tokenB.market_cap / tokenA.market_cap).toFixed(2)}
            />
          )}
        </div>

      </div>
      <Footer />
    </main>
  );
}
