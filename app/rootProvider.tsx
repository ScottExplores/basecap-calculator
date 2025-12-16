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
            mode: "auto", // OnchainKit will respect the class attribute
          },
          wallet: {
            display: "modal",
            preference: "all",
          },
        }}
      >
        {children}
      </OnchainKitProvider>
    </ThemeProvider>
  );
}
