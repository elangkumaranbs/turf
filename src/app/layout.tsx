import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const SITE_URL = "https://turfgameden.com";

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TurfGameDen",
  },
  formatDetection: {
    telephone: false,
  },
  metadataBase: new URL(SITE_URL),
  verification: {
    google: "pnWcbbYFRobhybMtX1aizDsWGMd7aBnw81huBbTSW4w",
  },
  title: {
    default: "TurfGameDen – Book Premium Cricket Turfs in Gobi, Sathy & Tamil Nadu | Online Turf Booking",
    template: "%s | TurfGameDen",
  },
  description:
    "TurfGameDen is Tamil Nadu's #1 online turf booking platform. Book premium cricket turfs in Gobi, Sathy, Erode, Tiruppur & nearby cities. Instant slot booking, verified grounds, floodlit pitches. Home of TurfStar. Developed by Elangkumaran BS.",
  keywords: [
    // Brand
    "TurfGameDen", "Turf Game Den", "GameDen", "TurfStar", "Turf Star",
    // Developer
    "Elangkumaran BS", "elangkumaranbs", "developed by Elangkumaran",
    // Core features
    "turf booking", "online turf booking", "cricket turf booking",
    "book cricket turf online", "instant turf booking", "turf slot booking",
    "turf booking app", "turf booking website", "turf booking platform",
    // Location: Gobi
    "turf booking in Gobi", "cricket turf Gobi", "turf ground Gobi",
    "best turf in Gobi", "Gobi turf booking", "sports turf Gobi",
    // Location: Sathy / Sathyamangalam
    "turf booking in Sathy", "cricket turf Sathy", "turf ground Sathy",
    "best turf in Sathy", "Sathyamangalam turf", "Sathy sports ground",
    // Location: Erode
    "turf booking in Erode", "cricket turf Erode", "best turf Erode",
    "Erode sports ground", "Erode turf ground",
    // Location: Tiruppur
    "turf booking in Tiruppur", "cricket turf Tiruppur", "best turf Tiruppur",
    // Location: Tamil Nadu
    "turf booking Tamil Nadu", "best cricket turf Tamil Nadu",
    "online sports booking Tamil Nadu", "cricket ground booking Tamil Nadu",
    // General
    "premium cricket turf", "night cricket turf", "floodlit turf",
    "box cricket booking", "turf near me", "cricket ground near me",
    "sports turf booking India", "affordable turf booking",
    "turf owner registration", "list your turf",
  ],
  authors: [{ name: "Elangkumaran BS", url: "https://github.com/elangkumaranbs" }],
  creator: "Elangkumaran BS",
  publisher: "TurfGameDen",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "TurfGameDen",
    title: "TurfGameDen – Book Premium Cricket Turfs in Gobi, Sathy & Tamil Nadu",
    description:
      "Tamil Nadu's #1 online turf booking platform. Instant slot booking for cricket turfs in Gobi, Sathy, Erode & Tiruppur. Verified grounds with floodlights. Home of TurfStar.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TurfGameDen – Premium Cricket Turf Booking",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TurfGameDen – Book Premium Cricket Turfs Online",
    description:
      "Book premium cricket turfs in Gobi, Sathy & Tamil Nadu. Instant slot booking, verified grounds, night play. Developed by Elangkumaran BS.",
    images: ["/og-image.png"],
  },
  category: "Sports",
};

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "TurfGameDen",
      url: SITE_URL,
      description: "Tamil Nadu's #1 online turf booking platform for cricket turfs in Gobi, Sathy, Erode & Tiruppur.",
      publisher: { "@type": "Organization", name: "TurfGameDen" },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/turfs?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "LocalBusiness",
      name: "TurfGameDen",
      url: SITE_URL,
      description: "Book premium cricket turfs online in Gobi, Sathy, Erode and across Tamil Nadu. Instant booking, verified grounds, floodlit pitches.",
      image: `${SITE_URL}/og-image.png`,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Gobi",
        addressRegion: "Tamil Nadu",
        addressCountry: "IN",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: "11.4500",
        longitude: "77.4333",
      },
      areaServed: [
        { "@type": "City", name: "Gobi" },
        { "@type": "City", name: "Sathyamangalam" },
        { "@type": "City", name: "Erode" },
        { "@type": "City", name: "Tiruppur" },
      ],
      sameAs: [],
      priceRange: "₹₹",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
