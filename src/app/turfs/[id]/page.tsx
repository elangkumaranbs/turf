'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { getTurfById, Turf } from '@/lib/firebase/firestore';
import { MapPin, CheckCircle, Calendar, Clock, DollarSign } from 'lucide-react';
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

    // Get initial values from URL
    const initialDate = searchParams.get('date');
    const initialTime = searchParams.get('time');

    console.log("TurfDetailsPage Params:", { initialDate, initialTime });

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
            alert('Booking Confirmed! (This would show a success modal in production)');
            router.push('/dashboard');
        } catch (error: any) {
            console.error("Booking error:", error);
            if (error.code === 'permission-denied') {
                alert("Permission Denied: Please check Firestore Security Rules.");
            } else {
                alert(`Failed to book slot: ${error.message}`);
            }
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Loading...</div>;
    }

    if (!turf) {
        return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Turf not found</div>;
    }

    return (
        <main className="min-h-screen bg-[var(--background)] relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--turf-green)]/10 rounded-full blur-[120px] pointer-events-none animate-float" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[130px] pointer-events-none animate-float" style={{ animationDelay: '2s' }} />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none mix-blend-overlay" />
            
            <Navbar />
            
            <div className="container mx-auto px-4 sm:px-6 pt-28 sm:pt-36 pb-16 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
                    {/* Gallery Section */}
                    <div className="space-y-4 animate-fade-up">
                        <div className="relative h-[350px] sm:h-[450px] lg:h-[500px] w-full rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] group">
                            <Image
                                src={turf.images[selectedImage]}
                                alt={turf.name}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                        </div>
                        {turf.images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-4 pt-2 snap-x hide-scrollbar">
                                {turf.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 snap-start ${selectedImage === idx ? 'border-[var(--turf-green)] shadow-[0_0_15px_rgba(46,204,113,0.3)] scale-105' : 'border-white/10 opacity-50 hover:opacity-100 hover:border-white/30'}`}
                                    >
                                        <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details Section */}
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

                            {/* Slot Picker Component */}
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
        </main>
    );
}
