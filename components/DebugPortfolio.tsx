'use client';

import { useAccount } from 'wagmi';
import { getPortfolios } from '@coinbase/onchainkit/api';
import { useState } from 'react';

export function DebugPortfolio() {
    const { address } = useAccount();
    const [log, setLog] = useState<string>('Ready to test...');

    const testFetch = async () => {
        if (!address) return setLog('No address connected');
        setLog('Fetching...');
        try {
            const portfolios = await getPortfolios({ addresses: [address] });
            setLog(JSON.stringify(portfolios, null, 2));
        } catch (e: any) {
            setLog(`Error: ${e.message} \n ${JSON.stringify(e)}`);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 p-4 bg-black text-white text-xs max-w-lg max-h-64 overflow-auto z-50 border border-green-500">
            <button onClick={testFetch} className="bg-green-600 px-2 py-1 mb-2">Test Portfolio API</button>
            <pre>{log}</pre>
        </div>
    );
}
