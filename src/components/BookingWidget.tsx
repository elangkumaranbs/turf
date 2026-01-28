'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';

export const BookingWidget = () => {
    const router = useRouter();
    const [date, setDate] = useState<string>('');
    const [time, setTime] = useState<string>('');

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const currentHour = new Date().getHours();

    const allTimeOptions = [
        { label: '06:00', value: '06:00' },
        { label: '07:00', value: '07:00' },
        { label: '08:00', value: '08:00' },
        { label: '09:00', value: '09:00' },
        { label: '10:00', value: '10:00' },
        { label: '11:00', value: '11:00' },
        { label: '12:00', value: '12:00' },
        { label: '13:00', value: '13:00' },
        { label: '14:00', value: '14:00' },
        { label: '15:00', value: '15:00' },
        { label: '16:00', value: '16:00' },
        { label: '17:00', value: '17:00' },
        { label: '18:00', value: '18:00' },
        { label: '19:00', value: '19:00' },
        { label: '20:00', value: '20:00' },
        { label: '21:00', value: '21:00' },
        { label: '22:00', value: '22:00' },
    ];

    const availableTimeOptions = [
        { label: 'Select Time', value: '' },
        ...allTimeOptions.filter(opt => {
            if (date === todayStr) {
                return parseInt(opt.value) > currentHour;
            }
            return true;
        })
    ];

    const handleSearch = () => {
        // Redirect to Pony Turf details page with selected date and time
        const params = new URLSearchParams();
        if (date) params.set('date', date);
        if (time) params.set('time', time);
        router.push(`/turfs/pony-turf?${params.toString()}`);
    };

    return (
        <GlassCard className="w-full max-w-md p-6 space-y-6 relative z-10 border-white/20 shadow-2xl shadow-black/50" hoverEffect={false}>
            <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Discover and book top quality courts.</h3>
            </div>

            <div className="space-y-4">
                {/* Location */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300 ml-1">Location</label>
                    <div className="relative">
                        <Select
                            options={[
                                { label: 'Gobichettipalayam', value: 'gobichettipalayam' },
                            ]}
                            className="pl-10"
                            defaultValue="gobichettipalayam"
                        />
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Venues */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300 ml-1">Venues</label>
                    <Select
                        options={[
                            { label: 'Pony Turf', value: 'pony_turf' },
                        ]}
                        defaultValue="pony_turf"
                    />
                </div>

                {/* Duration */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300 ml-1">Duration</label>
                    <Select
                        options={[
                            { label: '60 Minutes', value: '60' },
                            { label: '90 Minutes', value: '90' },
                            { label: '120 Minutes', value: '120' },
                        ]}
                    />
                </div>

                {/* Date & Time Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-300 ml-1">Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                min={todayStr}
                                className="flex h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-gray-500 focus:border-[var(--turf-green)] focus:ring-1 focus:ring-[var(--turf-green)] focus:outline-none transition-all [&::-webkit-calendar-picker-indicator]:invert"
                                onChange={(e) => {
                                    setDate(e.target.value);
                                    setTime(''); // Reset time when date changes to prevent invalid old time selection
                                }}
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-300 ml-1">Time</label>
                        <div className="relative">
                            <Select
                                options={availableTimeOptions}
                                onChange={(e) => setTime(e.target.value)}
                                value={time}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Button className="w-full text-lg font-semibold py-6" size="lg" onClick={handleSearch}>
                Book Court Now
            </Button>
        </GlassCard>
    );
};
