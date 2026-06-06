import type { Metadata } from "next";
import { Google_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const googleSans = Google_Sans({
  variable: "--font-google-sans",
  weight: ["400", "500", "600", "700"],
});
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Auto WhatsApp",
  description: "AI-powered WhatsApp inbox",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${googleSans.variable} ${jetbrainsMono.variable} antialiased h-full`}>
        {children}
      </body>
    </html>
  );
}
