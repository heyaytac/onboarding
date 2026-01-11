import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Q&A Platform - Radhaus & Voisa",
  description: "Ask questions and get answers from our team",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
