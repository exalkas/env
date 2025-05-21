"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/AuthContext";
import { MarketProvider } from "@/lib/MarketContext";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <MarketProvider>{children}</MarketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
