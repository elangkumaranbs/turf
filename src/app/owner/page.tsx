'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getOwnerStats, OwnerStats, getBookingsByOwner, Booking, getTurfsByAdmin, Turf } from '@/lib/firebase/firestore';
import { GlassCard } from '@/components/ui/GlassCard';
import { MapPin, CalendarDays, TrendingUp, PlusCircle, ArrowRight, DollarSign, Calendar, Activity } from 'lucide-react';
import Link from 'next/link';
import { SkeletonStats } from '@/components/ui/SkeletonLoader';

export default function OwnerDashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<OwnerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState<(Booking & { turfName?: string; city?: string; location?: string })[]>([]);
    const [turfs, setTurfs] = useState<Turf[]>([]);

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
        return bookingDate.getTime() === today.getTime();
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 pt-4 animate-fade-up" style={{ animationDelay: '0.6s' }}>
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
            </div>
        </div>
    );
}
