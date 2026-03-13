'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { getTurfs, Turf, getLocations } from '@/lib/firebase/firestore';
import { haversineDistance, formatDistance } from '@/lib/geocoding';
import { MapPin, ArrowRight, Search, SlidersHorizontal, ChevronDown, X, Star, Navigation, Loader2, Navigation2 } from 'lucide-react';
import Image from 'next/image';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';

type SortOption = 'default' | 'price-low' | 'price-high' | 'name-az' | 'name-za' | 'nearest';

interface UserLocation {
    lat: number;
    lng: number;
}

export default function TurfsPage() {
    const [turfs, setTurfs] = useState<Turf[]>([]);
    const [baseLocations, setBaseLocations] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('all');
    const [sortBy, setSortBy] = useState<SortOption>('default');

    // Geolocation state
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [geoLoading, setGeoLoading] = useState(false);
    const [geoError, setGeoError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const [turfsData, locationsData] = await Promise.all([
                getTurfs(),
                getLocations()
            ]);
            setTurfs(turfsData);
            setBaseLocations(locationsData.map(loc => loc.name));
            setLoading(false);
        };
        fetchData();
    }, []);

    // Request user's location
    const requestLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setGeoError('Geolocation is not supported by your browser.');
            return;
        }
        setGeoLoading(true);
        setGeoError('');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setSortBy('nearest');
                setGeoLoading(false);
            },
            (err) => {
                setGeoError(
                    err.code === 1
                        ? 'Location access denied. Please allow location in browser settings.'
                        : 'Could not get your location. Try again.'
                );
                setGeoLoading(false);
            },
            { timeout: 10000 }
        );
    }, []);

    // Auto-request location on page load
    useEffect(() => {
        requestLocation();
    }, [requestLocation]);

    // Auto-sort by nearest when location becomes available
    useEffect(() => {
        if (userLocation) setSortBy('nearest');
    }, [userLocation]);

    // Distance map: turfId → km
    const distanceMap = useMemo(() => {
        if (!userLocation) return new Map<string, number>();
        const map = new Map<string, number>();
        turfs.forEach(turf => {
            if (turf.lat != null && turf.lng != null) {
                map.set(turf.id, haversineDistance(userLocation.lat, userLocation.lng, turf.lat, turf.lng));
            }
        });
        return map;
    }, [turfs, userLocation]);

    // Extract unique cities
    const locations = useMemo(() => {
        const dynamicCities = turfs.map(t => t.city || t.location || '').filter(Boolean);
        return [...new Set([...baseLocations, ...dynamicCities])].sort();
    }, [turfs, baseLocations]);

    // Filter & sort turfs
    const filteredTurfs = useMemo(() => {
        let result = turfs.filter((turf) => {
            const query = searchQuery.toLowerCase();
            const displayLocation = [turf.address, turf.city].filter(Boolean).join(', ') || turf.location || '';
            const matchesSearch = turf.name.toLowerCase().includes(query) || displayLocation.toLowerCase().includes(query);
            const turfCity = turf.city || turf.location || '';
            const matchesLocation = selectedLocation === 'all' || turfCity === selectedLocation;
            return matchesSearch && matchesLocation;
        });

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
            case 'nearest':
                result = [...result].sort((a, b) => {
                    const da = distanceMap.get(a.id) ?? Infinity;
                    const db = distanceMap.get(b.id) ?? Infinity;
                    return da - db;
                });
                break;
        }

        return result;
    }, [turfs, searchQuery, selectedLocation, sortBy, distanceMap]);

    const hasActiveFilters = selectedLocation !== 'all' || sortBy !== 'default' || searchQuery !== '';

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedLocation('all');
        setSortBy('default');
    };

    return (
        <main className="min-h-screen bg-[var(--background)] pb-12 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[var(--turf-green)]/10 rounded-full blur-[120px] pointer-events-none animate-float" />
            <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none animate-float" style={{ animationDelay: '2s' }} />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none mix-blend-overlay" />

            <Navbar />

            <div className="container mx-auto px-4 sm:px-6 pt-28 sm:pt-36 pb-12 relative z-10">
                <div className="mb-10 sm:mb-14 text-center sm:text-left animate-fade-up">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight drop-shadow-md">
                        Premium <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--turf-green)] to-emerald-400">Courts</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl text-base sm:text-lg mx-auto sm:mx-0 font-medium">
                        Browse our curated selection of top-tier cricket turfs. Find the perfect pitch near you, book instantly, and elevate your game.
                    </p>
                </div>

                {/* Filter Bar */}
                <GlassCard className="mb-4 p-2 border-white/10 animate-fade-up" style={{ animationDelay: '0.2s' }}>
                    <div className="flex flex-col lg:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search by name or location..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-12 lg:h-14 pl-12 pr-4 rounded-xl border border-transparent bg-white/5 text-white text-base placeholder:text-gray-500 focus:border-[var(--turf-green)]/50 focus:bg-black/40 focus:ring-4 focus:ring-[var(--turf-green)]/10 focus:outline-none transition-all shadow-inner"
                            />
                        </div>

                        {/* Location Dropdown */}
                        <div className="relative flex-1 lg:max-w-[220px]">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            <select
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                className="w-full h-12 lg:h-14 appearance-none rounded-xl border border-transparent bg-white/5 pl-12 pr-10 text-base text-white focus:border-[var(--turf-green)]/50 focus:bg-black/40 focus:ring-4 focus:ring-[var(--turf-green)]/10 focus:outline-none transition-all cursor-pointer shadow-inner"
                            >
                                <option value="all" className="bg-[#111] text-white">All Locations</option>
                                {locations.map(loc => (
                                    <option key={loc} value={loc} className="bg-[#111] text-white">{loc}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative flex-1 lg:max-w-[220px]">
                            <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="w-full h-12 lg:h-14 appearance-none rounded-xl border border-transparent bg-white/5 pl-12 pr-10 text-base text-white focus:border-[var(--turf-green)]/50 focus:bg-black/40 focus:ring-4 focus:ring-[var(--turf-green)]/10 focus:outline-none transition-all cursor-pointer shadow-inner"
                            >
                                <option value="default" className="bg-[#111] text-white">Sort By (Default)</option>
                                <option value="nearest" className="bg-[#111] text-white">📍 Nearest First</option>
                                <option value="price-low" className="bg-[#111] text-white">Price: Low to High</option>
                                <option value="price-high" className="bg-[#111] text-white">Price: High to Low</option>
                                <option value="name-az" className="bg-[#111] text-white">Name: A to Z</option>
                                <option value="name-za" className="bg-[#111] text-white">Name: Z to A</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Near Me Button */}
                        <button
                            onClick={requestLocation}
                            disabled={geoLoading}
                            title={userLocation ? 'Location active — click to refresh' : 'Find turfs near me'}
                            className={`h-12 lg:h-14 px-5 rounded-xl font-bold text-sm flex items-center gap-2 border transition-all shrink-0 ${
                                userLocation
                                    ? 'bg-[var(--turf-green)]/20 border-[var(--turf-green)]/50 text-[var(--turf-green)] shadow-[0_0_15px_rgba(46,204,113,0.2)]'
                                    : 'bg-white/5 border-white/10 text-gray-300 hover:border-[var(--turf-green)]/40 hover:text-[var(--turf-green)] hover:bg-[var(--turf-green)]/10'
                            }`}
                        >
                            {geoLoading ? (
                                <Loader2 size={17} className="animate-spin shrink-0" />
                            ) : userLocation ? (
                                <Navigation2 size={17} className="shrink-0 fill-current" />
                            ) : (
                                <Navigation size={17} className="shrink-0" />
                            )}
                            <span className="whitespace-nowrap">
                                {geoLoading ? 'Locating...' : userLocation ? 'Near Me ✓' : 'Near Me'}
                            </span>
                        </button>
                    </div>

                    {/* Geo error */}
                    {geoError && (
                        <p className="mt-2 px-3 text-xs text-red-400 flex items-center gap-1.5">
                            <X size={12} />{geoError}
                        </p>
                    )}
                </GlassCard>

                {/* Active filters summary */}
                <div className="mb-8 min-h-[28px] animate-fade-up" style={{ animationDelay: '0.3s' }}>
                    {(hasActiveFilters || userLocation) && (
                        <div className="flex items-center gap-3 flex-wrap bg-white/[0.02] p-2.5 rounded-xl border border-white/5 w-fit">
                            <span className="text-sm font-medium text-emerald-400 px-2">{filteredTurfs.length} result{filteredTurfs.length !== 1 ? 's' : ''} found</span>

                            {userLocation && (
                                <span className="inline-flex items-center gap-1.5 text-xs bg-[var(--turf-green)]/10 text-[var(--turf-green)] px-3 py-1.5 rounded-full border border-[var(--turf-green)]/20 font-medium tracking-wide">
                                    <Navigation2 size={12} className="fill-current opacity-70" /> Near Me active
                                    <button onClick={() => { setUserLocation(null); setSortBy('default'); }} className="ml-1 hover:text-white hover:bg-[var(--turf-green)]/20 rounded-full p-0.5 transition-colors"><X size={12} /></button>
                                </span>
                            )}

                            {selectedLocation !== 'all' && (
                                <span className="inline-flex items-center gap-1.5 text-xs bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-full border border-blue-500/20 font-medium tracking-wide">
                                    <MapPin size={12} className="opacity-70" /> {selectedLocation}
                                    <button onClick={() => setSelectedLocation('all')} className="ml-1 hover:text-white hover:bg-blue-500/20 rounded-full p-0.5 transition-colors"><X size={12} /></button>
                                </span>
                            )}

                            {sortBy !== 'default' && sortBy !== 'nearest' && (
                                <span className="inline-flex items-center gap-1.5 text-xs bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-full border border-purple-500/20 font-medium tracking-wide">
                                    <SlidersHorizontal size={12} className="opacity-70" /> {sortBy === 'price-low' ? 'Price: Low-High' : sortBy === 'price-high' ? 'Price: High-Low' : sortBy === 'name-az' ? 'Name: A-Z' : 'Name: Z-A'}
                                    <button onClick={() => setSortBy('default')} className="ml-1 hover:text-white hover:bg-purple-500/20 rounded-full p-0.5 transition-colors"><X size={12} /></button>
                                </span>
                            )}

                            <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-red-400 transition-colors font-medium px-2 flex items-center gap-1 group">
                                <span className="group-hover:underline">Clear all</span>
                            </button>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
                    </div>
                ) : filteredTurfs.length === 0 ? (
                    <GlassCard className="text-center py-20 px-4 border-white/5 bg-white/[0.02] animate-fade-up flex flex-col items-center justify-center max-w-2xl mx-auto mt-10">
                        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                            <Search className="w-10 h-10 text-gray-500" />
                        </div>
                        <h3 className="text-2xl lg:text-3xl text-white font-bold mb-3 tracking-tight">No courts found</h3>
                        <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">We couldn't find any courts matching your current filters.</p>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="bg-gradient-to-r from-[var(--turf-green)] to-emerald-500 text-black px-8 py-3.5 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(46,204,113,0.4)] hover:scale-105 transition-all text-lg">
                                Clear all filters
                            </button>
                        )}
                    </GlassCard>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
                        {filteredTurfs.map((turf, index) => {
                            const distance = distanceMap.get(turf.id);
                            return (
                                <GlassCard
                                    key={turf.id}
                                    className="overflow-hidden p-0 group hover:border-[var(--turf-green)]/40 hover:shadow-[0_0_30px_rgba(46,204,113,0.15)] hover:-translate-y-2 transition-all duration-300 animate-fade-up flex flex-col bg-white/[0.03]"
                                    style={{ animationDelay: `${(index % 6) * 0.1 + 0.3}s` }}
                                >
                                    <Link href={`/turfs/${turf.id}`} className="block relative h-56 sm:h-64 w-full overflow-hidden">
                                        <Image
                                            src={turf.images?.[0] || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
                                            alt={turf.name}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                                        {/* Top Badges */}
                                        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                                            <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-lg flex items-center gap-1.5">
                                                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                                <span className="text-white text-xs font-bold leading-none">4.8</span>
                                            </div>
                                            <div className="bg-[var(--turf-green)]/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[var(--turf-green)]/30 text-[var(--turf-green)] text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(46,204,113,0.2)]">
                                                {turf.wicketType} Pitch
                                            </div>
                                        </div>

                                        {/* Distance Badge — bottom of image */}
                                        {distance != null && (
                                            <div className="absolute bottom-4 left-4">
                                                <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[var(--turf-green)]/30 shadow-lg">
                                                    <Navigation2 size={12} className="text-[var(--turf-green)] fill-current shrink-0" />
                                                    <span className="text-[var(--turf-green)] text-xs font-bold">{formatDistance(distance)}</span>
                                                    <span className="text-gray-400 text-xs">away</span>
                                                </div>
                                            </div>
                                        )}
                                    </Link>

                                    <div className="p-5 sm:p-6 sm:pt-5 flex-1 flex flex-col justify-between z-10 relative bg-gradient-to-t from-black/80 to-transparent -mt-2">
                                        <div>
                                            <Link href={`/turfs/${turf.id}`}>
                                                <h2 className="text-xl sm:text-2xl font-black text-white mb-2 group-hover:text-[var(--turf-green)] transition-colors leading-tight line-clamp-1">{turf.name}</h2>
                                            </Link>
                                            <div className="flex items-center text-gray-400 text-sm font-medium mb-4">
                                                <MapPin className="w-4 h-4 mr-1.5 text-emerald-500 shrink-0" />
                                                <span className="truncate">{[turf.address, turf.city].filter(Boolean).join(', ') || turf.location || 'Location not specified'}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-5 border-t border-white/10 mt-auto group-hover:border-[var(--turf-green)]/30 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-0.5">Starting at</span>
                                                <div className="flex items-end gap-1">
                                                    <span className="text-[var(--turf-green)] text-xl font-black leading-none">₹{turf.pricePerHour}</span>
                                                    <span className="text-gray-400 text-sm font-medium mb-0.5">/hr</span>
                                                </div>
                                            </div>
                                            <Link href={`/turfs/${turf.id}`}>
                                                <button className="bg-white/5 hover:bg-[var(--turf-green)] text-white hover:text-black border border-white/10 hover:border-transparent px-5 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 group/btn hover:shadow-[0_0_15px_rgba(46,204,113,0.4)]">
                                                    Book details
                                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                </GlassCard>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
