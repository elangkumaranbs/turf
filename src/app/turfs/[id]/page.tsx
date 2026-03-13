'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { getTurfById, Turf } from '@/lib/firebase/firestore';
import { MapPin, CheckCircle, ChevronLeft, ChevronRight, X, ZoomIn, Images } from 'lucide-react';
import Image from 'next/image';
import { createBooking } from '@/lib/firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { SlotPicker } from '@/components/SlotPicker';
import { useRouter, useSearchParams } from 'next/navigation';

export default function TurfDetailsPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const router = useRouter();
    const [turf, setTurf] = useState<Turf | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const initialDate = searchParams.get('date');
    const initialTime = searchParams.get('time');

    useEffect(() => {
        const fetchTurf = async () => {
            if (typeof params.id === 'string') {
                const data = await getTurfById(params.id);
                setTurf(data);
            }
            setLoading(false);
        };
        fetchTurf();
    }, [params.id]);

    // Keyboard navigation for lightbox
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!lightboxOpen || !turf) return;
        if (e.key === 'ArrowRight') setSelectedImage(i => (i + 1) % turf.images.length);
        if (e.key === 'ArrowLeft') setSelectedImage(i => (i - 1 + turf.images.length) % turf.images.length);
        if (e.key === 'Escape') setLightboxOpen(false);
    }, [lightboxOpen, turf]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Lock body scroll when lightbox open
    useEffect(() => {
        document.body.style.overflow = lightboxOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [lightboxOpen]);

    const handleBooking = async (date: string, times: string[]) => {
        if (!turf || !user) return;
        try {
            await createBooking({
                userId: user.uid,
                turfId: turf.id,
                date,
                times,
                duration: 60 * times.length
            });
            alert('Booking Confirmed!');
            router.push('/dashboard');
        } catch (error: any) {
            console.error('Booking error:', error);
            if (error.code === 'permission-denied') {
                alert('Permission Denied: Please check Firestore Security Rules.');
            } else {
                alert(`Failed to book slot: ${error.message}`);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-[var(--turf-green)] border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 font-medium">Loading turf details...</p>
                </div>
            </div>
        );
    }

    if (!turf) {
        return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Turf not found</div>;
    }

    const images = turf.images || [];
    const hasMultiple = images.length > 1;

    const prevImage = () => setSelectedImage(i => (i - 1 + images.length) % images.length);
    const nextImage = () => setSelectedImage(i => (i + 1) % images.length);

    return (
        <main className="min-h-screen bg-[var(--background)] relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--turf-green)]/10 rounded-full blur-[120px] pointer-events-none animate-float" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[130px] pointer-events-none animate-float" style={{ animationDelay: '2s' }} />

            <Navbar />

            <div className="container mx-auto px-4 sm:px-6 pt-28 sm:pt-36 pb-16 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">

                    {/* ── Gallery ── */}
                    <div className="space-y-4 animate-fade-up">

                        {/* Main Image */}
                        <div
                            className="relative h-[350px] sm:h-[450px] lg:h-[500px] w-full rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] group cursor-pointer"
                            onClick={() => setLightboxOpen(true)}
                        >
                            <Image
                                src={images[selectedImage]}
                                alt={turf.name}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                            {/* Image counter badge */}
                            {hasMultiple && (
                                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                                    <Images size={12} />
                                    {selectedImage + 1} / {images.length}
                                </div>
                            )}

                            {/* Zoom hint */}
                            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/50 backdrop-blur-md border border-white/10 text-white/70 text-xs px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <ZoomIn size={12} /> View fullscreen
                            </div>

                            {/* Arrow buttons on main image */}
                            {hasMultiple && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-[var(--turf-green)] hover:border-[var(--turf-green)] transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-[var(--turf-green)] hover:border-[var(--turf-green)] transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnail strip */}
                        {hasMultiple && (
                            <div className="flex gap-3 overflow-x-auto pb-2 pt-1 snap-x scrollbar-hide">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={`relative flex-shrink-0 snap-start rounded-2xl overflow-hidden border-2 transition-all duration-300
                                            ${selectedImage === idx
                                                ? 'w-24 h-24 sm:w-28 sm:h-28 border-[var(--turf-green)] shadow-[0_0_20px_rgba(46,204,113,0.4)] scale-105'
                                                : 'w-20 h-20 sm:w-24 sm:h-24 border-white/10 opacity-50 hover:opacity-100 hover:border-white/30 hover:scale-102'}`}
                                    >
                                        <Image src={img} alt={`Photo ${idx + 1}`} fill className="object-cover" />
                                        {selectedImage === idx && (
                                            <div className="absolute inset-0 ring-2 ring-inset ring-[var(--turf-green)]/50 rounded-2xl" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Details ── */}
                    <div className="space-y-8 animate-fade-up" style={{ animationDelay: '0.2s' }}>
                        <div>
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <span className="bg-[var(--turf-green)]/10 border border-[var(--turf-green)]/20 text-[var(--turf-green)] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(46,204,113,0.15)] flex items-center gap-1.5">
                                    <CheckCircle size={14} className="opacity-80" /> Available Now
                                </span>
                                <span className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs font-bold text-gray-300 uppercase tracking-wider backdrop-blur-md">
                                    {turf.wicketType} Wicket
                                </span>
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight leading-tight">
                                {turf.name}
                            </h1>
                            <div className="flex items-center text-gray-400 text-base sm:text-lg font-medium">
                                <MapPin className="w-5 h-5 mr-2 text-[var(--turf-green)]" />
                                {[turf.address, turf.city].filter(Boolean).join(', ') || turf.location || 'Location not specified'}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">About <span className="text-[var(--turf-green)]">Court</span></h3>
                            <p className="text-gray-400 leading-relaxed text-base sm:text-lg">{turf.description}</p>
                        </div>

                        {turf.amenities?.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">Premium <span className="text-[var(--turf-green)]">Amenities</span></h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {turf.amenities.map(item => (
                                        <div key={item} className="flex items-center text-gray-300 bg-white/5 border border-white/5 py-3 px-4 rounded-xl backdrop-blur-sm hover:bg-white/10 transition-colors group">
                                            <div className="bg-[var(--turf-green)]/10 p-1.5 rounded-lg mr-3 group-hover:bg-[var(--turf-green)]/20 transition-colors">
                                                <CheckCircle className="w-4 h-4 text-[var(--turf-green)]" />
                                            </div>
                                            <span className="font-medium text-sm sm:text-base">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <GlassCard className="p-5 sm:p-8 border-[var(--turf-green)]/30 bg-gradient-to-br from-[var(--turf-green)]/5 to-transparent relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--turf-green)]/10 blur-3xl rounded-full" />
                            <div className="flex justify-between items-end pb-6 border-b border-white/10 mb-6 relative z-10 flex-wrap gap-4">
                                <div>
                                    <span className="text-gray-400 text-xs sm:text-sm font-bold uppercase tracking-wider">Book your slot</span>
                                    <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">Select Time</h3>
                                </div>
                                <div className="text-left sm:text-right">
                                    <span className="text-gray-400 text-xs sm:text-sm font-bold uppercase tracking-wider block mb-1">Hourly Rate</span>
                                    <div className="flex items-end gap-1 sm:justify-end">
                                        <span className="text-2xl sm:text-4xl font-black text-[var(--turf-green)] leading-none animate-pulse-glow">₹{turf.pricePerHour}</span>
                                        <span className="text-gray-400 font-medium mb-1">/hr</span>
                                    </div>
                                </div>
                            </div>
                            <div className="relative z-10">
                                <SlotPicker
                                    turfId={turf.id}
                                    pricePerHour={turf.pricePerHour}
                                    onBook={handleBooking}
                                    operatingHours={turf.operatingHours}
                                    initialDate={initialDate || undefined}
                                    initialTime={initialTime || undefined}
                                />
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>

            {/* ── Fullscreen Lightbox ── */}
            {lightboxOpen && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center"
                    onClick={() => setLightboxOpen(false)}
                >
                    {/* Close button */}
                    <button
                        onClick={() => setLightboxOpen(false)}
                        className="absolute top-5 right-5 z-10 w-11 h-11 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                    >
                        <X size={22} />
                    </button>

                    {/* Counter */}
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/10 border border-white/10 backdrop-blur-md text-white text-sm font-bold px-4 py-2 rounded-full">
                        <Images size={14} />
                        {selectedImage + 1} / {images.length}
                    </div>

                    {/* Prev arrow */}
                    {hasMultiple && (
                        <button
                            onClick={(e) => { e.stopPropagation(); prevImage(); }}
                            className="absolute left-4 sm:left-8 z-10 w-12 h-12 bg-white/10 hover:bg-[var(--turf-green)] border border-white/10 hover:border-[var(--turf-green)] rounded-full flex items-center justify-center text-white transition-all hover:scale-110 shadow-2xl"
                        >
                            <ChevronLeft size={24} />
                        </button>
                    )}

                    {/* Image */}
                    <div
                        className="relative w-[90vw] max-w-5xl h-[75vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={images[selectedImage]}
                            alt={`${turf.name} - Photo ${selectedImage + 1}`}
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>

                    {/* Next arrow */}
                    {hasMultiple && (
                        <button
                            onClick={(e) => { e.stopPropagation(); nextImage(); }}
                            className="absolute right-4 sm:right-8 z-10 w-12 h-12 bg-white/10 hover:bg-[var(--turf-green)] border border-white/10 hover:border-[var(--turf-green)] rounded-full flex items-center justify-center text-white transition-all hover:scale-110 shadow-2xl"
                        >
                            <ChevronRight size={24} />
                        </button>
                    )}

                    {/* Thumbnail strip inside lightbox */}
                    {hasMultiple && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl max-w-[90vw] overflow-x-auto">
                            {images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => { e.stopPropagation(); setSelectedImage(idx); }}
                                    className={`relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-[var(--turf-green)] scale-110 shadow-[0_0_10px_rgba(46,204,113,0.5)]' : 'border-white/20 opacity-50 hover:opacity-100'}`}
                                >
                                    <Image src={img} alt={`Thumb ${idx + 1}`} fill className="object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}
