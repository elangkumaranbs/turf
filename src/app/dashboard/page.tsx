'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { getBookingsByUser, Booking, getTurfById } from '@/lib/firebase/firestore';
import { Loader2, Calendar, Clock, MapPin, AlertCircle, Plus } from 'lucide-react';
import { format } from 'date-fns';

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
                        return {
                            ...booking,
                            turfName: turf?.name || 'Unknown Turf',
                            location: turf?.location || 'Unknown Location'
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
            <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 className="animate-spin text-[var(--turf-green)] w-10 h-10" />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#0a0a0a] pb-12">
            <Navbar />
            <div className="container mx-auto px-6 pt-32">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">My Dashboard</h1>
                        <p className="text-gray-400">Welcome back, {user?.displayName || 'Player'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-400">Total Bookings</p>
                        <p className="text-2xl font-bold text-[var(--turf-green)]">{bookings.length}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Stats / Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <GlassCard className="p-6 border-white/10">
                            <h3 className="text-xl font-semibold text-white mb-4">Profile</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Email</span>
                                    <span className="text-white">{user?.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Member Since</span>
                                    <span className="text-white">Jan 2024</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Role</span>
                                    <span className="text-white capitalize">{user?.role}</span>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="w-full mt-4 text-xs text-red-400 hover:text-red-300 border border-red-500/20 hover:bg-red-500/10 py-2 rounded-lg transition-colors"
                            >
                                Log Out
                            </button>
                        </GlassCard>

                        {/* Admin Actions - Visible to Admins (or all for demo simplicity if needed, but keeping logic strict) */}
                        {(user?.role === 'turf_admin' || user?.role === 'super_admin') && (
                            <GlassCard className="p-6 border-[var(--turf-green)]/20 bg-[var(--turf-green)]/5">
                                <h3 className="text-xl font-semibold text-white mb-4">Admin Console</h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => router.push('/admin/add-turf')}
                                        className="w-full bg-[var(--turf-green)] text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Add New Turf
                                    </button>
                                    <button
                                        onClick={() => router.push('/admin/manage-bookings')}
                                        className="w-full bg-white/10 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/20 transition-colors"
                                    >
                                        Manage Bookings
                                    </button>
                                    {user?.role === 'super_admin' && (
                                        <button
                                            onClick={() => router.push('/admin/users')}
                                            className="w-full bg-purple-500/10 text-purple-400 border border-purple-500/20 px-4 py-2 rounded-lg font-medium hover:bg-purple-500/20 transition-colors"
                                        >
                                            Manage Users (Super Admin)
                                        </button>
                                    )}
                                </div>
                            </GlassCard>
                        )}
                    </div>

                    {/* Bookings List */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-2xl font-bold text-white">Recent Bookings</h2>
                        {bookings.length === 0 ? (
                            <GlassCard className="p-12 text-center border-white/10 flex flex-col items-center">
                                <AlertCircle className="w-12 h-12 text-gray-500 mb-4" />
                                <h3 className="text-xl text-white font-medium">No bookings yet</h3>
                                <p className="text-gray-400 mt-2 mb-6">Start your journey by booking a turf today.</p>
                                <button
                                    onClick={() => router.push('/turfs')}
                                    className="bg-[var(--turf-green)] text-white px-6 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors"
                                >
                                    Browse Turfs
                                </button>
                            </GlassCard>
                        ) : (
                            <div className="space-y-4">
                                {bookings.map((booking) => (
                                    <GlassCard key={booking.id} className="p-6 border-white/10 flex flex-col md:flex-row gap-6 md:items-center justify-between group hover:border-[var(--turf-green)]/30 transition-all">
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-bold text-white group-hover:text-[var(--turf-green)] transition-colors">
                                                {booking.turfName}
                                            </h3>
                                            <div className="flex items-center text-gray-400 text-sm">
                                                <MapPin className="w-4 h-4 mr-1" />
                                                {booking.location}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm pt-2">
                                                <div className="flex items-center text-white bg-white/5 px-3 py-1 rounded-full">
                                                    <Calendar className="w-3 h-3 mr-2 text-[var(--turf-green)]" />
                                                    {format(new Date(booking.date), 'MMM d, yyyy')}
                                                </div>
                                                <div className="flex items-center text-white bg-white/5 px-3 py-1 rounded-full">
                                                    <Clock className="w-3 h-3 mr-2 text-[var(--turf-green)]" />
                                                    {booking.time}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex md:flex-col items-center gap-2 md:items-end">
                                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase ${booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                                                booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {booking.status}
                                            </span>
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
