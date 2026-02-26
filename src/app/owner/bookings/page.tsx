'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getBookingsByOwner, getTurfsByAdmin, Booking, Turf } from '@/lib/firebase/firestore';
import { GlassCard } from '@/components/ui/GlassCard';
import { Loader2, CalendarDays, Clock, MapPin, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

export default function OwnerBookingsPage() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<(Booking & { turfName?: string })[]>([]);
    const [turfs, setTurfs] = useState<Turf[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterTurf, setFilterTurf] = useState('all');
    const [filterDate, setFilterDate] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (user) {
                setLoading(true);
                const [bookingsData, turfsData] = await Promise.all([
                    getBookingsByOwner(user.uid),
                    getTurfsByAdmin(user.uid),
                ]);
                setBookings(bookingsData);
                setTurfs(turfsData);
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    // Filtered bookings
    const filteredBookings = bookings.filter((b) => {
        if (filterTurf !== 'all' && b.turfId !== filterTurf) return false;
        if (filterDate && b.date !== filterDate) return false;
        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[var(--turf-green)] w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Bookings</h1>
                <p className="text-gray-400 mt-1">{bookings.length} total booking{bookings.length !== 1 ? 's' : ''} across your courts</p>
            </div>

            {/* Filters */}
            <GlassCard className="p-3 sm:p-4 border-white/10">
                <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Filter size={16} />
                        <span>Filters:</span>
                    </div>
                    <div className="flex flex-wrap gap-3 flex-1">
                        <select
                            value={filterTurf}
                            onChange={(e) => setFilterTurf(e.target.value)}
                            className="h-10 appearance-none rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white focus:border-[var(--turf-green)] focus:outline-none"
                        >
                            <option value="all" className="bg-[#1a1a1a]">All Courts</option>
                            {turfs.map(t => (
                                <option key={t.id} value={t.id} className="bg-[#1a1a1a]">{t.name}</option>
                            ))}
                        </select>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="h-10 rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white focus:border-[var(--turf-green)] focus:outline-none"
                        />
                        {(filterTurf !== 'all' || filterDate) && (
                            <button
                                onClick={() => { setFilterTurf('all'); setFilterDate(''); }}
                                className="h-10 px-4 rounded-lg text-sm text-gray-400 border border-white/10 hover:bg-white/5 transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    <p className="text-sm text-gray-500">
                        Showing {filteredBookings.length} of {bookings.length}
                    </p>
                </div>
            </GlassCard>

            {/* Bookings List */}
            {filteredBookings.length === 0 ? (
                <GlassCard className="p-12 text-center border-white/10">
                    <CalendarDays className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl text-white font-medium">No bookings found</h3>
                    <p className="text-gray-400 mt-2">
                        {bookings.length === 0
                            ? 'You don\'t have any bookings yet. Once customers book your courts, they\'ll appear here.'
                            : 'No bookings match your current filters.'
                        }
                    </p>
                </GlassCard>
            ) : (
                <div className="space-y-3">
                    {filteredBookings.map((booking) => (
                        <GlassCard key={booking.id} className="p-4 sm:p-5 border-white/10 hover:border-white/20 transition-all">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-white font-semibold">{booking.turfName}</h4>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${booking.status === 'confirmed'
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                                            : booking.status === 'pending'
                                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20'
                                                : 'bg-red-500/20 text-red-400 border border-red-500/20'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <CalendarDays size={14} className="text-[var(--turf-green)]" />
                                            {format(new Date(booking.date), 'MMM d, yyyy')}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} className="text-[var(--turf-green)]" />
                                            {booking.times && booking.times.length > 0
                                                ? booking.times.join(', ')
                                                : booking.time || 'N/A'
                                            } ({booking.duration} min)
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right text-sm text-gray-500">
                                    <p>Player: {booking.userId.slice(0, 8)}...</p>
                                    <p className="text-xs mt-1">
                                        Booked {format(new Date(booking.createdAt), 'MMM d, h:mm a')}
                                    </p>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
}
