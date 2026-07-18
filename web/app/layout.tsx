import type { Metadata } from "next";
import { Instrument_Sans, Work_Sans } from "next/font/google";
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

export const metadata: Metadata = {
  title: "TechStore",
  description: "En yeni telefon, bilgisayar ve aksesuarlar — spesifikasyonu net, fiyatı net.",
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
