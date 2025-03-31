import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "助记词再加密",
  description: "助记词再加密",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
