'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { getTurfs, Turf } from '@/lib/firebase/firestore';

export const BookingWidget = () => {
    const router = useRouter();
    const [date, setDate] = useState<string>('');
    const [time, setTime] = useState<string>('');
    const [turfs, setTurfs] = useState<Turf[]>([]);
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [selectedTurfId, setSelectedTurfId] = useState<string>('');

    useEffect(() => {
        const fetchData = async () => {
            const data = await getTurfs();
            setTurfs(data);
        };
        fetchData();
    }, []);

    // Unique cities from turfs
    const cities = useMemo(() => {
        const citySet = [...new Set(turfs.map(t => t.city || t.location || '').filter(Boolean))].sort();
        return citySet;
    }, [turfs]);

    // Venues filtered by selected city
    const venues = useMemo(() => {
        if (!selectedCity) return turfs;
        return turfs.filter(t => (t.city || t.location) === selectedCity);
    }, [turfs, selectedCity]);

    // Auto-select first city if available
    useEffect(() => {
        if (cities.length > 0 && !selectedCity) {
            setSelectedCity(cities[0]);
        }
    }, [cities]);

    // Auto-select first venue when city changes
    useEffect(() => {
        if (venues.length > 0) {
            setSelectedTurfId(venues[0].id);
        } else {
            setSelectedTurfId('');
        }
    }, [venues]);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const currentHour = new Date().getHours();

    const allTimeOptions = [
        { label: '06:00 AM', value: '06:00 AM' },
        { label: '07:00 AM', value: '07:00 AM' },
        { label: '08:00 AM', value: '08:00 AM' },
        { label: '09:00 AM', value: '09:00 AM' },
        { label: '10:00 AM', value: '10:00 AM' },
        { label: '11:00 AM', value: '11:00 AM' },
        { label: '12:00 PM', value: '12:00 PM' },
        { label: '01:00 PM', value: '01:00 PM' },
        { label: '02:00 PM', value: '02:00 PM' },
        { label: '03:00 PM', value: '03:00 PM' },
        { label: '04:00 PM', value: '04:00 PM' },
        { label: '05:00 PM', value: '05:00 PM' },
        { label: '06:00 PM', value: '06:00 PM' },
        { label: '07:00 PM', value: '07:00 PM' },
        { label: '08:00 PM', value: '08:00 PM' },
        { label: '09:00 PM', value: '09:00 PM' },
        { label: '10:00 PM', value: '10:00 PM' },
    ];

    const parse12hTo24h = (timeStr: string): number => {
        const [time, period] = timeStr.split(' ');
        let hour = parseInt(time);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        return hour;
    };

    const availableTimeOptions = [
        { label: 'Select Time', value: '' },
        ...allTimeOptions.filter(opt => {
            if (date === todayStr) {
                return parse12hTo24h(opt.value) > currentHour;
            }
            return true;
        })
    ];

    const handleSearch = () => {
        if (!selectedTurfId) return;
        const params = new URLSearchParams();
        if (date) params.set('date', date);
        if (time) params.set('time', time);
        router.push(`/turfs/${selectedTurfId}?${params.toString()}`);
    };

    return (
        <GlassCard className="w-full max-w-md p-6 space-y-6 relative z-10 border-white/20 shadow-2xl shadow-black/50" hoverEffect={false}>
            <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Discover and book top quality courts.</h3>
            </div>

            <div className="space-y-4">
                {/* Location */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300 ml-1">City</label>
                    <div className="relative">
                        <Select
                            options={[
                                { label: 'All Cities', value: '' },
                                ...cities.map(c => ({ label: c, value: c }))
                            ]}
                            className="pl-10"
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                        />
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Venues */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300 ml-1">Venues</label>
                    <Select
                        options={[
                            ...venues.map(v => ({ label: v.name, value: v.id }))
                        ]}
                        value={selectedTurfId}
                        onChange={(e) => setSelectedTurfId(e.target.value)}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
