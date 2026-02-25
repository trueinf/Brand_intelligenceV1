import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { UnhandledRejectionHandler } from "@/components/UnhandledRejectionHandler";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Brand Campaign Intelligence",
  description: "AI-powered campaign intelligence from mock SEMrush-like data",
};

const CHUNK_RELOAD_KEY = "chunk-load-reload-count";
const CHUNK_RELOAD_MAX = 2;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen text-white`}>
        <Script id="chunk-load-recovery" strategy="beforeInteractive">
          {`
(function() {
  var key = "${CHUNK_RELOAD_KEY}";
  var max = ${CHUNK_RELOAD_MAX};
  function handleChunkError(e) {
    var msg = (e && (e.message || (e.reason && e.reason.message))) || "";
    if (msg.indexOf("ChunkLoadError") === -1 && msg.indexOf("Loading chunk") === -1) return;
    try {
      var n = parseInt(sessionStorage.getItem(key) || "0", 10);
      if (n >= max) return;
      sessionStorage.setItem(key, String(n + 1));
      window.location.reload();
    } catch (err) {}
  }
  window.addEventListener("error", handleChunkError);
  window.addEventListener("unhandledrejection", handleChunkError);
})();
          `}
        </Script>
        <UnhandledRejectionHandler />
        {children}
      </body>
    </html>
  );
}
