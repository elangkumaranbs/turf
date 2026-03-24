'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getBookingsByOwner, getTurfsByAdmin, getUserById, Booking, Turf } from '@/lib/firebase/firestore';
import { GlassCard } from '@/components/ui/GlassCard';
import { Loader2, CalendarDays, Clock, MapPin, Search, Filter, WifiOff, User } from 'lucide-react';
import { format } from 'date-fns';

export default function OwnerBookingsPage() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<(Booking & { turfName?: string; city?: string; location?: string })[]>([]);
    const [turfs, setTurfs] = useState<Turf[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterTurf, setFilterTurf] = useState('all');
    const [filterDate, setFilterDate] = useState('');
    const [userNames, setUserNames] = useState<Record<string, string>>({});

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

                // Resolve customer names
                const uniqueUserIds = [...new Set(bookingsData.map(b => b.userId))];
                const nameMap: Record<string, string> = {};
                await Promise.all(
                    uniqueUserIds.map(async (uid) => {
                        try {
                            const userData = await getUserById(uid);
                            if (userData) {
                                nameMap[uid] = userData.name || userData.displayName || userData.email || uid.slice(0, 8);
                            } else {
                                nameMap[uid] = uid.slice(0, 8);
                            }
                        } catch {
                            nameMap[uid] = uid.slice(0, 8);
                        }
                    })
                );
                setUserNames(nameMap);
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
        <div className="space-y-8 animate-fade-up">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        My <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">Bookings</span>
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">{bookings.length} total booking{bookings.length !== 1 ? 's' : ''} across your courts</p>
                </div>
            </div>

            {/* Filters */}
            <GlassCard className="p-4 sm:p-5 border-white/5 bg-white/[0.02]">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="flex items-center gap-2 text-gray-400 font-medium">
                        <Filter size={18} className="text-blue-400" />
                        <span>Filters:</span>
                    </div>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-3 flex-1 w-full relative z-10">
                        <select
                            value={filterTurf}
                            onChange={(e) => setFilterTurf(e.target.value)}
                            className="h-11 appearance-none rounded-xl border border-white/10 bg-white/5 px-4 pr-10 text-sm font-medium text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-all cursor-pointer w-full sm:w-auto flex-1 sm:flex-none"
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
                            className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert w-full sm:w-auto"
                        />
                        {(filterTurf !== 'all' || filterDate) && (
                            <button
                                onClick={() => { setFilterTurf('all'); setFilterDate(''); }}
                                className="h-11 px-5 rounded-xl text-sm font-bold text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white transition-all shadow-sm w-full sm:w-auto"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                    <div className="text-sm font-medium text-gray-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 mt-2 md:mt-0">
                        Showing <span className="text-white">{filteredBookings.length}</span> of {bookings.length}
                    </div>
                </div>
            </GlassCard>

            {/* Bookings List */}
            {filteredBookings.length === 0 ? (
                <GlassCard className="p-12 sm:p-16 text-center border-white/5 w-full max-w-2xl mx-auto mt-8 animate-fade-up" style={{ animationDelay: '0.2s' }}>
                    <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-6">
                        <CalendarDays className="w-10 h-10 text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tight mb-2">No bookings found</h3>
                    <p className="text-gray-400 text-lg">
                        {bookings.length === 0
                            ? 'You don\'t have any bookings yet. Once customers book your courts, they\'ll appear here.'
                            : 'No bookings match your current filters.'
                        }
                    </p>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
                    {filteredBookings.map((booking, index) => (
                        <GlassCard 
                            key={booking.id} 
                            className="p-5 sm:p-6 border-white/5 bg-white/[0.02] hover:border-blue-500/30 hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)] transition-all duration-300 group animate-fade-up relative overflow-hidden"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full pointer-events-none transition-opacity opacity-50 group-hover:opacity-100" />
                            
                            <div className="flex flex-col justify-between h-full gap-5 relative z-10">
                                <div>
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-white/5 pb-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{booking.turfName}</h4>
                                            {booking.bookingType === 'offline' && (
                                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                                    <WifiOff size={10} />
                                                    Offline
                                                </span>
                                            )}
                                        </div>
                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-md ${booking.status === 'confirmed'
                                            ? 'bg-[var(--turf-green)]/10 text-[var(--turf-green)] border border-[var(--turf-green)]/20'
                                            : booking.status === 'pending'
                                                ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                                : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {booking.city && (
                                            <div className="flex items-center gap-2.5 text-sm font-medium text-gray-300">
                                                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center">
                                                    <MapPin size={14} className="text-gray-400" />
                                                </div>
                                                {booking.city}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2.5 text-sm font-medium text-gray-300">
                                            <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center">
                                                <CalendarDays size={14} className="text-blue-400" />
                                            </div>
                                            {format(new Date(booking.date), 'MMMM d, yyyy')}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2.5 text-sm font-medium text-gray-300">
                                            <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                                <Clock size={14} className="text-emerald-400" />
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {booking.times && booking.times.length > 0
                                                    ? booking.times.map((t, i) => (
                                                        <span key={i} className="bg-white/5 border border-white/10 px-2 py-1 rounded-md text-xs">{t}</span>
                                                    ))
                                                    : <span className="bg-white/5 border border-white/10 px-2 py-1 rounded-md text-xs">{booking.time || 'N/A'}</span>
                                                } 
                                                <span className="text-gray-500 self-center ml-1">({booking.duration} min)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-2 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-500 font-medium">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-400">
                                            {(booking.customerName || userNames[booking.userId] || '?').slice(0, 1).toUpperCase()}
                                        </div>
                                        <span className="text-gray-300 font-semibold text-sm truncate max-w-[200px]">
                                            {booking.customerName || userNames[booking.userId] || 'Loading...'}
                                        </span>
                                    </div>
                                    <div className="bg-white/5 px-2 py-1 rounded">
                                        {format(new Date(booking.createdAt), 'MMM d • h:mm a')}
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
}
