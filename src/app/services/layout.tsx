import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Services – Turf Booking & Owner Partnership | TurfGameDen',
    description:
        'Players: book premium cricket turfs instantly with real-time availability. Turf owners: list your ground and reach thousands of active players across Tamil Nadu. Partner with TurfGameDen – built by Elangkumaran BS.',
    keywords: [
        'turf owner registration', 'list your turf', 'partner with TurfGameDen',
        'cricket turf business Tamil Nadu', 'turf management platform',
        'turf booking for players', 'verified cricket grounds', 'online turf management',
        'TurfGameDen services', 'Elangkumaran BS', 'elangkumaranbs',
    ],
    alternates: { canonical: '/services' },
    openGraph: {
        title: 'Services – Turf Booking & Owner Partnership | TurfGameDen',
        description:
            'Players book instantly. Owners partner to grow their business. Tamil Nadu\'s leading cricket turf platform by Elangkumaran BS.',
        url: '/services',
        type: 'website',
    },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
