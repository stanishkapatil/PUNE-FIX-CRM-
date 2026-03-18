import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

import { ErrorBoundary } from "../components/shared/ErrorBoundary";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "P-CRM — Smart Public Governance",
  description: "AI-native grievance management system for municipal corporations.",
  openGraph: {
    title: "P-CRM — Smart Public Governance",
    description: "AI-native grievance management system for municipal corporations.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "P-CRM — Smart Public Governance",
    description: "AI-native grievance management system for municipal corporations.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased font-sans`}>
        <ErrorBoundary>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: { borderRadius: 12 },
            }}
            gutter={8}
          />
        </ErrorBoundary>
      </body>
    </html>
  );
}
