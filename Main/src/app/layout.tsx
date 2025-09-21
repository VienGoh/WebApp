import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/forms/Nav";

export const metadata: Metadata = {
  title: "Sistem Bengkel + K-Means",
  description: "Next.js + SQLite (Prisma) untuk skripsi.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="app-root">
        <header className="app-header">
          <div className="container">
            <div className="brand">
              <Link href="/" className="brand-link">BengkelApp</Link>
              <span className="brand-sub">Next.js + SQLite</span>
            </div>

            {/* ← Nav berada di sini */}
            <Nav />
          </div>
        </header>

        <main className="app-main">
          <div className="container">{children}</div>
        </main>

        <footer className="app-footer">
          <div className="container text-xs">
            © {new Date().getFullYear()} BengkelApp — Skripsi
          </div>
        </footer>
      </body>
    </html>
  );
}
