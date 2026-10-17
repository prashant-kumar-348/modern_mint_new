import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Modern Mint — Strategy Awaits",
  description:
    "High Interaction Simulation of Leadership, Negotiation & Psychology",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,300..900;1,300..900&display=swap"
          rel="stylesheet"
        />
        <Script
          id="suppress-extension-errors"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(event) {
                if (event.filename && (event.filename.indexOf('chrome-extension') !== -1 || event.filename.indexOf('inpage.js') !== -1)) {
                  event.stopImmediatePropagation();
                  event.preventDefault();
                }
              }, true);
              window.addEventListener('unhandledrejection', function(event) {
                var reason = event.reason;
                if (reason && reason.stack && (reason.stack.indexOf('chrome-extension') !== -1 || reason.stack.indexOf('inpage.js') !== -1)) {
                  event.stopImmediatePropagation();
                  event.preventDefault();
                }
              }, true);
            `,
          }}
        />
      </head>
      <body className="h-full">{children}</body>
    </html>
  );
}
