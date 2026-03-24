'use client';

import { useEffect, useState, useCallback } from 'react';
import { format, addDays } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { getTurfsByAdmin, getBookingsForTurf, createOfflineBlock, deleteBooking, Turf, Booking } from '@/lib/firebase/firestore';
import { createRazorpayOrder, initiatePayment, verifyPayment } from '@/lib/razorpay';
import type { RazorpaySuccessResponse } from '@/lib/razorpay';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Loader2, Lock, LockOpen, CalendarOff, WifiOff, User, Trash2, ChevronDown, Banknote, CreditCard, IndianRupee } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Generate time slots from operating hours
const generateSlotsFromHours = (open: string, close: string): string[] => {
    const [openH] = open.split(':').map(Number);
    const [closeH] = close.split(':').map(Number);
    const startHour = isNaN(openH) ? 6 : openH;
    const endHour = isNaN(closeH) ? 22 : closeH;
    const slots: string[] = [];
    for (let h = startHour; h < endHour; h++) {
        const period = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 === 0 ? 12 : h % 12;
        slots.push(`${hour12.toString().padStart(2, '0')}:00 ${period}`);
    }
    return slots;
};

export default function BlockSlotsPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [turfs, setTurfs] = useState<Turf[]>([]);
    const [selectedTurfId, setSelectedTurfId] = useState('');
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
    const [customerName, setCustomerName] = useState('');
    const [paymentMode, setPaymentMode] = useState<'cash' | 'online'>('cash');
    const [loadingTurfs, setLoadingTurfs] = useState(true);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [blocking, setBlocking] = useState(false);
    const [unlocking, setUnlocking] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState('');

    // Fetch owner's turfs
    useEffect(() => {
        if (!user) return;
        if (user.role !== 'turf_admin' && user.role !== 'super_admin') {
            router.push('/owner');
            return;
        }
        const fetchTurfs = async () => {
            setLoadingTurfs(true);
            const data = await getTurfsByAdmin(user.uid);
            setTurfs(data);
            if (data.length > 0) setSelectedTurfId(data[0].id);
            setLoadingTurfs(false);
        };
        fetchTurfs();
    }, [user]);

    // Fetch bookings whenever turf or date changes
    const fetchBookings = useCallback(async () => {
        if (!selectedTurfId || !selectedDate) return;
        setLoadingSlots(true);
        setSelectedSlots([]);
        const data = await getBookingsForTurf(selectedTurfId, selectedDate);
        setBookings(data);
        setLoadingSlots(false);
    }, [selectedTurfId, selectedDate]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const selectedTurf = turfs.find(t => t.id === selectedTurfId);
    const timeSlots = selectedTurf?.operatingHours
        ? generateSlotsFromHours(selectedTurf.operatingHours.open, selectedTurf.operatingHours.close)
        : generateSlotsFromHours('06:00', '22:00');

    const pricePerHour = selectedTurf?.pricePerHour || 0;
    const totalAmount = selectedSlots.length * pricePerHour;

    const isSlotBooked = (time: string) => {
        return bookings.some(b => {
            if (b.status === 'cancelled') return false;
            if (b.times && b.times.length > 0) return b.times.includes(time);
            return b.time === time;
        });
    };

    const isSlotPast = (time: string) => {
        const [timePart, period] = time.split(' ');
        let [hours] = timePart.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        const slotDate = new Date(`${selectedDate}T00:00:00`);
        slotDate.setHours(hours, 0, 0, 0);
        return slotDate < new Date();
    };

    const toggleSlot = (time: string) => {
        if (isSlotBooked(time) || isSlotPast(time)) return;
        setSelectedSlots(prev =>
            prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
        );
    };

    // ─── Cash Block ───────────────────────────────────────────────────
    const handleBlockCash = async () => {
        if (!user || !selectedTurfId || selectedSlots.length === 0) return;
        setBlocking(true);
        try {
            await createOfflineBlock(selectedTurfId, user.uid, selectedDate, selectedSlots, customerName.trim() || undefined, {
                paymentMode: 'cash',
            });
            setSuccessMsg(`${selectedSlots.length} slot${selectedSlots.length > 1 ? 's' : ''} blocked (Cash) ✓`);
            setSelectedSlots([]);
            setCustomerName('');
            setTimeout(() => setSuccessMsg(''), 3500);
            await fetchBookings();
        } catch (e) {
            console.error(e);
            alert('Failed to block slots. Please try again.');
        } finally {
            setBlocking(false);
        }
    };

    // ─── Online Payment Block (Razorpay) ──────────────────────────────
    const handleBlockOnline = async () => {
        if (!user || !selectedTurfId || selectedSlots.length === 0 || !selectedTurf) return;
        setBlocking(true);
        try {
            // Step 1: Create Razorpay order
            const orderData = await createRazorpayOrder({
                amount: totalAmount,
                turfId: selectedTurf.id,
                turfName: selectedTurf.name,
                slots: selectedSlots,
                date: selectedDate,
                userId: user.uid,
            });

            // Step 2: Open Razorpay checkout
            await initiatePayment({
                orderId: orderData.orderId,
                amount: orderData.amount,
                currency: orderData.currency,
                turfName: selectedTurf.name,
                userName: customerName.trim() || user.displayName || '',
                userEmail: user.email || '',
                userPhone: user.phone || '',
                onSuccess: async (response: RazorpaySuccessResponse) => {
                    try {
                        // Step 3: Verify payment
                        const verification = await verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            bookingData: {
                                userId: user.uid,
                                turfId: selectedTurf.id,
                                date: selectedDate,
                                times: selectedSlots,
                            },
                        });

                        if (verification.verified) {
                            // Step 4: Create the offline block with payment info
                            await createOfflineBlock(
                                selectedTurf.id,
                                user.uid,
                                selectedDate,
                                selectedSlots,
                                customerName.trim() || undefined,
                                {
                                    paymentMode: 'online',
                                    paymentId: verification.paymentId,
                                    orderId: verification.orderId,
                                    amountPaid: orderData.amount,
                                }
                            );

                            setSuccessMsg(`${selectedSlots.length} slot${selectedSlots.length > 1 ? 's' : ''} blocked (Online Payment ₹${totalAmount}) ✓`);
                            setSelectedSlots([]);
                            setCustomerName('');
                            setTimeout(() => setSuccessMsg(''), 4000);
                            await fetchBookings();
                        }
                    } catch (verifyError: any) {
                        console.error('Verification error:', verifyError);
                        alert(`Payment received but verification failed. Please contact support with Payment ID: ${response.razorpay_payment_id}`);
                    } finally {
                        setBlocking(false);
                    }
                },
                onFailure: async (error) => {
                    console.error('Payment failed:', error);
                    alert(`Payment failed: ${error.description || 'Please try again.'}`);
                    setBlocking(false);
                },
                onDismiss: async () => {
                    setBlocking(false);
                },
            });
        } catch (error: any) {
            console.error('Booking error:', error);
            alert(`Failed to initiate payment: ${error.message}`);
            setBlocking(false);
        }
    };

    const handleBlockSlots = () => {
        if (paymentMode === 'cash') {
            handleBlockCash();
        } else {
            handleBlockOnline();
        }
    };

    const handleUnblock = async (bookingId: string) => {
        if (!bookingId) return;
        setUnlocking(bookingId);
        try {
            await deleteBooking(bookingId);
            await fetchBookings();
        } catch (e) {
            console.error(e);
        } finally {
            setUnlocking(null);
        }
    };

    // Offline blocks for the selected turf+date
    const offlineBlocks = bookings.filter(b => b.bookingType === 'offline' && b.status !== 'cancelled');
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    if (loadingTurfs) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="animate-spin text-[var(--turf-green)] w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-up">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    Block <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">Offline Slots</span>
                </h1>
                <p className="text-gray-400 mt-2 text-base sm:text-lg">
                    Mark time slots as booked for walk-in or phone reservations so they won&apos;t be available online.
                </p>
            </div>

            {turfs.length === 0 ? (
                <GlassCard className="p-12 text-center border-white/5">
                    <CalendarOff className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">You have no courts listed yet.</p>
                </GlassCard>
            ) : (
                <>
                    {/* Controls */}
                    <GlassCard className="p-5 sm:p-6 border-orange-500/20 bg-orange-500/5 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Turf Selector */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-300">Select Court</label>
                                <div className="relative">
                                    <select
                                        value={selectedTurfId}
                                        onChange={e => { setSelectedTurfId(e.target.value); setSelectedSlots([]); }}
                                        className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 pr-10 text-sm font-medium text-white focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 focus:outline-none transition-all cursor-pointer"
                                    >
                                        {turfs.map(t => (
                                            <option key={t.id} value={t.id} className="bg-[#1a1a1a]">{t.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Date Picker */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-300">Select Date</label>
                                <input
                                    type="date"
                                    min={todayStr}
                                    value={selectedDate}
                                    onChange={e => { setSelectedDate(e.target.value); setSelectedSlots([]); }}
                                    className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 focus:outline-none transition-all [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                />
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-4 pt-1 text-xs font-medium text-gray-400">
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white/5 border border-white/10 inline-block" />Available</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-500/30 border border-orange-500/50 inline-block" />Selected to block</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30 inline-block" />Offline blocked</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[var(--turf-green)]/20 border border-[var(--turf-green)]/30 inline-block" />Online booked</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white/5 border border-white/5 opacity-40 inline-block" />Past / Unavailable</span>
                        </div>
                    </GlassCard>

                    {/* Slot Grid */}
                    <GlassCard className="p-5 sm:p-6 border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white">Time Slots</h2>
                            {selectedSlots.length > 0 && (
                                <span className="text-xs text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
                                    {selectedSlots.length} selected
                                </span>
                            )}
                        </div>

                        {loadingSlots ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="animate-spin text-orange-400 w-7 h-7" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                                {timeSlots.map(time => {
                                    const past = isSlotPast(time);
                                    const booked = isSlotBooked(time);
                                    const isSelected = selectedSlots.includes(time);
                                    const isOfflineBlock = bookings.some(b =>
                                        b.bookingType === 'offline' && b.status !== 'cancelled' &&
                                        (b.times?.includes(time) || b.time === time)
                                    );
                                    const isOnlineBooked = booked && !isOfflineBlock;

                                    let cls = '';
                                    let icon = null;

                                    if (past || (booked && !isOfflineBlock && !isSelected)) {
                                        cls = 'bg-white/5 border-white/5 text-gray-600 cursor-not-allowed opacity-40';
                                    } else if (isOfflineBlock) {
                                        cls = 'bg-red-500/15 border-red-500/40 text-red-300 cursor-not-allowed';
                                        icon = <Lock size={11} className="inline-block ml-1 opacity-70" />;
                                    } else if (isOnlineBooked) {
                                        cls = 'bg-[var(--turf-green)]/10 border-[var(--turf-green)]/30 text-[var(--turf-green)] opacity-70 cursor-not-allowed';
                                    } else if (isSelected) {
                                        cls = 'bg-orange-500/30 border-orange-500 text-orange-200 shadow-[0_0_12px_rgba(249,115,22,0.3)] cursor-pointer';
                                    } else {
                                        cls = 'bg-white/5 border-white/10 text-gray-300 hover:border-orange-500/50 hover:bg-orange-500/10 cursor-pointer';
                                    }

                                    return (
                                        <button
                                            key={time}
                                            disabled={past || (booked && !isSelected)}
                                            onClick={() => toggleSlot(time)}
                                            className={`p-2.5 rounded-lg text-xs sm:text-sm font-medium border transition-all ${cls}`}
                                        >
                                            {time}{icon}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Block action form */}
                        {selectedSlots.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                                {/* Customer Name */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-300 flex items-center gap-1.5">
                                        <User size={14} className="text-gray-400" />
                                        Customer Name <span className="text-gray-600 font-normal">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Ravi walk-in"
                                        value={customerName}
                                        onChange={e => setCustomerName(e.target.value)}
                                        className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-gray-600 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 focus:outline-none transition-all"
                                    />
                                </div>

                                {/* ── Payment Mode Toggle ── */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-300">Payment Mode</label>
                                    <div className="flex bg-white/5 rounded-xl p-1 border border-white/10 max-w-sm">
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMode('cash')}
                                            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                                                paymentMode === 'cash'
                                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/20'
                                                    : 'text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            <Banknote size={16} /> Cash
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMode('online')}
                                            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                                                paymentMode === 'online'
                                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20'
                                                    : 'text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            <CreditCard size={16} /> Online Payment
                                        </button>
                                    </div>
                                </div>

                                {/* Total amount preview for online */}
                                {paymentMode === 'online' && pricePerHour > 0 && (
                                    <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
                                        <IndianRupee size={18} className="text-blue-400 shrink-0" />
                                        <div>
                                            <p className="text-sm text-blue-300 font-semibold">
                                                Total: ₹{totalAmount.toLocaleString('en-IN')}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''} × ₹{pricePerHour}/hr — Razorpay checkout will open
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Action buttons */}
                                <div className="flex items-center gap-3 flex-wrap">
                                    <Button
                                        onClick={handleBlockSlots}
                                        disabled={blocking}
                                        isLoading={blocking}
                                        className={`h-11 px-6 font-bold border shadow-lg ${
                                            paymentMode === 'cash'
                                                ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-400/50 shadow-orange-500/30'
                                                : 'bg-blue-500 hover:bg-blue-600 text-white border-blue-400/50 shadow-blue-500/30'
                                        }`}
                                    >
                                        {paymentMode === 'cash' ? (
                                            <><Lock size={15} className="mr-2" /> Block {selectedSlots.length} Slot{selectedSlots.length > 1 ? 's' : ''} (Cash)</>
                                        ) : (
                                            <><CreditCard size={15} className="mr-2" /> Pay & Block {selectedSlots.length} Slot{selectedSlots.length > 1 ? 's' : ''}</>
                                        )}
                                    </Button>
                                    <button
                                        onClick={() => setSelectedSlots([])}
                                        className="h-11 px-4 text-sm text-gray-400 hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-all"
                                    >
                                        Clear Selection
                                    </button>
                                </div>
                                {successMsg && (
                                    <div className="flex items-center gap-2 text-sm font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-4 py-2.5 rounded-xl animate-fade-up">
                                        <span>✓</span> {successMsg}
                                    </div>
                                )}
                            </div>
                        )}
                        {successMsg && selectedSlots.length === 0 && (
                            <div className="flex items-center gap-2 text-sm font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-4 py-2.5 rounded-xl animate-fade-up">
                                <span>✓</span> {successMsg}
                            </div>
                        )}
                    </GlassCard>

                    {/* Offline Blocks List */}
                    {offlineBlocks.length > 0 && (
                        <GlassCard className="p-5 sm:p-6 border-red-500/20 bg-red-500/5 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-red-500/15 border border-red-500/20">
                                    <WifiOff size={18} className="text-red-400" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">Offline Blocked Slots</h2>
                                    <p className="text-xs text-gray-500">
                                        {format(new Date(`${selectedDate}T00:00:00`), 'MMMM d, yyyy')} — {selectedTurf?.name}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {offlineBlocks.map(block => (
                                    <div
                                        key={block.id}
                                        className="flex items-center justify-between gap-4 p-4 bg-white/[0.03] rounded-xl border border-red-500/15 hover:border-red-500/30 transition-all"
                                    >
                                        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                                            <Lock size={14} className="text-red-400 shrink-0" />
                                            <div className="flex flex-wrap gap-1.5">
                                                {(block.times?.length > 0 ? block.times : [block.time!]).map(t => (
                                                    <span
                                                        key={t}
                                                        className="text-xs font-semibold text-red-300 bg-red-500/15 border border-red-500/25 px-2 py-0.5 rounded-md"
                                                    >
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                            {block.customerName && (
                                                <span className="text-xs text-gray-500 flex items-center gap-1 ml-1">
                                                    <User size={11} />
                                                    {block.customerName}
                                                </span>
                                            )}
                                            {/* Payment mode badge */}
                                            {block.paymentMode === 'online' ? (
                                                <span className="text-[10px] font-bold text-blue-400 bg-blue-500/15 border border-blue-500/25 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                    <CreditCard size={10} /> Online
                                                    {block.amountPaid != null && (
                                                        <span className="ml-0.5">₹{(block.amountPaid / 100).toLocaleString('en-IN')}</span>
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                    <Banknote size={10} /> Cash
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleUnblock(block.id!)}
                                            disabled={unlocking === block.id}
                                            className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-green-400 border border-white/10 hover:border-green-500/30 px-3 py-1.5 rounded-lg transition-all shrink-0 disabled:opacity-50"
                                        >
                                            {unlocking === block.id ? (
                                                <Loader2 size={13} className="animate-spin" />
                                            ) : (
                                                <LockOpen size={13} />
                                            )}
                                            Unblock
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    )}
                </>
            )}
        </div>
    );
}
