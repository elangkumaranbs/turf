import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Browse Premium Cricket Turfs – Book Instantly in Gobi, Sathy & Tamil Nadu",
    description:
        "Explore and book the best cricket turfs near you. TurfGameDen lists verified turfs in Gobi, Sathy, Erode, Tiruppur & across Tamil Nadu with real-time availability, pricing, and instant slot booking.",
    keywords: [
        "book cricket turf", "turf near me", "cricket ground near me",
        "turf listing Gobi", "turf listing Sathy", "turf listing Erode",
        "affordable turf booking", "night cricket turf", "floodlit turf booking",
        "premium turf Tamil Nadu", "TurfStar Gobi", "box cricket near me",
    ],
    alternates: { canonical: "/turfs" },
    openGraph: {
        title: "Explore & Book Premium Cricket Turfs | TurfGameDen",
        description: "Find the best turf near you in Gobi, Sathy, Erode & Tiruppur. Book instantly with real-time slot availability.",
        url: "/turfs",
    },
};

export default function TurfsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
