'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { getTurfsByAdmin, getBookingsForTurf, Turf, Booking } from '@/lib/firebase/firestore';
import { Loader2, Calendar, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';

export default function ManageBookingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [turfs, setTurfs] = useState<Turf[]>([]);
    const [selectedTurf, setSelectedTurf] = useState<string | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (user) {
                setLoading(true);
                const adminTurfs = await getTurfsByAdmin(user.uid);
                setTurfs(adminTurfs);
                if (adminTurfs.length > 0) {
                    setSelectedTurf(adminTurfs[0].id);
                }
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    useEffect(() => {
        const fetchBookings = async () => {
            if (selectedTurf) {
                // Retrieve bookings for today + future (simplified: getting for specific dates would be better, but basic list is ok)
                // Actually getBookingsForTurf asks for a date. Let's make a new query or just get all for now (simpler demo).
                // Re-using the helper but iterating dates or modifying helper is hard. 
                // I'll make a quick hack to show "Today's" bookings or recent.
                // For now, let's just fetch for "today" as a default view.
                const today = format(new Date(), 'yyyy-MM-dd');
                const data = await getBookingsForTurf(selectedTurf, today);
                setBookings(data);
            }
        };
        fetchBookings();
    }, [selectedTurf]);

    const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (selectedTurf) {
            const data = await getBookingsForTurf(selectedTurf, e.target.value);
            setBookings(data);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>;
    }

    return (
        <main className="min-h-screen bg-[#0a0a0a] pb-12">
            <Navbar />
            <div className="container mx-auto px-6 pt-32">
                <h1 className="text-3xl font-bold text-white mb-8">Manage Bookings</h1>

                {turfs.length === 0 ? (
                    <div className="text-gray-400">You have no turfs listed.</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-1 space-y-4">
                            <h3 className="text-white font-semibold">Select Turf</h3>
                            <div className="flex flex-row overflow-x-auto lg:flex-col lg:overflow-visible gap-3 pb-2 lg:pb-0 scrollbar-hide">
                                {turfs.map(turf => (
                                    <button
                                        key={turf.id}
                                        onClick={() => setSelectedTurf(turf.id)}
                                        className={`w-full sm:w-auto lg:w-full flex-shrink-0 text-left p-4 rounded-xl border transition-all ${selectedTurf === turf.id
                                                ? 'bg-[var(--turf-green)] border-[var(--turf-green)] text-black font-bold'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {turf.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-3 space-y-6">
                            <GlassCard className="p-6 border-white/10">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-white">Bookings</h3>
                                    <input
                                        type="date"
                                        className="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2"
                                        defaultValue={format(new Date(), 'yyyy-MM-dd')}
                                        onChange={handleDateChange}
                                    />
                                </div>

                                {bookings.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No bookings found for this date.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {bookings.map(booking => (
                                            <div key={booking.id} className="bg-white/5 border border-white/10 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                                <div>
                                                    <div className="text-white font-medium flex items-center gap-2">
                                                        <Clock size={16} className="text-[var(--turf-green)]" />
                                                        {booking.time} ({booking.duration} mins)
                                                    </div>
                                                    <div className="text-sm text-gray-400">User ID: {booking.userId.slice(0, 6)}...</div>
                                                </div>
                                                <div className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-green-500/20 text-green-400 border border-green-500/20">
                                                    {booking.status}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </GlassCard>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
