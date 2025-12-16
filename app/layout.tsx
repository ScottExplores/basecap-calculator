import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import { RootProvider } from "./rootProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Base Market Cap Calculator",
  description: "Visualize token prices with the market cap of others.",
  other: {
    "base:app_id": "693fc068d77c069a945bdef4",
    "fc:miniapp": JSON.stringify({
      version: "next",
      imageUrl: "https://basecap-calculator.vercel.app/preview.png",
      button: {
        title: "MarketCap-Calculator",
        action: {
          type: "launch_frame",
          url: "https://basecap-calculator.vercel.app",
        },
      },
    }),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${sourceCodePro.variable}`}>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
