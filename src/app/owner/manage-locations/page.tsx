'use client';

import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getLocations, addLocation, deleteLocation, Location } from '@/lib/firebase/firestore';
import { Loader2, MapPin, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ManageLocationsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [locations, setLocations] = useState<Location[]>([]);
    const [newLocation, setNewLocation] = useState('');
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && user && user.role !== 'super_admin') {
            router.push('/dashboard');
        }
    }, [user, loading, router]);

    useEffect(() => {
        const fetchLocations = async () => {
            if (user) {
                setLoading(true);
                const data = await getLocations();
                setLocations(data);
                setLoading(false);
            }
        };
        fetchLocations();
    }, [user]);

    const handleAddLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLocation.trim()) return;

        const exists = locations.some(loc => loc.name.toLowerCase() === newLocation.trim().toLowerCase());
        if (exists) {
            alert('This location already exists!');
            return;
        }

        try {
            setLoading(true);
            await addLocation(newLocation.trim());
            setNewLocation('');
            const data = await getLocations();
            setLocations(data);
        } catch (error) {
            console.error('Error adding location:', error);
            alert('Failed to add location');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLocation = async (id: string) => {
        if (!confirm('Are you sure? Courts in this city won\'t be affected, but new courts can\'t use this location.')) return;

        try {
            setDeleting(id);
            await deleteLocation(id);
            const data = await getLocations();
            setLocations(data);
        } catch (error) {
            console.error('Error deleting location:', error);
            alert('Failed to delete location');
        } finally {
            setDeleting(null);
        }
    };

    if (loading && locations.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[var(--turf-green)] w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-up">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    Manage <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Locations</span>
                </h1>
                <p className="text-gray-400 mt-2 text-lg">Add and manage cities where courts are available.</p>
            </div>

            {/* Add Location Section */}
            <GlassCard className="p-6 sm:p-8 lg:p-10 border-white/5 bg-white/[0.02] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
                <div className="relative z-10 space-y-6">
                    <h3 className="text-xl font-bold text-white border-b border-white/5 pb-3 flex items-center gap-2">
                        <span className="bg-emerald-500/10 text-emerald-400 p-1.5 rounded-lg"><Plus size={18} /></span>
                        Add New Location
                    </h3>
                    <form onSubmit={handleAddLocation} className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <Input
                                label="City Name"
                                placeholder="Enter city name (e.g. Gobichettipalayam)"
                                value={newLocation}
                                onChange={(e) => setNewLocation(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" isLoading={loading} className="gap-2 w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/20">
                            <Plus size={16} /> Add Location
                        </Button>
                    </form>
                </div>
            </GlassCard>

            {/* Locations List */}
            <GlassCard className="p-6 sm:p-8 lg:p-10 border-white/5 bg-white/[0.02]">
                <h3 className="text-xl font-bold text-white border-b border-white/5 pb-3 flex items-center gap-2 mb-6">
                    <span className="bg-teal-500/10 text-teal-400 p-1.5 rounded-lg"><MapPin size={18} /></span>
                    All Locations
                    <span className="ml-auto text-sm font-medium bg-white/10 text-gray-300 px-3 py-1 rounded-full">
                        {locations.length} cities
                    </span>
                </h3>
                {locations.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                            <MapPin className="w-8 h-8 text-gray-600" />
                        </div>
                        <p className="text-gray-400 font-medium">No locations added yet</p>
                        <p className="text-gray-500 text-sm mt-1">Add your first city above to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[...locations].sort((a, b) => a.name.localeCompare(b.name)).map((loc) => (
                            <div key={loc.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-emerald-500/30 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-lg bg-emerald-500/10">
                                        <MapPin size={14} className="text-emerald-400" />
                                    </div>
                                    <span className="text-white font-medium">{loc.name}</span>
                                </div>
                                <button
                                    onClick={() => handleDeleteLocation(loc.id)}
                                    disabled={deleting === loc.id}
                                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                >
                                    {deleting === loc.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
