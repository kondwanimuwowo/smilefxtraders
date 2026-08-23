import type { Metadata, Viewport } from "next";
import { Open_Sans, Ubuntu } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { SITE, SITE_URL } from "@/lib/seo";
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
  // metadataBase is what lets Next resolve every relative OG image, canonical
  // and alternate into an absolute URL. Without it those tags either go missing
  // or ship as paths, which no crawler or social scraper can follow.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE.name} | ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  referrer: "origin-when-cross-origin",
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: SITE.locale,
    url: SITE_URL,
    title: `${SITE.name} | ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} | ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
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
      </head>
      <body className="antialiased">
        {/* Blocking theme script — runs before first paint so dark-mode users never see a light flash */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');document.documentElement.setAttribute('data-theme',t||'light')}catch(e){}})()`,
          }}
        />
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false}>
          {children}
          <CookieConsent />
        </ThemeProvider>
        <ConsentGatedAnalytics />
      </body>
    </html>
  );
}
