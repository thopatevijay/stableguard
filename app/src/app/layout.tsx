import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StableGuard | Autonomous Stablecoin Risk Intelligence",
  description:
    "Real-time stablecoin depeg risk monitoring and autonomous protective actions on Solana. Monitors USDC, USDT, and PYUSD via Pyth Network oracles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased bg-gray-950 text-gray-100`}>
        {children}
      </body>
    </html>
  );
}
