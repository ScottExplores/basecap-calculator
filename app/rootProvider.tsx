"use client";
import { ReactNode } from "react";
import { base } from "wagmi/chains";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import "@coinbase/onchainkit/styles.css";

import { ThemeProvider } from "@/components/ThemeProvider";

export function RootProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <OnchainKitProvider
        apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
        chain={base}
        config={{
          appearance: {
            mode: "dark",
          },
          wallet: {
            display: "modal",
            preference: "all", // 'all' | 'smartWalletOnly' | 'eoaOnly'
          },
        }}
        miniKit={{ enabled: true }}
      >
        {children}
      </OnchainKitProvider>
    </ThemeProvider>
  );
}
