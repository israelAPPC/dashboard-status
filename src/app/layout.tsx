import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { Home } from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dygnus | Status do Dashboard",
  description: "Acompanhamento do desenvolvimento do Dashboard Dygnus por módulo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2.5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#2c98b0]/10 flex items-center justify-center overflow-hidden">
                <Image src="/dygnus-icon.ico" alt="Dygnus" width={22} height={22} />
              </div>
              <div className="leading-tight">
                <p className="font-semibold text-slate-800 text-sm">Dygnus Dashboard</p>
                <p className="text-xs text-slate-500">Acompanhamento de desenvolvimento</p>
              </div>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-[#2c98b0]/40 hover:text-[#2c98b0] transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              Início
            </Link>
          </div>
        </header>
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
