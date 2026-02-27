'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { getBookingsByUser, Booking, getTurfById } from '@/lib/firebase/firestore';
import { Loader2, Calendar, Clock, MapPin, AlertCircle, Plus, TrendingUp, DollarSign, CalendarCheck, Star, User as UserIcon, LogOut, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { SkeletonStats, SkeletonBooking } from '@/components/ui/SkeletonLoader';

export default function DashboardPage() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState<(Booking & { turfName?: string; location?: string })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (user) {
                setLoading(true);
                const userBookings = await getBookingsByUser(user.uid);

                // Enrich bookings with turf details
                const enrichedBookings = await Promise.all(
                    userBookings.map(async (booking) => {
                        const turf = await getTurfById(booking.turfId);
                        
                        // Build location string with proper fallbacks
                        let location = 'Location not available';
                        if (turf) {
                            if (turf.city && turf.address) {
                                location = `${turf.address}, ${turf.city}`;
                            } else if (turf.city) {
                                location = turf.city;
                            } else if (turf.address) {
                                location = turf.address;
                            } else if (turf.location) {
                                location = turf.location;
                            }
                        }
                        
                        return {
                            ...booking,
                            turfName: turf?.name || 'Unknown Turf',
                            location
                        };
                    })
                );

                setBookings(enrichedBookings);
                setLoading(false);
            }
        };

        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    if (authLoading || loading) {
        return (
            <main className="min-h-screen bg-[var(--background)] pb-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none" />
                <Navbar />
                <div className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-28 lg:pt-32 relative z-10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 sm:mb-8 animate-fade-up">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">My Dashboard</h1>
                            <p className="text-sm sm:text-base text-emerald-400 mt-1 font-medium">Loading your profile...</p>
                        </div>
                    </div>
                    
                    {/* Stats Grid Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10 animate-pulse">
                        {[1, 2, 3, 4].map(i => <SkeletonStats key={i} />)}
                    </div>
                    
                    {/* Bookings Skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                        <div className="lg:col-span-1 hidden lg:block animate-pulse">
                            <SkeletonStats />
                        </div>
                        <div className="lg:col-span-2 space-y-4 sm:space-y-6 animate-pulse">
                            <h2 className="text-2xl font-bold text-white">Recent Bookings</h2>
                            {[1, 2, 3].map(i => <SkeletonBooking key={i} />)}
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // Calculate statistics
    const totalSpent = bookings.reduce((sum, booking) => {
        // Estimate based on 1 hour per time slot at average price
        return sum + (booking.times?.length || 1) * 1000; // Rough estimate
    }, 0);

    const today = new Date();
    const upcomingBookings = bookings.filter(b => new Date(b.date) >= today);
    const pastBookings = bookings.filter(b => new Date(b.date) < today);
    
    const thisMonthBookings = bookings.filter(b => {
        const bookingDate = new Date(b.date);
        return bookingDate.getMonth() === today.getMonth() && 
               bookingDate.getFullYear() === today.getFullYear();
    });

    // Find most visited location
    const locationCounts = bookings.reduce((acc, booking) => {
        const loc = booking.location || 'Location not available';
        acc[loc] = (acc[loc] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    const mostVisited = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0];

    const statCards = [
        {
            label: 'Total Bookings',
            value: bookings.length,
            icon: Calendar,
            color: 'text-[var(--turf-green)]',
            bg: 'bg-[var(--turf-green)]/10',
            border: 'border-[var(--turf-green)]/20',
        },
        {
            label: 'Upcoming',
            value: upcomingBookings.length,
            icon: CalendarCheck,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
        },
        {
            label: 'This Month',
            value: thisMonthBookings.length,
            icon: TrendingUp,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20',
        },
        {
            label: 'Est. Total Spent',
            value: `₹${totalSpent.toLocaleString('en-IN')}`,
            icon: DollarSign,
            color: 'text-orange-400',
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/20',
        },
    ];

    return (
        <main className="min-h-screen bg-[var(--background)] pb-12 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[var(--turf-green)]/10 rounded-full blur-[120px] pointer-events-none animate-float" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none animate-float" style={{ animationDelay: '2s' }} />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none mix-blend-overlay" />
            
            <Navbar />
            
            <div className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-28 lg:pt-32 relative z-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 sm:mb-10 animate-fade-up">
                    <div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">My Dashboard</h1>
                        <p className="text-base sm:text-lg text-emerald-400 mt-2 font-medium">Welcome back, {user?.displayName || 'Player'}</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
                    {statCards.map((card, index) => {
                        const Icon = card.icon;
                        return (
                            <GlassCard key={card.label} className={`p-5 sm:p-6 border-l-4 ${card.border} animate-fade-up`} style={{ animationDelay: `${index * 0.1}s` }}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-2xl ${card.bg} shadow-inner`}>
                                        <Icon size={22} className={card.color} />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400 font-medium mb-1">{card.label}</p>
                                <p className={`text-2xl sm:text-3xl font-bold ${card.color} tracking-tight`}>
                                    {card.value}
                                </p>
                            </GlassCard>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
                    {/* Stats / Sidebar */}
                    <div className="lg:col-span-1 space-y-6 sm:space-y-8 animate-fade-up" style={{ animationDelay: '0.4s' }}>
                        <GlassCard className="p-6 sm:p-8 border-white/5">
                            <h3 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                <UserIcon className="w-5 h-5 text-emerald-400" /> Profile
                            </h3>
                            <div className="space-y-4 text-sm sm:text-base">
                                <div className="flex flex-col gap-1 pb-3 border-b border-white/5">
                                    <span className="text-gray-500 font-medium">Email</span>
                                    <span className="text-white font-medium truncate">{user?.email}</span>
                                </div>
                                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                                    <span className="text-gray-500 font-medium">Member Since</span>
                                    <span className="text-white font-medium">Jan 2024</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">Role</span>
                                    <span className="text-emerald-400 font-bold capitalize bg-emerald-500/10 px-3 py-1 rounded-full">{user?.role}</span>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="w-full mt-8 text-sm sm:text-base font-bold text-red-400 hover:text-white border border-red-500/30 hover:bg-red-500 hover:border-red-500 py-3 rounded-xl transition-all flex justify-center items-center gap-2"
                            >
                                <LogOut size={16} /> Log Out
                            </button>
                        </GlassCard>

                        {/* Most Visited Location */}
                        {mostVisited && (
                            <GlassCard className="p-6 sm:p-8 border-yellow-500/10 bg-yellow-500/5">
                                <h3 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Star className="w-6 h-6 text-yellow-500 fill-yellow-500/20" />
                                    Most Visited
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-white/5 p-3 rounded-xl">
                                            <MapPin className="w-6 h-6 text-[var(--turf-green)]" />
                                        </div>
                                        <div className="flex-1 mt-1">
                                            <p className="text-lg text-white font-bold leading-tight">{mostVisited[0]}</p>
                                            <p className="text-sm text-emerald-400 font-medium mt-1">{mostVisited[1]} booking{mostVisited[1] > 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        )}

                        {/* Admin Actions */}
                        {(user?.role === 'turf_admin' || user?.role === 'super_admin') && (
                            <GlassCard className="p-6 sm:p-8 border-[var(--turf-green)]/30 bg-gradient-to-br from-[var(--turf-green)]/10 to-transparent">
                                <h3 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                    <ShieldCheck className="w-6 h-6 text-[var(--turf-green)]" /> Owner Console
                                </h3>
                                <div className="space-y-3 sm:space-y-4">
                                    <button
                                        onClick={() => router.push('/owner')}
                                        className="w-full bg-[var(--turf-green)] text-black px-4 py-3 rounded-xl font-bold hover:bg-emerald-400 hover:shadow-[0_0_15px_rgba(46,204,113,0.4)] transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-5 h-5" /> Owner Panel
                                    </button>
                                    <button
                                        onClick={() => router.push('/owner/courts/add')}
                                        className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl font-medium hover:bg-white/10 transition-all"
                                    >
                                        Add New Court
                                    </button>
                                    <button
                                        onClick={() => router.push('/owner/bookings')}
                                        className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl font-medium hover:bg-white/10 transition-all"
                                    >
                                        Manage Bookings
                                    </button>
                                    {user?.role === 'super_admin' && (
                                        <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
                                            <button
                                                onClick={() => router.push('/admin/users')}
                                                className="w-full bg-purple-500/10 text-purple-400 border border-purple-500/30 px-4 py-3 rounded-xl font-bold hover:bg-purple-500/20 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all"
                                            >
                                                Manage Users (Super Admin)
                                            </button>
                                            <button
                                                onClick={() => router.push('/admin/courts')}
                                                className="w-full bg-orange-500/10 text-orange-400 border border-orange-500/30 px-4 py-3 rounded-xl font-bold hover:bg-orange-500/20 hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all"
                                            >
                                                Manage Courts (Super Admin)
                                            </button>
                                            <button
                                                onClick={() => router.push('/admin/requests')}
                                                className="w-full bg-blue-500/10 text-blue-400 border border-blue-500/30 px-4 py-3 rounded-xl font-bold hover:bg-blue-500/20 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all"
                                            >
                                                Partner Requests
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </GlassCard>
                        )}
                    </div>

                    {/* Bookings List */}
                    <div className="lg:col-span-2 space-y-6 sm:space-y-8 animate-fade-up" style={{ animationDelay: '0.6s' }}>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                            <CalendarCheck className="w-7 h-7 text-blue-400" /> Recent Bookings
                        </h2>
                        
                        {bookings.length === 0 ? (
                            <GlassCard className="p-10 sm:p-16 text-center border-white/5 flex flex-col items-center justify-center bg-white/[0.02]">
                                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                    <AlertCircle className="w-12 h-12 text-gray-500" />
                                </div>
                                <h3 className="text-2xl text-white font-bold">No bookings yet</h3>
                                <p className="text-gray-400 text-lg mt-3 mb-8 max-w-md mx-auto">Start your journey by finding and booking a premium turf today.</p>
                                <button
                                    onClick={() => router.push('/turfs')}
                                    className="bg-gradient-to-r from-[var(--turf-green)] to-emerald-500 text-black px-8 py-3.5 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(46,204,113,0.4)] hover:scale-105 transition-all text-lg"
                                >
                                    Browse Turfs
                                </button>
                            </GlassCard>
                        ) : (
                            <div className="space-y-5">
                                {bookings.map((booking, index) => (
                                    <GlassCard key={booking.id} className="p-5 sm:p-6 border-white/5 flex flex-col sm:flex-row gap-5 sm:gap-6 sm:items-center justify-between group hover:border-[var(--turf-green)]/40 hover:bg-white/[0.03] transition-all" style={{ animationDelay: `${index * 0.1}s` }}>
                                        <div className="flex-1 space-y-3">
                                            <div className="flex justify-between items-start sm:hidden mb-2">
                                                <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${booking.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
                                                    booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/20'
                                                    }`}>
                                                    {booking.status}
                                                </span>
                                            </div>
                                            <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-[var(--turf-green)] transition-colors">
                                                {booking.turfName}
                                            </h3>
                                            <div className="flex items-center text-gray-400 text-sm sm:text-base font-medium">
                                                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[var(--turf-green)] shrink-0" />
                                                <span className="truncate">{booking.location}</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                                <div className="flex items-center text-white bg-white/10 px-4 py-1.5 rounded-lg text-sm font-medium">
                                                    <Calendar className="w-4 h-4 mr-2 text-blue-400" />
                                                    {format(new Date(booking.date), 'MMM d, yyyy')}
                                                </div>
                                                <div className="flex items-center text-white bg-white/10 px-4 py-1.5 rounded-lg text-sm font-medium">
                                                    <Clock className="w-4 h-4 mr-2 text-orange-400" />
                                                    {booking.times && booking.times.length > 0
                                                        ? booking.times.join(', ')
                                                        : booking.time || 'N/A'
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                        <div className="hidden sm:flex flex-col items-end gap-3 min-w-[120px]">
                                            <span className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${booking.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
                                                booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/20'
                                                }`}>
                                                {booking.status}
                                            </span>
                                            <span className="text-sm font-bold text-white bg-white/5 px-3 py-1 rounded-md">#{booking.id?.slice(-6).toUpperCase() || 'ID'}</span>
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
