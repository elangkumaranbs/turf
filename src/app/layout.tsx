import type { Metadata, Viewport } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Footer } from "@/components/Footer";
import { FCMHandler } from "@/components/FCMHandler";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
});

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
    default: "TurfGameDen - Book Premium Cricket Turfs in Tamil Nadu",
    template: "%s | TurfGameDen",
  },
    keywords: [
    // Brand
    "TurfGameDen", "Turf Game Den", "GameDen", "TurfStar", "Turf Star",
    // Developer – all variants
    "Elangkumaran BS", "elangkumaranbs", "Elangkumaran", "elangkumaran bs",
    "elangkumaran developer", "built by elangkumaran", "developed by elangkumaran bs",
    "elangkumaran bs developer", "elangkumaranbs github", "elangkumaran web developer",
    // Core features
    "turf booking", "online turf booking", "cricket turf booking",
    "book cricket turf online", "instant turf booking", "turf slot booking",
    "turf booking app", "turf booking website", "turf booking platform",
    // Location: Gobi
    "turf booking in Gobi", "cricket turf Gobi", "turf ground Gobi",
    "best turf in Gobi", "Gobi turf booking", "sports turf Gobi",
    "gobichettipalayam turf", "gobichettipalayam cricket ground",
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
    // Reviews
    "cricket turf reviews", "turf rating Tamil Nadu", "verified turf reviews",
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
      email: "turfgameden@gmail.com",
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
      sameAs: [
          "https://github.com/elangkumaranbs"
      ],
      priceRange: "₹₹",
      contactPoint: {
        "@type": "ContactPoint",
        "contactType": "customer support",
        "email": "turfgameden@gmail.com"
      }
    },
    {
        "@type": "Person",
        "name": "Elangkumaran BS",
        "alternateName": ["Elangkumaran", "elangkumaranbs", "elangkumaran bs"],
        "url": "https://github.com/elangkumaranbs",
        "sameAs": ["https://github.com/elangkumaranbs"],
        "jobTitle": "Full-Stack Web Developer",
        "description": "Elangkumaran BS (elangkumaranbs) is the developer and creator of TurfGameDen, Tamil Nadu's leading cricket turf booking platform. Built with Next.js, Firebase, and Razorpay payment integration.",
        "knowsAbout": ["Web Development", "Next.js", "React", "Firebase", "TypeScript", "Sports Technology", "Turf Booking Platforms"]
    }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${outfit.variable} ${plusJakarta.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <FCMHandler />
            {children}
            <Footer />
          </AuthProvider>
        </ThemeProvider>
        <GoogleAnalytics gaId="G-3DMCN7C2Z8" />
      </body>
    </html>
  );
}
