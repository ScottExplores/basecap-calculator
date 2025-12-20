"use client";
import { ReactNode } from "react";
import { MiniKitProvider as OnchainMiniKitProvider } from "@coinbase/onchainkit/minikit";
import { base } from "wagmi/chains";

export function MiniKitProvider({ children }: { children: ReactNode }) {
    return (
        <OnchainMiniKitProvider
            // @ts-ignore
            apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
            // @ts-ignore
            chain={base}
        >
            {children}
        </OnchainMiniKitProvider>
    );
}
