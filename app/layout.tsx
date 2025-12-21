import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'ArtScaler | #1 Art Research Engine',
  description: 'AI-powered art research, price predictions, and trend tracking for serious artists.',
};

import { PayPalProvider } from "@/components/providers/PayPalProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <PayPalProvider>
            {children}
          </PayPalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

