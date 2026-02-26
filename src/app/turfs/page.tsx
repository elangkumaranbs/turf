'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { getTurfs, Turf } from '@/lib/firebase/firestore';
import { MapPin, ArrowRight, Search, SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import Image from 'next/image';

type SortOption = 'default' | 'price-low' | 'price-high' | 'name-az' | 'name-za';

export default function TurfsPage() {
    const [turfs, setTurfs] = useState<Turf[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('all');
    const [sortBy, setSortBy] = useState<SortOption>('default');

    useEffect(() => {
        const fetchTurfs = async () => {
            const data = await getTurfs();
            setTurfs(data);
            setLoading(false);
        };
        fetchTurfs();
    }, []);

    // Extract unique locations for the dropdown
    const locations = useMemo(() => {
        const locs = [...new Set(turfs.map(t => t.location))].sort();
        return locs;
    }, [turfs]);

    // Filter & sort turfs
    const filteredTurfs = useMemo(() => {
        let result = turfs.filter((turf) => {
            const query = searchQuery.toLowerCase();
            const matchesSearch = turf.name.toLowerCase().includes(query) || turf.location.toLowerCase().includes(query);
            const matchesLocation = selectedLocation === 'all' || turf.location === selectedLocation;
            return matchesSearch && matchesLocation;
        });

        // Sort
        switch (sortBy) {
            case 'price-low':
                result = [...result].sort((a, b) => a.pricePerHour - b.pricePerHour);
                break;
            case 'price-high':
                result = [...result].sort((a, b) => b.pricePerHour - a.pricePerHour);
                break;
            case 'name-az':
                result = [...result].sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-za':
                result = [...result].sort((a, b) => b.name.localeCompare(a.name));
                break;
        }

        return result;
    }, [turfs, searchQuery, selectedLocation, sortBy]);

    const hasActiveFilters = selectedLocation !== 'all' || sortBy !== 'default' || searchQuery !== '';

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedLocation('all');
        setSortBy('default');
    };

    return (
        <main className="min-h-screen bg-[#0a0a0a]">
            <Navbar />
            <div className="container mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-12">
                <div className="mb-8 sm:mb-12">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Courts</h1>
                    <p className="text-gray-400 max-w-2xl text-sm sm:text-base">Browse our selection of top-tier cricket turfs. From matting to astro-turf, find the perfect pitch for your game.</p>
                </div>

                {/* Filter Bar */}
                <div className="mb-8 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-11 pl-11 pr-4 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-gray-500 focus:border-[var(--turf-green)] focus:ring-1 focus:ring-[var(--turf-green)] focus:outline-none transition-all"
                            />
                        </div>

                        {/* Location Dropdown */}
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <select
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                className="h-11 appearance-none rounded-xl border border-white/10 bg-white/5 pl-9 pr-10 text-sm text-white focus:border-[var(--turf-green)] focus:outline-none transition-all cursor-pointer min-w-[180px]"
                            >
                                <option value="all" className="bg-[#1a1a1a]">All Locations</option>
                                {locations.map(loc => (
                                    <option key={loc} value={loc} className="bg-[#1a1a1a]">{loc}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative">
                            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="h-11 appearance-none rounded-xl border border-white/10 bg-white/5 pl-9 pr-10 text-sm text-white focus:border-[var(--turf-green)] focus:outline-none transition-all cursor-pointer min-w-[180px]"
                            >
                                <option value="default" className="bg-[#1a1a1a]">Sort By</option>
                                <option value="price-low" className="bg-[#1a1a1a]">Price: Low → High</option>
                                <option value="price-high" className="bg-[#1a1a1a]">Price: High → Low</option>
                                <option value="name-az" className="bg-[#1a1a1a]">Name: A → Z</option>
                                <option value="name-za" className="bg-[#1a1a1a]">Name: Z → A</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Active filters summary */}
                    {hasActiveFilters && (
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs text-gray-500">{filteredTurfs.length} result{filteredTurfs.length !== 1 ? 's' : ''}</span>
                            {selectedLocation !== 'all' && (
                                <span className="inline-flex items-center gap-1 text-xs bg-[var(--turf-green)]/10 text-[var(--turf-green)] px-2.5 py-1 rounded-full border border-[var(--turf-green)]/20">
                                    <MapPin size={10} /> {selectedLocation}
                                    <button onClick={() => setSelectedLocation('all')} className="ml-1 hover:text-white"><X size={10} /></button>
                                </span>
                            )}
                            {sortBy !== 'default' && (
                                <span className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/20">
                                    <SlidersHorizontal size={10} /> {sortBy === 'price-low' ? 'Price ↑' : sortBy === 'price-high' ? 'Price ↓' : sortBy === 'name-az' ? 'A→Z' : 'Z→A'}
                                    <button onClick={() => setSortBy('default')} className="ml-1 hover:text-white"><X size={10} /></button>
                                </span>
                            )}
                            <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-white transition-colors underline">
                                Clear all
                            </button>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {[1, 2, 3].map(i => (
                            <GlassCard key={i} className="h-96 animate-pulse bg-white/5" />
                        ))}
                    </div>
                ) : filteredTurfs.length === 0 ? (
                    <div className="text-center py-16">
                        <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl text-white font-medium mb-2">No courts found</h3>
                        <p className="text-gray-400 mb-4">Try adjusting your filters or search query.</p>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="text-[var(--turf-green)] hover:underline text-sm font-medium">
                                Clear all filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {filteredTurfs.map((turf) => (
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

                                <div className="p-4 sm:p-6 space-y-4">
                                    <div>
                                        <h2 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-[var(--turf-green)] transition-colors">{turf.name}</h2>
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
