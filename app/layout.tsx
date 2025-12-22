import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { defaultMetadata, viewport as defaultViewport } from "./shared-metadata";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = defaultMetadata;
export const viewport = defaultViewport;

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

