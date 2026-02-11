import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppLayoutClient from "./AppLayoutClient"; // Budeme potrebovať tento pomocný súbor

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AutoDesign Cloud",
  description: "Automatizácia svadobných oznámení",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk">
      <body class={`${geistSans.variable} antialiased`}>
        <AppLayoutClient>{children}</AppLayoutClient>
      </body>
    </html>
  );
}
