import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Toaster } from "sonner";
import { ShieldCheck } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "CertChain — Blockchain Certificates",
  description: "Issue and verify tamper-proof digital certificates on the blockchain.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6 sm:py-3">
            <Link href="/" className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <span className="truncate font-semibold text-slate-900">CertChain</span>
            </Link>
            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
              <Link
                href="/verify"
                className="rounded-lg px-2.5 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:px-3"
              >
                Verify
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg px-2.5 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:px-3"
              >
                <span className="sm:hidden">Portal</span>
                <span className="hidden sm:inline">Organization Portal</span>
              </Link>
            </div>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
          {children}
        </main>

        <footer className="border-t border-slate-200">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-1.5 px-4 py-5 text-center text-xs text-slate-400 sm:flex-row sm:px-6 sm:py-6 sm:text-left">
            <span>CertChain — Blockchain-Based Digital Certificate Platform</span>
            <span>Powered by Ethereum Sepolia</span>
          </div>
        </footer>

        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}