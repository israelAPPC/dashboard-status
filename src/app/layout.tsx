import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import Link from "next/link";
import { BarChart2 } from "lucide-react";
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
        <Script src="https://identity.netlify.com/v1/netlify-identity-widget.js" strategy="afterInteractive" />
        <Script id="netlify-identity-redirect" strategy="afterInteractive">
          {`
            if (window.netlifyIdentity) {
              window.netlifyIdentity.on("init", (user) => {
                if (!user) {
                  window.netlifyIdentity.on("login", () => {
                    document.location.href = "/admin/";
                  });
                }
              });
            }
          `}
        </Script>
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#2c98b0]/10 flex items-center justify-center">
                <BarChart2 className="w-5 h-5 text-[#2c98b0]" />
              </div>
              <div className="leading-tight">
                <p className="font-semibold text-slate-800 text-sm">Dygnus Dashboard</p>
                <p className="text-xs text-slate-500">Acompanhamento de desenvolvimento</p>
              </div>
            </Link>
          </div>
        </header>
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</main>
        <footer className="text-center text-xs text-slate-400 py-6">
          Atualizado periodicamente pela equipe de desenvolvimento
        </footer>
      </body>
    </html>
  );
}
