'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getOwnerStats, OwnerStats } from '@/lib/firebase/firestore';
import { GlassCard } from '@/components/ui/GlassCard';
import { MapPin, CalendarDays, CheckCircle, TrendingUp, PlusCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function OwnerDashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<OwnerStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (user) {
                const data = await getOwnerStats(user.uid);
                setStats(data);
                setLoading(false);
            }
        };
        fetchStats();
    }, [user]);

    const statCards = [
        {
            label: 'Total Courts',
            value: stats?.totalCourts ?? 0,
            icon: MapPin,
            color: 'text-[var(--turf-green)]',
            bg: 'bg-[var(--turf-green)]/10',
            border: 'border-[var(--turf-green)]/20',
        },
        {
            label: 'Active Courts',
            value: stats?.activeCourts ?? 0,
            icon: CheckCircle,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
        },
        {
            label: 'Total Bookings',
            value: stats?.totalBookings ?? 0,
            icon: CalendarDays,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <GlassCard key={card.label} className={`p-6 border ${card.border}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl ${card.bg}`}>
                                    <Icon size={22} className={card.color} />
                                </div>
                                <TrendingUp size={16} className="text-gray-600" />
                            </div>
                            <p className="text-sm text-gray-400">{card.label}</p>
                            <p className={`text-3xl font-bold mt-1 ${card.color}`}>
                                {loading ? '—' : card.value}
                            </p>
                        </GlassCard>
                    );
                })}
            </div>

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
