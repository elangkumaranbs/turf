import { Metadata } from 'next';
import { getTurfById } from '@/lib/firebase/firestore';
import { getReviewsForTurf } from '@/lib/firebase/reviews';

const SITE_URL = 'https://turfgameden.com';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const turf = await getTurfById(resolvedParams.id);
    
    if (!turf) {
        return {
            title: 'Turf Not Found | TurfGameDen',
        };
    }

    const { name, city, address, description, images } = turf;
    const locationStr = [address, city].filter(Boolean).join(', ');
    const title = `Book ${name} in ${city} - TurfGameDen`;
    const ogImage = images && images.length > 0 ? images[0] : `${SITE_URL}/og-image.png`;

    return {
        title,
        description: description || `Book slots at ${name}, located at ${locationStr}. Premium floodlit cricket turf.`,
        openGraph: {
            title,
            description: description || `Book slots at ${name}, located at ${locationStr}.`,
            images: [
                {
                    url: ogImage,
                },
            ],
        },
    };
}

import { BreadcrumbJsonLd } from '@/components/SEO/Breadcrumb';

export default async function TurfLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = await params;
    const [turf, reviews] = await Promise.all([
        getTurfById(resolvedParams.id),
        getReviewsForTurf(resolvedParams.id)
    ]);

    const breadcrumbItems = [
        { name: 'Home', item: SITE_URL },
        { name: 'Turfs', item: `${SITE_URL}/turfs` },
        { name: turf?.name || 'Details', item: `${SITE_URL}/turfs/${resolvedParams.id}` }
    ];

    let jsonLd: Record<string, any> | null = null;

    if (turf) {
        jsonLd = {
            "@context": "https://schema.org",
            "@type": "SportsActivityLocation",
            name: turf.name,
            image: turf.images?.[0] || `${SITE_URL}/og-image.png`,
            description: turf.description,
            address: {
                "@type": "PostalAddress",
                streetAddress: turf.address,
                addressLocality: turf.city,
                addressRegion: "Tamil Nadu",
                addressCountry: "IN",
            },
            ...(turf.lat && turf.lng && {
                geo: {
                    "@type": "GeoCoordinates",
                    latitude: turf.lat,
                    longitude: turf.lng,
                }
            }),
            priceRange: `₹${turf.pricePerHour}/hr`,
        };

        if (turf.averageRating && turf.reviewCount) {
             jsonLd.aggregateRating = {
                 "@type": "AggregateRating",
                 ratingValue: turf.averageRating.toString(),
                 reviewCount: turf.reviewCount.toString(),
             };
        }

        // Add individual reviews to JSON-LD (limit to 10 for SEO)
        if (reviews && reviews.length > 0) {
            jsonLd.review = reviews.slice(0, 10).map(r => ({
                "@type": "Review",
                "author": {
                    "@type": "Person",
                    "name": r.userName
                },
                "datePublished": r.createdAt,
                "reviewBody": r.comment,
                "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": r.rating.toString(),
                    "bestRating": "5"
                }
            }));
        }
    }

    return (
        <>
            <BreadcrumbJsonLd items={breadcrumbItems} />
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            {children}
        </>
    );
}
