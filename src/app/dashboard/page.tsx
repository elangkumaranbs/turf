'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { getBookingsByUser, Booking, getTurfById, getSuperAdminStats, AdminStatistics } from '@/lib/firebase/firestore';
import { Loader2, Calendar, Clock, MapPin, AlertCircle, Plus, TrendingUp, Star, User as UserIcon, LogOut, ShieldCheck, Building2, Users, IndianRupee, ChevronDown, ChevronUp, CalendarCheck } from 'lucide-react';
import { format } from 'date-fns';
import { SkeletonStats, SkeletonBooking } from '@/components/ui/SkeletonLoader';

export default function DashboardPage() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState<(Booking & { turfName?: string; location?: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [adminStats, setAdminStats] = useState<AdminStatistics[]>([]);
    const [adminStatsLoading, setAdminStatsLoading] = useState(false);
    const [expandedAdmins, setExpandedAdmins] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (user) {
                setLoading(true);
                
                // Fetch user bookings
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

                // Fetch super admin statistics if user is super admin
                if (user.role === 'super_admin') {
                    setAdminStatsLoading(true);
                    const stats = await getSuperAdminStats();
                    setAdminStats(stats);
                    setAdminStatsLoading(false);
                }

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10 animate-pulse">
                        {[1, 2].map(i => <SkeletonStats key={i} />)}
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
    const today = new Date();
    
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

    const toggleAdmin = (adminId: string) => {
        setExpandedAdmins(prev => {
            const next = new Set(prev);
            if (next.has(adminId)) {
                next.delete(adminId);
            } else {
                next.add(adminId);
            }
            return next;
        });
    };

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
            label: 'This Month',
            value: thisMonthBookings.length,
            icon: TrendingUp,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20',
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
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
                            
                            {/* Profile Photo */}
                            <div className="flex justify-center mb-6">
                                {user?.photoURL ? (
                                    <Image
                                        src={user.photoURL}
                                        alt="Profile"
                                        width={96}
                                        height={96}
                                        className="rounded-full object-cover border-4 border-white/10"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-4 border-white/10 flex items-center justify-center">
                                        <UserIcon className="w-10 h-10 text-gray-500" />
                                    </div>
                                )}
                            </div>
                            
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
                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => router.push('/dashboard/settings')}
                                    className="flex-1 text-sm sm:text-base font-bold text-blue-400 hover:text-white border border-blue-500/30 hover:bg-blue-500 hover:border-blue-500 py-3 rounded-xl transition-all flex justify-center items-center gap-2"
                                >
                                    <UserIcon size={16} /> Edit Profile
                                </button>
                                <button
                                    onClick={logout}
                                    className="flex-1 text-sm sm:text-base font-bold text-red-400 hover:text-white border border-red-500/30 hover:bg-red-500 hover:border-red-500 py-3 rounded-xl transition-all flex justify-center items-center gap-2"
                                >
                                    <LogOut size={16} /> Log Out
                                </button>
                            </div>
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

                {/* Super Admin Statistics Section */}
                {user?.role === 'super_admin' && (
                    <div className="mt-12 space-y-6 animate-fade-up" style={{ animationDelay: '0.8s' }}>
                        <div className="flex items-center justify-between gap-3 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30">
                                    <Users className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Turf Admin Statistics</h2>
                                    <p className="text-gray-400 text-sm mt-1">Overview of all turf admins, their courts, bookings, and earnings</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    console.log('=== DEBUG INFO ===');
                                    console.log('Admin Stats:', adminStats);
                                    console.log('Admin Stats Length:', adminStats.length);
                                    console.log('Total Courts:', adminStats.reduce((sum, admin) => sum + admin.totalTurfs, 0));
                                    alert(`Debug: ${adminStats.length} admins found with ${adminStats.reduce((sum, admin) => sum + admin.totalTurfs, 0)} total courts. Check console for details.`);
                                }}
                                className="text-xs px-3 py-1.5 rounded-lg bg-gray-500/20 text-gray-400 hover:text-white hover:bg-gray-500/30 transition-all"
                            >
                                Debug Info
                            </button>
                        </div>

                        {adminStatsLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center">
                                    <Loader2 className="animate-spin text-purple-400 w-12 h-12 mx-auto mb-4" />
                                    <p className="text-white font-medium">Loading admin statistics...</p>
                                    <p className="text-gray-400 text-sm mt-2">Fetching all turf admins, courts, and bookings</p>
                                </div>
                            </div>
                        ) : adminStats.length === 0 ? (
                            <GlassCard className="p-12 text-center border-white/10">
                                <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-10 h-10 text-purple-400" />
                                </div>
                                <h3 className="text-xl text-white font-bold mb-2">No Data Available</h3>
                                <p className="text-gray-400 mb-4">
                                    No turf admins with courts found in the system.
                                </p>
                                <div className="text-sm text-gray-500 space-y-1 max-w-md mx-auto">
                                    <p>✅ Make sure you have created turf admin accounts</p>
                                    <p>✅ Turf admins must have added courts via Owner Panel</p>
                                    <p>✅ Check browser console for detailed debug logs</p>
                                </div>
                            </GlassCard>
                        ) : (
                            <>
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                    <GlassCard className="p-5 border-purple-500/20">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="p-2.5 rounded-xl bg-purple-500/10">
                                        <Users className="w-5 h-5 text-purple-400" />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400 font-medium mb-1">Total Admins</p>
                                <p className="text-3xl font-bold text-purple-400">{adminStats.length}</p>
                            </GlassCard>
                            <GlassCard className="p-5 border-orange-500/20">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="p-2.5 rounded-xl bg-orange-500/10">
                                        <Building2 className="w-5 h-5 text-orange-400" />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400 font-medium mb-1">Total Courts</p>
                                <p className="text-3xl font-bold text-orange-400">{adminStats.reduce((sum, admin) => sum + admin.totalTurfs, 0)}</p>
                            </GlassCard>
                            <GlassCard className="p-5 border-blue-500/20">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="p-2.5 rounded-xl bg-blue-500/10">
                                        <CalendarCheck className="w-5 h-5 text-blue-400" />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400 font-medium mb-1">Total Bookings</p>
                                <p className="text-3xl font-bold text-blue-400">{adminStats.reduce((sum, admin) => sum + admin.totalBookings, 0)}</p>
                            </GlassCard>
                            <GlassCard className="p-5 border-green-500/20">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="p-2.5 rounded-xl bg-green-500/10">
                                        <IndianRupee className="w-5 h-5 text-green-400" />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400 font-medium mb-1">Total Earnings</p>
                                <p className="text-3xl font-bold text-green-400">₹{adminStats.reduce((sum, admin) => sum + admin.totalEarnings, 0).toLocaleString('en-IN')}</p>
                            </GlassCard>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                            <p className="text-sm text-blue-400">
                                <strong>ℹ️ Note:</strong> Bookings count includes all booking statuses. Earnings are calculated only from confirmed bookings.
                            </p>
                        </div>

                        {/* Admin Details */}
                        <div className="space-y-4">
                            {adminStats.map((admin) => (
                                <GlassCard key={admin.adminId} className="overflow-hidden border-white/10">
                                    {/* Admin Header */}
                                    <button
                                        onClick={() => toggleAdmin(admin.adminId)}
                                        className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-all"
                                    >
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center font-bold text-white flex-shrink-0">
                                                {admin.adminName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="text-left flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-white truncate">{admin.adminName}</h3>
                                                <p className="text-sm text-gray-400 truncate">{admin.adminEmail}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
                                            <div className="hidden sm:flex items-center gap-6 text-sm">
                                                <div className="text-center">
                                                    <p className="text-gray-400">Courts</p>
                                                    <p className="text-white font-bold">{admin.totalTurfs}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-gray-400">Bookings</p>
                                                    <p className="text-blue-400 font-bold">{admin.totalBookings}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-gray-400">Earnings</p>
                                                    <p className="text-green-400 font-bold">₹{admin.totalEarnings.toLocaleString('en-IN')}</p>
                                                </div>
                                            </div>
                                            {expandedAdmins.has(admin.adminId) ? (
                                                <ChevronUp className="w-5 h-5 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                    </button>

                                    {/* Mobile Stats - Only visible on mobile when collapsed */}
                                    <div className="sm:hidden px-5 pb-4 flex justify-around text-xs border-t border-white/5">
                                        <div className="text-center py-3">
                                            <p className="text-gray-400 mb-1">Courts</p>
                                            <p className="text-white font-bold">{admin.totalTurfs}</p>
                                        </div>
                                        <div className="text-center py-3">
                                            <p className="text-gray-400 mb-1">Bookings</p>
                                            <p className="text-blue-400 font-bold">{admin.totalBookings}</p>
                                        </div>
                                        <div className="text-center py-3">
                                            <p className="text-gray-400 mb-1">Earnings</p>
                                            <p className="text-green-400 font-bold">₹{admin.totalEarnings.toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>

                                    {/* Expanded Court Details */}
                                    {expandedAdmins.has(admin.adminId) && (
                                        <div className="border-t border-white/10 bg-white/[0.02]">
                                            {/* Desktop Table */}
                                            <div className="hidden md:block overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                                                        <tr>
                                                            <th className="px-5 py-3 text-left font-semibold">Court Name</th>
                                                            <th className="px-5 py-3 text-left font-semibold">City</th>
                                                            <th className="px-5 py-3 text-left font-semibold">Created By</th>
                                                            <th className="px-5 py-3 text-center font-semibold">Price/Hour</th>
                                                            <th className="px-5 py-3 text-center font-semibold">Bookings</th>
                                                            <th className="px-5 py-3 text-right font-semibold">Earnings</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        {admin.turfs.map((turf) => (
                                                            <tr key={turf.turfId} className="hover:bg-white/5 transition-colors">
                                                                <td className="px-5 py-4 text-white font-medium">{turf.turfName}</td>
                                                                <td className="px-5 py-4 text-gray-400">{turf.city}</td>
                                                                <td className="px-5 py-4">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-blue-400 text-xs font-medium">{admin.adminName}</span>
                                                                        <span className="text-gray-500 text-xs">{admin.adminEmail}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-4 text-center text-orange-400 font-semibold">₹{turf.pricePerHour}</td>
                                                                <td className="px-5 py-4 text-center">
                                                                    <span className="text-blue-400 font-semibold">{turf.totalBookings}</span>
                                                                </td>
                                                                <td className="px-5 py-4 text-right">
                                                                    <span className="text-green-400 font-bold">₹{turf.totalEarnings.toLocaleString('en-IN')}</span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Mobile Cards */}
                                            <div className="md:hidden divide-y divide-white/5">
                                                {admin.turfs.map((turf) => (
                                                    <div key={turf.turfId} className="p-4 hover:bg-white/5 transition-colors">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-white font-bold truncate">{turf.turfName}</h4>
                                                                <p className="text-gray-400 text-xs truncate">{turf.city}</p>
                                                                <p className="text-blue-400 text-xs mt-1">By: {admin.adminName}</p>
                                                            </div>
                                                            <div className="text-right flex-shrink-0 ml-3">
                                                                <p className="text-green-400 font-bold">₹{turf.totalEarnings.toLocaleString('en-IN')}</p>
                                                                <p className="text-xs text-gray-400">Earnings</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-around text-xs bg-white/5 rounded-lg py-2">
                                                            <div className="text-center">
                                                                <p className="text-gray-400 mb-1">Price/Hour</p>
                                                                <p className="text-orange-400 font-semibold">₹{turf.pricePerHour}</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-gray-400 mb-1">Bookings</p>
                                                                <p className="text-blue-400 font-semibold">{turf.totalBookings}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </GlassCard>
                            ))}
                        </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
