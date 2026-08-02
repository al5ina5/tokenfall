import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TokenFall — Ultra-Cheap AI Tokens",
  description: "Pay with crypto. Get AI tokens. Ultra-cheap. Sonic chain.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="scanline">
        <div className="page-grid">
          <header className="nav-header grid-span-12">
            <div className="nav-brand">TokenFall</div>
            <nav className="nav-links">
              <a href="/landing" className="nav-link">Home</a>
              <a href="/" className="nav-link">Dashboard</a>
              <a href="/models" className="nav-link">Models</a>
              <a href="/keys" className="nav-link">Keys</a>
              <a href="/genesis" className="nav-link">Pass</a>
              <a href="/forge" className="nav-link">Staking</a>
              <a href="/achievements" className="nav-link">Badges</a>
              <a href="/docs" className="nav-link">Docs</a>
            </nav>
          </header>
        </div>
        <main className="page-grid">
          <div className="grid-span-12">{children}</div>
        </main>
        <div className="page-grid">
          <footer className="grid-span-12 footer-meta">
            TokenFall · ultra-cheap AI inference · pay with crypto · no card fees
          </footer>
        </div>
      </body>
    </html>
  );
}
