import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ConfigBootstrap } from "@/app/providers/ConfigBootstrap";
import { RoleContextMenu } from "@/components/layout/RoleContextMenu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brandmastuj STABLE",
  description: "Najlepsza i najbardziej stable apka do dyspo:ppp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ConfigBootstrap ttlMs={0} />
        <RoleContextMenu />
        {children}
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
