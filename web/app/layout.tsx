import type { Metadata } from "next";
import { Instrument_Sans, Work_Sans } from "next/font/google";
import { SITE_URL } from "@/lib/config";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  display: "swap",
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  display: "swap",
});

const DEFAULT_DESCRIPTION =
  "En yeni telefon, bilgisayar ve aksesuarlar — spesifikasyonu net, fiyatı net.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TechStore",
    template: "%s | TechStore",
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    siteName: "TechStore",
    type: "website",
    locale: "tr_TR",
    title: "TechStore",
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "TechStore",
    description: DEFAULT_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${instrumentSans.variable} ${workSans.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
