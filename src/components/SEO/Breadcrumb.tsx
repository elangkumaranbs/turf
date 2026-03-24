import React from 'react';

interface BreadcrumbItem {
    name: string;
    item: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export const BreadcrumbJsonLd: React.FC<BreadcrumbProps> = ({ items }) => {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.item
        }))
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
};
