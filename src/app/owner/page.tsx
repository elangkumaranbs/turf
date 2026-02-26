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
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Owner Dashboard</h1>
                <p className="text-gray-400 mt-1">Welcome back, {user?.displayName || 'Owner'}</p>
            </div>

            {/* Stats Grid */}
            {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => <SkeletonStats key={i} />)}
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {statCards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <GlassCard key={card.label} className={`p-6 border ${card.border}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-xl ${card.bg}`}>
                                        <Icon size={22} className={card.color} />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400">{card.label}</p>
                                <p className={`text-2xl sm:text-3xl font-bold mt-1 ${card.color}`}>
                                    {card.value}
                                </p>
                            </GlassCard>
                        );
                    })}
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <Link href="/owner/courts/add">
                    <GlassCard className="p-6 border-[var(--turf-green)]/20 hover:border-[var(--turf-green)]/50 transition-all cursor-pointer group">
                        <div className="flex items-center gap-4">
                            <div className="p-4 rounded-xl bg-[var(--turf-green)]/10">
                                <PlusCircle size={28} className="text-[var(--turf-green)]" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white group-hover:text-[var(--turf-green)] transition-colors">Add New Court</h3>
                                <p className="text-sm text-gray-400">List your turf and start accepting bookings</p>
                            </div>
                            <ArrowRight size={20} className="text-gray-600 group-hover:text-[var(--turf-green)] transition-colors" />
                        </div>
                    </GlassCard>
                </Link>

                <Link href="/owner/bookings">
                    <GlassCard className="p-6 border-blue-500/20 hover:border-blue-500/50 transition-all cursor-pointer group">
                        <div className="flex items-center gap-4">
                            <div className="p-4 rounded-xl bg-blue-500/10">
                                <CalendarDays size={28} className="text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">View Bookings</h3>
                                <p className="text-sm text-gray-400">See all bookings across your courts</p>
                            </div>
                            <ArrowRight size={20} className="text-gray-600 group-hover:text-blue-400 transition-colors" />
                        </div>
                    </GlassCard>
                </Link>
            </div>
        </div>
    );
}
