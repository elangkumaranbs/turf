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
        <main className="min-h-screen bg-[#0a0a0a]">
            <Navbar />
            <div className="container mx-auto px-6 pt-32 pb-12">

                {/* Gallery Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    <div className="space-y-4">
                        <div className="relative h-[400px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                            <Image
                                src={turf.images[selectedImage]}
                                alt={turf.name}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                        {turf.images.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {turf.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={`relative w-24 h-24 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${selectedImage === idx ? 'border-[var(--turf-green)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                    >
                                        <Image src={img} alt="Thumbnail" fill className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details Section */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">{turf.name}</h1>
                            <div className="flex items-center text-gray-400">
                                <MapPin className="w-5 h-5 mr-2 text-[var(--turf-green)]" />
                                {turf.address && turf.city
                                    ? `${turf.address}, ${turf.city}`
                                    : turf.location || 'Location not specified'
                                }
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <span className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-sm text-gray-300">
                                Type: <span className="text-white font-medium capitalize">{turf.wicketType} Wicket</span>
                            </span>
                            <span className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-sm text-gray-300">
                                Status: <span className="text-[var(--turf-green)] font-medium">Available</span>
                            </span>
                        </div>

                        <div className="space-y-4">
                            <p className="text-gray-400 leading-relaxed">{turf.description}</p>
                        </div>

                        <GlassCard className="space-y-6 border-[var(--turf-green)]/20">
                            <div className="flex justify-between items-center pb-4 border-b border-white/10">
                                <span className="text-gray-400">Hourly Rate</span>
                                <span className="text-2xl font-bold text-[var(--turf-green)]">₹{turf.pricePerHour}</span>
                            </div>

                            {/* Slot Picker Component */}
                            <SlotPicker
                                turfId={turf.id}
                                pricePerHour={turf.pricePerHour}
                                onBook={handleBooking}
                                operatingHours={turf.operatingHours}
                                initialDate={initialDate || undefined}
                                initialTime={initialTime || undefined}
                            />
                        </GlassCard>

                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-white">Amenities</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {turf.amenities.map(item => (
                                    <div key={item} className="flex items-center text-gray-300">
                                        <CheckCircle className="w-4 h-4 mr-3 text-[var(--turf-green)]" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
