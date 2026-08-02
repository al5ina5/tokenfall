import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TokenFall — Ultra-Cheap AI Tokens",
  description: "The first Web3-native AI token marketplace. Pay with crypto. Earn NFTs. Stake. Repeat.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="scanline min-h-screen">
        <header className="border-b border-[var(--border)] px-6 py-3 flex items-center justify-between">
          <pre className="ascii-title text-xs leading-tight">
{`████████╗ ██████╗ ██╗  ██╗███████╗███╗   ██╗
╚══██╔══╝██╔═══██╗██║ ██╔╝██╔════╝████╗  ██║
   ██║   ██║   ██║█████╔╝ █████╗  ██╔██╗ ██║
   ██║   ██║   ██║██╔═██╗ ██╔══╝  ██║╚██╗██║
   ██║   ╚██████╔╝██║  ██╗███████╗██║ ╚████║
   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝`}
          </pre>
          <nav className="flex gap-4 text-xs tracking-wider">
            <a href="/" className="hover:text-[var(--gold)]">DASHBOARD</a>
            <a href="/models" className="hover:text-[var(--gold)]">MODELS</a>
            <a href="/keys" className="hover:text-[var(--gold)]">API KEYS</a>
            <a href="/docs" className="hover:text-[var(--gold)]">DOCS</a>
          </nav>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-[var(--border)] px-6 py-4 text-xs text-[var(--border)] text-center">
          <span className="ticker inline-block">TOKENFALL v1.0 // ULTRA-CHEAP AI TOKENS // SONIC CHAIN // NFT GAMIFICATION // CRYPTO-NATIVE // NO CARD FEES // PAY WITH SOL // </span>
        </footer>
      </body>
    </html>
  );
}
