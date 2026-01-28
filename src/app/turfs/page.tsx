'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { getTurfs, Turf } from '@/lib/firebase/firestore';
import { MapPin, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function TurfsPage() {
    const [turfs, setTurfs] = useState<Turf[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTurfs = async () => {
            const data = await getTurfs();
            setTurfs(data);
            setLoading(false);
        };
        fetchTurfs();
    }, []);

    return (
        <main className="min-h-screen bg-[#0a0a0a]">
            <Navbar />
            <div className="container mx-auto px-6 pt-32 pb-12">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-white mb-4">Our Premium Courts</h1>
                    <p className="text-gray-400 max-w-2xl">Browse our selection of top-tier cricket turfs. From matting to astro-turf, find the perfect pitch for your game.</p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <GlassCard key={i} className="h-96 animate-pulse bg-white/5" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {turfs.map((turf) => (
                            <GlassCard key={turf.id} className="overflow-hidden p-0 group" hoverEffect>
                                <div className="relative h-48 w-full group-hover:scale-105 transition-transform duration-500">
                                    <Image
                                        src={turf.images[0]}
                                        alt={turf.name}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-[var(--turf-green)] uppercase border border-[var(--turf-green)]/20">
                                        {turf.wicketType} Wicket
                                    </div>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-2 group-hover:text-[var(--turf-green)] transition-colors">{turf.name}</h2>
                                        <div className="flex items-center text-gray-400 text-sm">
                                            <MapPin className="w-4 h-4 mr-1 text-[var(--turf-green)]" />
                                            {turf.location}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">Price</p>
                                            <p className="text-[var(--turf-green)] font-semibold">₹{turf.pricePerHour}/hr</p>
                                        </div>
                                        <Link href={`/turfs/${turf.id}`}>
                                            <Button variant="secondary" size="sm" className="gap-2">
                                                View Details <ArrowRight size={16} />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
