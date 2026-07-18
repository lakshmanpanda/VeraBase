import type { Metadata } from "next";
import { Inter, DM_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VeraBase — Enterprise NL2SQL Intelligence",
  description: "Ask questions in plain English. Get enterprise-grade SQL insights instantly. Powered by semantic AI and deterministic execution.",
  keywords: ["NL2SQL", "enterprise analytics", "AI data", "semantic layer", "business intelligence"],
  openGraph: {
    title: "VeraBase — Enterprise NL2SQL Intelligence",
    description: "Natural language to SQL for enterprise data warehouses.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#080809]">{children}</body>
    </html>
  );
}
