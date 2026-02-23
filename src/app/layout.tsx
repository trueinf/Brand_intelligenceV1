import type { Metadata } from "next";
import { Inter, Oswald, Roboto, Playfair_Display, Lora } from "next/font/google";
import { UnhandledRejectionHandler } from "@/components/UnhandledRejectionHandler";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-headline-nike",
});

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-body-nike",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-headline-mondavi",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-body-mondavi",
});

export const metadata: Metadata = {
  title: "Brand Campaign Intelligence",
  description: "AI-powered campaign intelligence from mock SEMrush-like data",
};

const brandKitFontVariables = [
  oswald.variable,
  roboto.variable,
  playfair.variable,
  lora.variable,
].filter(Boolean).join(" ");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${brandKitFontVariables} font-sans antialiased`}>
        <UnhandledRejectionHandler />
        {children}
      </body>
    </html>
  );
}
