import type { Metadata, Viewport } from "next";
import { Open_Sans, Ubuntu } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Script from "next/script";
import { ConsentGatedAnalytics } from "@/components/ConsentGatedAnalytics";
import { CookieConsent } from "@/components/CookieConsent";
import "./globals.css";

// Body/UI font — see --font-sans in globals.css's @theme block.
const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Headings/display font — see --font-display in globals.css's @theme block.
const ubuntu = Ubuntu({
  variable: "--font-ubuntu",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Smile FX Traders",
  description: "Trade smart money. Together.",
};

// Explicit instead of relying on Next's implicit default — guarantees pinch-zoom
// is never accidentally disabled, and viewport-fit=cover enables the safe-area-inset-*
// env() vars used by the mobile bottom tab bar / Modal / Drawer.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${openSans.variable} ${ubuntu.variable}`}
    >
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        {/* Blocking theme script — runs before first paint so dark-mode users never see a light flash */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');document.documentElement.setAttribute('data-theme',t||'light')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false}>
          {children}
          <CookieConsent />
        </ThemeProvider>
        <ConsentGatedAnalytics />
      </body>
    </html>
  );
}
