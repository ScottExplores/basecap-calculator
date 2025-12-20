"use client";
import { ReactNode } from "react";
import { base } from "wagmi/chains";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi";
import "@coinbase/onchainkit/styles.css";



import { ThemeProvider } from "@/components/ThemeProvider";
import { MiniKitProvider } from "@/providers/MiniKitProvider";

export function RootProvider({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <OnchainKitProvider
            apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
            projectId={process.env.NEXT_PUBLIC_CDP_PROJECT_ID}
            chain={base}
            // @ts-ignore - Enable MiniKit features
            miniKit={{ enabled: true }}
            config={{
              appearance: {
                mode: "dark",
              },
              wallet: {
                display: "modal",
                preference: "all",
              },
            }}
          >
            <MiniKitProvider>
              {children}
            </MiniKitProvider>
          </OnchainKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider >
  );
}
