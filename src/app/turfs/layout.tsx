import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Book Cricket Turfs in Gobi, Sathy & Tamil Nadu | TurfGameDen',
    description:
        "Browse and book premium cricket turfs in Gobi (Gobichettipalayam), Sathyamangalam, Erode & Tiruppur. Real-time slot availability, verified grounds, instant booking. Tamil Nadu's #1 turf platform by Elangkumaran BS.",
    keywords: [
        'turf booking', 'cricket turf booking', 'book cricket turf online',
        'turf booking Gobi', 'cricket turf Gobi', 'turf booking Sathy',
        'turf booking Erode', 'turf booking Tiruppur', 'turf booking Tamil Nadu',
        'best cricket turf Tamil Nadu', 'turf near me', 'cricket ground near me',
        'premium cricket turf', 'night cricket turf', 'TurfGameDen turfs',
        'Elangkumaran BS', 'elangkumaranbs',
    ],
    alternates: { canonical: '/turfs' },
    openGraph: {
        title: 'Book Cricket Turfs Online – Gobi, Sathy & Tamil Nadu | TurfGameDen',
        description:
            "Find and book cricket turfs in Gobi, Sathyamangalam, Erode & Tiruppur. Real-time slots, verified grounds, instant confirmation on Tamil Nadu's #1 platform.",
        url: '/turfs',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Book Cricket Turfs Online | TurfGameDen',
        description:
            'Premium cricket turfs across Tamil Nadu. Instant booking, verified grounds, real-time availability.',
    },
};

export default function TurfsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
