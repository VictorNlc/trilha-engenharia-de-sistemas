import type { Metadata } from "next";
import { Fraunces, Public_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-ibm-plex-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Trilha Engenharia de Sistemas",
  description: "Formação autodidata gratuita em Engenharia de Sistemas, com prova, revisão de mentor e comunidade.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${publicSans.variable} ${plexMono.variable}`}>
      <body className="font-body min-h-screen flex flex-col" style={{ fontFamily: "var(--font-public-sans), system-ui, sans-serif" }}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line py-8 px-6 text-center text-xs text-inkFaint">
          Trilha Engenharia de Sistemas — conteúdo aberto, gratuito, em português.
        </footer>
      </body>
    </html>
  );
}
