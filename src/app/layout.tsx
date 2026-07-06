import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import "./material-symbols.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
      className={`${inter.variable} ${plusJakartaSans.variable} ${ibmPlexMono.variable}`}
    >
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        {/* Blocking theme script — runs before first paint so dark-mode users never see a light flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');document.documentElement.setAttribute('data-theme',t||'light')}catch(e){}})()`,
          }}
        />
        {/* Preconnect so the icon font's CDN socket is warm before the preload kicks off */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* The two icon font files (outline + filled, subsetted to only the ~130
            icon names this app uses — see src/app/material-symbols.css) are
            preloaded so they're fetched immediately in parallel with everything
            else, not discovered late via CSSOM parsing. The preconnect above
            already covers this origin; the lint rule just doesn't recognize
            rel="preload" as satisfied by a separate preconnect tag. */}
        {/* eslint-disable-next-line @next/next/google-font-preconnect */}
        <link rel="preload" as="font" type="font/woff2" crossOrigin="" href="https://fonts.gstatic.com/l/font?kit=syl0-zNym6YjUruM-QrEh7-nyTnjDwKNJ_190FjpZIvDmUSVOK7BDB_Qb9vUSzq3wzLK-P0J-V_Zs-QtQth3-jOcbTCVpeRL2w5rwZu2rIelXxeRMLRQKvFr6zUORCJPG11B6QXEbj0cWMJfT79ZuwU&skey=70ddea8fe54d532e&v=v356" />
        {/* eslint-disable-next-line @next/next/google-font-preconnect */}
        <link rel="preload" as="font" type="font/woff2" crossOrigin="" href="https://fonts.gstatic.com/l/font?kit=syl0-zNym6YjUruM-QrEh7-nyTnjDwKNJ_190FjpZIvDmUSVOK7BDJ_vb9vUSzq3wzLK-P0J-V_Zs-QtQth3-jOcbTCVpeRL2w5rwZu2rIelXxeRMLRQKvFr6zUORCJPG11B6QXEbj0cWMJfT79ZuwU&skey=70ddea8fe54d532e&v=v356" />
      </head>
      <body className="antialiased">
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
