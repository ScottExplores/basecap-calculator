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
  title: "CreatorCap",
  description: "The official calculator for Creator Coins",
  openGraph: {
    title: "CreatorCap",
    description: "The official calculator for Creator Coins",
    url: "https://basecap-calculator.vercel.app",
    siteName: "CreatorCap",
    images: [
      {
        url: "https://basecap-calculator.vercel.app/og-image.png", // Assuming this will exist or be preview.png
        width: 1200,
        height: 630,
        alt: "Base Market Cap Calculator Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CreatorCap",
    description: "The official calculator for Creator Coins",
    images: ["https://basecap-calculator.vercel.app/og-image.png"],
  },
  other: {
    "base:app_id": "693fc068d77c069a945bdef4",
    "fc:miniapp": JSON.stringify({
      version: "next",
      imageUrl: "https://basecap-calculator.vercel.app/preview.png",
      button: {
        title: "CreatorCap",
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${sourceCodePro.variable}`}>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
