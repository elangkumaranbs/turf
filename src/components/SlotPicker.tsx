'use client';

import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { getBookingsForTurf, Booking } from '@/lib/firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface SlotPickerProps {
    turfId: string;
    pricePerHour: number;
    onBook: (date: string, times: string[]) => Promise<void>;
    operatingHours?: { open: string; close: string };
    initialDate?: string;
    initialTime?: string;
}

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

export const SlotPicker = ({ turfId, pricePerHour, onBook, operatingHours, initialDate, initialTime }: SlotPickerProps) => {
    const parseDate = (dateStr?: string) => {
        if (!dateStr) return new Date();
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    const { user } = useAuth();
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState<Date>(() => parseDate(initialDate));
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedTimes, setSelectedTimes] = useState<string[]>(initialTime ? [initialTime] : []);
    const [bookingLoading, setBookingLoading] = useState(false);

    // Derive time slots from operating hours
    const timeSlots = operatingHours
        ? generateSlotsFromHours(operatingHours.open, operatingHours.close)
        : generateSlotsFromHours('06:00', '22:00');

    // Generate next 7 days
    const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

    useEffect(() => {
        const fetchBookings = async () => {
            setLoading(true);
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const data = await getBookingsForTurf(turfId, dateStr);
            setBookings(data);
            setLoading(false);
        };
        fetchBookings();
    }, [turfId, selectedDate]);

    const isSlotBooked = (time: string) => {
        return bookings.some(b => {
            if (b.status === 'cancelled') return false;
            // Support both old single-time and new multi-time bookings
            if (b.times && b.times.length > 0) {
                return b.times.includes(time);
            }
            return b.time === time;
        });
    };

    const isSlotPast = (time: string) => {
        const [timePart, period] = time.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        const slotDate = new Date(selectedDate);
        slotDate.setHours(hours, minutes, 0, 0);
        return slotDate < new Date();
    };

    const toggleSlot = (time: string) => {
        setSelectedTimes(prev =>
            prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
        );
    };

    const handleBookClick = async () => {
        if (!user) {
            router.push('/login');
            return;
        }
        if (selectedTimes.length > 0) {
            setBookingLoading(true);
            await onBook(format(selectedDate, 'yyyy-MM-dd'), selectedTimes);
            setBookingLoading(false);
            setSelectedTimes([]);
            // Refresh bookings
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const data = await getBookingsForTurf(turfId, dateStr);
            setBookings(data);
        }
    };

    const totalPrice = selectedTimes.length * pricePerHour;

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Select Date</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {dates.map((date) => {
                        const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                        return (
                            <button
                                key={date.toISOString()}
                                onClick={() => { setSelectedDate(date); setSelectedTimes([]); }}
                                className={`flex flex-col items-center justify-center min-w-[70px] p-3 rounded-xl border transition-all ${isSelected
                                    ? 'bg-[var(--turf-green)] border-[var(--turf-green)] text-black'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                                    }`}
                            >
                                <span className="text-xs font-medium uppercase">{format(date, 'EEE')}</span>
                                <span className="text-lg font-bold">{format(date, 'd')}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Select Time Slots</h3>
                    {selectedTimes.length > 0 && (
                        <span className="text-xs text-[var(--turf-green)] bg-[var(--turf-green)]/10 px-2.5 py-1 rounded-full border border-[var(--turf-green)]/20">
                            {selectedTimes.length} selected
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-500">Tap to select multiple slots</p>
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[var(--turf-green)]" /></div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {timeSlots.map((time) => {
                            const booked = isSlotBooked(time);
                            const past = isSlotPast(time);
                            const isSelected = selectedTimes.includes(time);
                            const isDisabled = booked || past;

                            return (
                                <button
                                    key={time}
                                    disabled={isDisabled}
                                    onClick={() => toggleSlot(time)}
                                    className={`p-2 rounded-lg text-sm font-medium border transition-all ${isDisabled
                                        ? 'bg-white/5 border-white/5 text-gray-600 cursor-not-allowed opacity-50'
                                        : isSelected
                                            ? 'bg-[var(--turf-green)] border-[var(--turf-green)] text-black shadow-[0_0_15px_rgba(46,204,113,0.4)]'
                                            : 'bg-white/5 border-white/10 text-gray-300 hover:border-[var(--turf-green)]/50'
                                        }`}
                                >
                                    {time}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <GlassCard className="mt-6 border-[var(--turf-green)]/20 bg-[var(--turf-green)]/5">
                <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-300">Selected Date</span>
                        <span className="font-mono text-white">{format(selectedDate, 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex justify-between items-start">
                        <span className="text-gray-300">Selected Slots</span>
                        <div className="text-right">
                            {selectedTimes.length > 0 ? (
                                <div className="flex flex-wrap justify-end gap-1">
                                    {selectedTimes.map(t => (
                                        <span key={t} className="text-xs bg-[var(--turf-green)]/20 text-[var(--turf-green)] px-2 py-0.5 rounded-full">{t}</span>
                                    ))}
                                </div>
                            ) : (
                                <span className="font-mono text-gray-500">None</span>
                            )}
                        </div>
                    </div>
                    {selectedTimes.length > 0 && (
                        <div className="flex justify-between items-center pt-2 border-t border-white/10">
                            <span className="text-gray-300">Total</span>
                            <span className="text-lg font-bold text-[var(--turf-green)]">
                                {selectedTimes.length} × ₹{pricePerHour} = ₹{totalPrice}
                            </span>
                        </div>
                    )}
                </div>
                <Button
                    className="w-full text-lg h-12"
                    disabled={selectedTimes.length === 0 || bookingLoading}
                    onClick={handleBookClick}
                    isLoading={bookingLoading}
                >
                    {user
                        ? selectedTimes.length > 0
                            ? `Confirm Booking (₹${totalPrice})`
                            : 'Select Time Slots'
                        : 'Login to Book'
                    }
                </Button>
            </GlassCard>
        </div>
    );
};
