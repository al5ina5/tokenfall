import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TokenFall — Ultra-Cheap AI Tokens",
  description: "The first Web3-native AI token marketplace. Pay with crypto. Earn NFTs. Stake. Repeat.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="page-grid">
          <header className="nav-header grid-span-12">
            <div className="nav-brand">TokenFall</div>
            <nav className="nav-links">
              <a href="/" className="nav-link">Dashboard</a>
              <a href="/models" className="nav-link">Models</a>
              <a href="/keys" className="nav-link">API Keys</a>
              <a href="/docs" className="nav-link">Docs</a>
            </nav>
          </header>
        </div>
        <main className="page-grid">
          <div className="grid-span-12">
            {children}
          </div>
        </main>
        <div className="page-grid">
          <footer className="grid-span-12 footer-meta">
            TokenFall · Ultra-cheap AI inference · Pay with crypto · No credit card fees
          </footer>
        </div>
      </body>
    </html>
  );
}
