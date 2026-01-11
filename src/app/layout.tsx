import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fragen & Antworten - Radhaus & Voisa",
  description: "Stellen Sie Ihre Fragen und erhalten Sie Antworten von unserem Team",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
