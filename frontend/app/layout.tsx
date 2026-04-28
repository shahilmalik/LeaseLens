import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LeaseLens — Read your German lease like a local",
  description:
    "Premium AI co-pilot for international students renting in Stuttgart. Scan your contract, check the Mietpreisbremse, and get clear answers in seconds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-surface-muted font-sans text-ink-900 antialiased">
        {children}
      </body>
    </html>
  );
}
