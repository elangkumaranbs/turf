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
    onBook: (date: string, time: string) => Promise<void>;
    initialDate?: string;
    initialTime?: string;
}

export const SlotPicker = ({ turfId, pricePerHour, onBook, initialDate, initialTime }: SlotPickerProps) => {
    // Helper to parse "YYYY-MM-DD" as local date to avoid timezone issues
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
    const [selectedTime, setSelectedTime] = useState<string | null>(initialTime || null);
    const [bookingLoading, setBookingLoading] = useState(false);

    // Generate next 7 days
    const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

    // Generate slots from 6 AM to 10 PM
    const timeSlots = Array.from({ length: 17 }, (_, i) => {
        const hour = i + 6;
        return `${hour.toString().padStart(2, '0')}:00`;
    });

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
        return bookings.some(b => b.time === time && b.status !== 'cancelled');
    };

    const isSlotPast = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        const slotDate = new Date(selectedDate);
        slotDate.setHours(hours, minutes, 0, 0);
        return slotDate < new Date();
    };

    // Function to handle booking confirmation
    const handleBookClick = async () => {
        if (!user) {
            router.push('/login');
            return;
        }
        if (selectedTime) {
            setBookingLoading(true);
            await onBook(format(selectedDate, 'yyyy-MM-dd'), selectedTime);
            setBookingLoading(false);
            setSelectedTime(null);
            // Refresh bookings
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const data = await getBookingsForTurf(turfId, dateStr);
            setBookings(data);
        }
    };

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
                                onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
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
                <h3 className="text-lg font-semibold text-white">Select Time Slot</h3>
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[var(--turf-green)]" /></div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {timeSlots.map((time) => {
                            const params = { time: bookings }; // unused but kept for structure if needed
                            const booked = isSlotBooked(time);
                            const past = isSlotPast(time);
                            const isSelected = selectedTime === time;
                            const isDisabled = booked || past;

                            return (
                                <button
                                    key={time}
                                    disabled={isDisabled}
                                    onClick={() => setSelectedTime(time)}
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
                <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-300">Selected Slot</span>
                    <span className="font-mono text-white">
                        {format(selectedDate, 'MMM d, yyyy')} • {selectedTime || '--:--'}
                    </span>
                </div>
                <Button
                    className="w-full text-lg h-12"
                    disabled={!selectedTime || bookingLoading}
                    onClick={handleBookClick}
                    isLoading={bookingLoading}
                >
                    {user ? `Confirm Booking (₹${pricePerHour})` : 'Login to Book'}
                </Button>
            </GlassCard>
        </div>
    );
};
