'use client';

import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getLocations, addLocation, deleteLocation, Location } from '@/lib/firebase/firestore';
import { Loader2, MapPin, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ManageLocationsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [newLocationName, setNewLocationName] = useState('');

    useEffect(() => {
        if (user && user.role !== 'super_admin') {
            router.push('/dashboard');
        }
    }, [user, router]);

    useEffect(() => {
        const fetchLocations = async () => {
            const data = await getLocations();
            // Sort by earliest created first or alphabetically
            data.sort((a, b) => a.name.localeCompare(b.name));
            setLocations(data);
            setLoading(false);
        };
        fetchLocations();
    }, []);

    const handleAddLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLocationName.trim()) return;

        setActionLoading('add');
        try {
            const newId = await addLocation(newLocationName.trim());
            const newLocation: Location = {
                id: newId,
                name: newLocationName.trim(),
                createdAt: new Date().toISOString()
            };
            
            const updated = [...locations, newLocation].sort((a, b) => a.name.localeCompare(b.name));
            setLocations(updated);
            setNewLocationName('');
            alert('Location added successfully!');
        } catch (error: any) {
            console.error('Error adding location:', error);
            alert(`Failed to add location: ${error.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteLocation = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete the location "${name}"?`)) return;
        
        setActionLoading(id);
        try {
            await deleteLocation(id);
            setLocations(locations.filter(loc => loc.id !== id));
            alert('Location deleted successfully!');
        } catch (error: any) {
            console.error('Error deleting location:', error);
            alert(`Failed to delete location: ${error.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[var(--turf-green)] w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-up max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back</span>
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30">
                            <MapPin className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-white">Manage Locations</h1>
                    </div>
                    <p className="text-gray-400 ml-14">Add or remove base cities available for courts</p>
                </div>
            </div>

            {/* Add Location Form */}
            <GlassCard className="p-6 border-white/10 shadow-xl">
                <form onSubmit={handleAddLocation} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <Input
                            label="New City / Location Name"
                            placeholder="e.g. Bangalore"
                            value={newLocationName}
                            onChange={(e) => setNewLocationName(e.target.value)}
                            required
                        />
                    </div>
                    <Button 
                        type="submit" 
                        isLoading={actionLoading === 'add'} 
                        className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 h-12 px-8"
                    >
                        <Plus size={18} className="mr-2" /> Add Location
                    </Button>
                </form>
            </GlassCard>

            {/* Locations List */}
            <GlassCard className="overflow-hidden border-white/10 p-0 shadow-xl mt-8">
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <MapPin size={20} className="text-[var(--turf-green)]" />
                        Active Locations
                    </h2>
                    <span className="bg-white/10 text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
                        {locations.length} Total
                    </span>
                </div>
                
                {locations.length === 0 ? (
                    <div className="p-16 text-center bg-gradient-to-br from-white/[0.02] to-white/[0.05]">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-500/20 w-fit mx-auto mb-6">
                            <MapPin className="w-16 h-16 text-emerald-400" />
                        </div>
                        <h3 className="text-xl text-white font-bold mb-2">No locations defined</h3>
                        <p className="text-gray-400 max-w-md mx-auto">Add a new location above to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-6">
                        {locations.map((loc) => (
                            <div 
                                key={loc.id} 
                                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/30 hover:bg-white/10 transition-all group"
                            >
                                <span className="font-medium text-white text-lg">{loc.name}</span>
                                <button
                                    onClick={() => handleDeleteLocation(loc.id, loc.name)}
                                    disabled={actionLoading === loc.id}
                                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                                    title="Delete Location"
                                >
                                    {actionLoading === loc.id ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Trash2 size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
