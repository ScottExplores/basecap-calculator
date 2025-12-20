import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { baseAccount } from "wagmi/connectors";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";

export const wagmiConfig = createConfig({
    chains: [base],
    transports: {
        [base.id]: http(),
    },
    connectors: [
        farcasterMiniApp(),
        baseAccount({
            appName: 'CreatorCap',
        })
    ],
    ssr: true,
});
