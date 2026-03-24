'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getOwnerStats, OwnerStats, getBookingsByOwner, Booking, getTurfsByAdmin, Turf, getSuperAdminStats, AdminStatistics } from '@/lib/firebase/firestore';
import { GlassCard } from '@/components/ui/GlassCard';
import { MapPin, CalendarDays, TrendingUp, PlusCircle, ArrowRight, DollarSign, Calendar, Activity, Users, Building2, CalendarCheck, IndianRupee, ChevronDown, ChevronUp, Loader2, WifiOff } from 'lucide-react';
import Link from 'next/link';
import { SkeletonStats } from '@/components/ui/SkeletonLoader';

export default function OwnerDashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<OwnerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState<(Booking & { turfName?: string; city?: string; location?: string })[]>([]);
    const [turfs, setTurfs] = useState<Turf[]>([]);
    const [adminStats, setAdminStats] = useState<AdminStatistics[]>([]);
    const [expandedAdmins, setExpandedAdmins] = useState<Set<string>>(new Set());
    const [loadingAdminStats, setLoadingAdminStats] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            if (user) {
                const data = await getOwnerStats(user.uid);
                setStats(data);
                
                // Fetch bookings for revenue calculation
                const ownerBookings = await getBookingsByOwner(user.uid);
                setBookings(ownerBookings);
                
                // Fetch turfs for price data
                const ownerTurfs = await getTurfsByAdmin(user.uid);
                setTurfs(ownerTurfs);
                
                setLoading(false);
            }
        };
        fetchStats();
    }, [user]);

    // Fetch super admin statistics
    useEffect(() => {
        const fetchAdminStats = async () => {
            if (user?.role === 'super_admin') {
                setLoadingAdminStats(true);
                console.log('Fetching super admin statistics...');
                const stats = await getSuperAdminStats();
                console.log('Received admin statistics:', stats);
                setAdminStats(stats);
                setLoadingAdminStats(false);
            }
        };
        fetchAdminStats();
    }, [user]);

    const toggleAdmin = (adminId: string) => {
        setExpandedAdmins(prev => {
            const newSet = new Set(prev);
            if (newSet.has(adminId)) {
                newSet.delete(adminId);
            } else {
                newSet.add(adminId);
            }
            return newSet;
        });
    };

    // Calculate earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const getStartOfWeek = () => {
        const date = new Date();
        const day = date.getDay();
        const diff = date.getDate() - day;
        return new Date(date.setDate(diff));
    };
    
    const getStartOfMonth = () => {
        return new Date(today.getFullYear(), today.getMonth(), 1);
    };

    const calculateEarnings = (filterDate?: Date, isWeek?: boolean, isMonth?: boolean) => {
        return bookings.reduce((total, booking) => {
            const bookingDate = new Date(booking.date);
            bookingDate.setHours(0, 0, 0, 0);
            
            let include = true;
            if (filterDate && !isWeek && !isMonth) {
                include = bookingDate.getTime() === filterDate.getTime();
            } else if (isWeek) {
                const weekStart = getStartOfWeek();
                include = bookingDate >= weekStart;
            } else if (isMonth) {
                const monthStart = getStartOfMonth();
                include = bookingDate >= monthStart;
            }
            
            if (!include || booking.status === 'cancelled') return total;
            
            // Find turf price
            const turf = turfs.find(t => t.id === booking.turfId);
            const pricePerHour = turf?.pricePerHour || 1000;
            const hours = (booking.times?.length || 1);
            
            return total + (pricePerHour * hours);
        }, 0);
    };

    const dailyEarnings = calculateEarnings(today);
    const weeklyEarnings = calculateEarnings(undefined, true);
    const monthlyEarnings = calculateEarnings(undefined, false, true);
    const todayBookings = bookings.filter(b => {
        const bookingDate = new Date(b.date);
        bookingDate.setHours(0, 0, 0, 0);
        return bookingDate.getTime() === today.getTime() && b.status !== 'cancelled';
    }).length;

    const statCards = [
        {
            label: 'Daily Earnings',
            value: loading ? '—' : `₹${dailyEarnings.toLocaleString('en-IN')}`,
            icon: DollarSign,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
        },
        {
            label: 'Weekly Earnings',
            value: loading ? '—' : `₹${weeklyEarnings.toLocaleString('en-IN')}`,
            icon: TrendingUp,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
        },
        {
            label: 'Monthly Earnings',
            value: loading ? '—' : `₹${monthlyEarnings.toLocaleString('en-IN')}`,
            icon: Activity,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20',
        },
        {
            label: 'Today\'s Bookings',
            value: loading ? '—' : todayBookings,
            icon: Calendar,
            color: 'text-orange-400',
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/20',
        },
        {
            label: 'Total Courts',
            value: stats?.totalCourts ?? 0,
            icon: MapPin,
            color: 'text-[var(--turf-green)]',
            bg: 'bg-[var(--turf-green)]/10',
            border: 'border-[var(--turf-green)]/20',
        },
        {
            label: 'Total Bookings',
            value: stats?.totalBookings ?? 0,
            icon: CalendarDays,
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10',
            border: 'border-cyan-500/20',
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="mb-10 animate-fade-up">
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    Owner <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--turf-green)] to-emerald-400">Dashboard</span>
                </h1>
                <p className="text-gray-400 mt-2 text-lg">Welcome back, {user?.displayName || 'Owner'}. Here's what's happening today.</p>
            </div>

            {/* Stats Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map(i => <SkeletonStats key={i} />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                    {statCards.map((card, index) => {
                        const Icon = card.icon;
                        return (
                            <GlassCard 
                                key={card.label} 
                                className={`p-6 sm:p-7 border ${card.border} hover:scale-105 transition-all duration-300 animate-fade-up relative overflow-hidden group`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${card.bg} blur-2xl opacity-50 group-hover:opacity-100 transition-opacity`} />
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <div className={`p-3.5 rounded-2xl ${card.bg} backdrop-blur-md border ${card.border} shadow-lg`}>
                                        <Icon size={24} className={card.color} />
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{card.label}</p>
                                    <p className={`text-3xl sm:text-4xl font-black mt-2 leading-none ${card.color}`}>
                                        {card.value}
                                    </p>
                                </div>
                            </GlassCard>
                        );
                    })}
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 pt-4 animate-fade-up" style={{ animationDelay: '0.6s' }}>
                <Link href="/owner/courts/add">
                    <GlassCard className="h-full p-6 sm:p-8 border-[var(--turf-green)]/30 bg-gradient-to-br from-[var(--turf-green)]/5 to-transparent hover:border-[var(--turf-green)]/60 transition-all cursor-pointer group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--turf-green)]/10 blur-3xl rounded-full" />
                        <div className="flex items-center gap-5 relative z-10">
                            <div className="p-4 sm:p-5 rounded-2xl bg-[var(--turf-green)]/10 border border-[var(--turf-green)]/20 shadow-[0_0_15px_rgba(46,204,113,0.2)] group-hover:scale-110 transition-transform">
                                <PlusCircle size={32} className="text-[var(--turf-green)]" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white group-hover:text-[var(--turf-green)] transition-colors mb-1">Add New Court</h3>
                                <p className="text-sm text-gray-400 font-medium leading-relaxed">List a new turf and start accepting premium bookings today.</p>
                            </div>
                            <ArrowRight size={24} className="text-gray-600 group-hover:text-[var(--turf-green)] group-hover:translate-x-1 transition-all" />
                        </div>
                    </GlassCard>
                </Link>

                <Link href="/owner/bookings">
                    <GlassCard className="h-full p-6 sm:p-8 border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-transparent hover:border-blue-500/60 transition-all cursor-pointer group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />
                        <div className="flex items-center gap-5 relative z-10">
                            <div className="p-4 sm:p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)] group-hover:scale-110 transition-transform">
                                <CalendarDays size={32} className="text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors mb-1">View All Bookings</h3>
                                <p className="text-sm text-gray-400 font-medium leading-relaxed">Manage your schedule, view upcoming slots, and track daily activity.</p>
                            </div>
                            <ArrowRight size={24} className="text-gray-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                        </div>
                    </GlassCard>
                </Link>

                <Link href="/owner/block-slots">
                    <GlassCard className="h-full p-6 sm:p-8 border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-transparent hover:border-orange-500/60 transition-all cursor-pointer group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full" />
                        <div className="flex items-center gap-5 relative z-10">
                            <div className="p-4 sm:p-5 rounded-2xl bg-orange-500/10 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.2)] group-hover:scale-110 transition-transform">
                                <WifiOff size={32} className="text-orange-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition-colors mb-1">Block Offline Slots</h3>
                                <p className="text-sm text-gray-400 font-medium leading-relaxed">Mark walk-in or phone bookings to prevent online double-booking.</p>
                            </div>
                            <ArrowRight size={24} className="text-gray-600 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                        </div>
                    </GlassCard>
                </Link>
            </div>


            {/* Super Admin Statistics */}
            {user?.role === 'super_admin' && (
                <div className="pt-8 sm:pt-10 border-t border-gray-800/50 animate-fade-up mt-8" style={{ animationDelay: '0.7s' }}>
                    <div className="flex items-center justify-between mb-6 sm:mb-8">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
                                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Platform Statistics</span>
                            </h2>
                            <p className="text-sm sm:text-base text-gray-400 font-medium">Monitor all turf administrators and their performance.</p>
                        </div>
                    </div>

                    {loadingAdminStats ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                        </div>
                    ) : adminStats.length === 0 ? (
                        <GlassCard className="p-8 text-center border-gray-800/50">
                            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400 font-medium">No turf administrators found</p>
                        </GlassCard>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6 sm:mb-8">
                                <GlassCard className="p-5 sm:p-6 border-purple-500/30 hover:border-purple-500/60 transition-all">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                            <Users size={20} className="text-purple-400" />
                                        </div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Admins</p>
                                    </div>
                                    <p className="text-2xl sm:text-3xl font-black text-purple-400">{adminStats.length}</p>
                                </GlassCard>

                                <GlassCard className="p-5 sm:p-6 border-blue-500/30 hover:border-blue-500/60 transition-all">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                            <Building2 size={20} className="text-blue-400" />
                                        </div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Courts</p>
                                    </div>
                                    <p className="text-2xl sm:text-3xl font-black text-blue-400">
                                        {adminStats.reduce((sum, admin) => sum + admin.totalTurfs, 0)}
                                    </p>
                                </GlassCard>

                                <GlassCard className="p-5 sm:p-6 border-green-500/30 hover:border-green-500/60 transition-all">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
                                            <CalendarCheck size={20} className="text-green-400" />
                                        </div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bookings</p>
                                    </div>
                                    <p className="text-2xl sm:text-3xl font-black text-green-400">
                                        {adminStats.reduce((sum, admin) => sum + admin.totalBookings, 0)}
                                    </p>
                                </GlassCard>

                                <GlassCard className="p-5 sm:p-6 border-yellow-500/30 hover:border-yellow-500/60 transition-all">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                                            <IndianRupee size={20} className="text-yellow-400" />
                                        </div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Revenue</p>
                                    </div>
                                    <p className="text-2xl sm:text-3xl font-black text-yellow-400">
                                        ₹{adminStats.reduce((sum, admin) => sum + admin.totalEarnings, 0).toLocaleString()}
                                    </p>
                                </GlassCard>
                            </div>

                            {/* Admin Details */}
                            <div className="space-y-4 sm:space-y-5">
                                {adminStats.map((admin, index) => (
                                    <GlassCard 
                                        key={admin.adminId} 
                                        className="overflow-hidden border-gray-800/50 hover:border-purple-500/30 transition-all animate-fade-up"
                                        style={{ animationDelay: `${0.8 + index * 0.1}s` }}
                                    >
                                        {/* Admin Header */}
                                        <div 
                                            className="p-5 sm:p-6 cursor-pointer hover:bg-white/[0.02] transition-colors"
                                            onClick={() => toggleAdmin(admin.adminId)}
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1 truncate">{admin.adminName}</h3>
                                                    <p className="text-xs sm:text-sm text-gray-400 font-medium truncate">{admin.adminEmail}</p>
                                                </div>
                                                <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
                                                    <div className="text-right hidden sm:block">
                                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Courts</p>
                                                        <p className="text-lg font-black text-blue-400">{admin.totalTurfs}</p>
                                                    </div>
                                                    <div className="text-right hidden sm:block">
                                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Bookings</p>
                                                        <p className="text-lg font-black text-green-400">{admin.totalBookings}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Earnings</p>
                                                        <p className="text-lg sm:text-xl font-black text-yellow-400">₹{admin.totalEarnings.toLocaleString()}</p>
                                                    </div>
                                                    <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                                                        {expandedAdmins.has(admin.adminId) ? (
                                                            <ChevronUp size={20} className="text-gray-400" />
                                                        ) : (
                                                            <ChevronDown size={20} className="text-gray-400" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Mobile Stats */}
                                            <div className="flex gap-4 mt-4 sm:hidden">
                                                <div className="flex-1 text-center p-3 bg-white/5 rounded-lg border border-gray-800">
                                                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Courts</p>
                                                    <p className="text-lg font-black text-blue-400">{admin.totalTurfs}</p>
                                                </div>
                                                <div className="flex-1 text-center p-3 bg-white/5 rounded-lg border border-gray-800">
                                                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Bookings</p>
                                                    <p className="text-lg font-black text-green-400">{admin.totalBookings}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Courts Details */}
                                        {expandedAdmins.has(admin.adminId) && admin.turfs.length > 0 && (
                                            <div className="border-t border-gray-800/50">
                                                {/* Desktop Table */}
                                                <div className="hidden lg:block overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr className="bg-white/5">
                                                                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider p-4">Court Name</th>
                                                                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider p-4">City</th>
                                                                <th className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider p-4">Price/Hour</th>
                                                                <th className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider p-4">Bookings</th>
                                                                <th className="text-right text-xs font-bold text-gray-400 uppercase tracking-wider p-4">Earnings</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {admin.turfs.map((turf, idx) => (
                                                                <tr key={turf.turfId} className={idx % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                                                                    <td className="p-4 text-sm font-semibold text-white">{turf.turfName}</td>
                                                                    <td className="p-4 text-sm text-gray-400 font-medium">{turf.city}</td>
                                                                    <td className="p-4 text-sm text-center font-bold text-blue-400">₹{turf.pricePerHour}</td>
                                                                    <td className="p-4 text-sm text-center font-bold text-green-400">{turf.totalBookings}</td>
                                                                    <td className="p-4 text-sm text-right font-bold text-yellow-400">₹{turf.totalEarnings.toLocaleString()}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Mobile Cards */}
                                                <div className="lg:hidden p-4 space-y-3">
                                                    {admin.turfs.map((turf) => (
                                                        <div key={turf.turfId} className="p-4 bg-white/5 rounded-xl border border-gray-800">
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex-1">
                                                                    <h4 className="text-base font-bold text-white mb-1">{turf.turfName}</h4>
                                                                    <p className="text-sm text-gray-400 font-medium">{turf.city}</p>
                                                                </div>
                                                                <span className="text-sm font-bold text-blue-400 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                                                                    ₹{turf.pricePerHour}/hr
                                                                </span>
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="flex-1 text-center p-2.5 bg-white/5 rounded-lg border border-gray-800">
                                                                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Bookings</p>
                                                                    <p className="text-base font-black text-green-400">{turf.totalBookings}</p>
                                                                </div>
                                                                <div className="flex-1 text-center p-2.5 bg-white/5 rounded-lg border border-gray-800">
                                                                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Earnings</p>
                                                                    <p className="text-base font-black text-yellow-400">₹{turf.totalEarnings.toLocaleString()}</p>
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
    );
}
