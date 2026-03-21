import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Our Services – Turf Booking & Turf Owner Registration | TurfGameDen",
    description:
        "Explore TurfGameDen services: instant online cricket turf booking in Gobi, Sathy, Erode & Tiruppur. Turf owners can register their grounds, manage bookings, and grow revenue with our digital dashboard.",
    keywords: [
        "turf booking services", "turf owner registration", "list your turf online",
        "cricket turf booking Gobi", "turf booking Sathy", "sports venue management",
        "digital turf dashboard", "turf business partner", "TurfGameDen services",
    ],
    alternates: { canonical: "/services" },
    openGraph: {
        title: "TurfGameDen Services – For Players & Turf Owners",
        description: "Instant turf booking for players. Digital management for turf owners. Covering Gobi, Sathy, Erode & Tiruppur.",
        url: "/services",
    },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
