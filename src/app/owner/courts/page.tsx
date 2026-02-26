'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getTurfsByAdmin, deleteTurf, updateTurf, Turf } from '@/lib/firebase/firestore';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MapPin, Trash2, Pencil, X, Check, Loader2, Plus, IndianRupee, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Select } from '@/components/ui/Select';

const CITY_OPTIONS = [
    { label: 'Gobichettipalayam', value: 'Gobichettipalayam' },
    { label: 'Erode', value: 'Erode' },
    { label: 'Coimbatore', value: 'Coimbatore' },
    { label: 'Chennai', value: 'Chennai' },
    { label: 'Salem', value: 'Salem' },
    { label: 'Tiruppur', value: 'Tiruppur' },
    { label: 'Madurai', value: 'Madurai' },
    { label: 'Trichy', value: 'Trichy' },
];

export default function MyCourtsPage() {
    const { user } = useAuth();
    const [turfs, setTurfs] = useState<Turf[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Partial<Turf>>({});
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchTurfs = async () => {
        if (user) {
            setLoading(true);
            const data = await getTurfsByAdmin(user.uid);
            setTurfs(data);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTurfs();
    }, [user]);

    const handleDelete = async (turfId: string) => {
        if (!confirm('Are you sure you want to delete this court? This action cannot be undone.')) return;
        setActionLoading(turfId);
        try {
            await deleteTurf(turfId);
            setTurfs(turfs.filter(t => t.id !== turfId));
        } catch (error) {
            alert('Failed to delete court.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleEdit = (turf: Turf) => {
        setEditingId(turf.id);
        setEditData({
            name: turf.name,
            address: turf.address || '',
            city: turf.city || '',
            pricePerHour: turf.pricePerHour,
            description: turf.description,
            operatingHours: turf.operatingHours || { open: '06:00', close: '22:00' },
            courts: turf.courts || 1,
            contactPhone: turf.contactPhone || '',
            contactEmail: turf.contactEmail || '',
        });
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        setActionLoading(editingId);
        try {
            await updateTurf(editingId, editData);
            setTurfs(turfs.map(t => t.id === editingId ? { ...t, ...editData } : t));
            setEditingId(null);
            setEditData({});
        } catch (error) {
            alert('Failed to update court.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditData({});
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[var(--turf-green)] w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">My Courts</h1>
                    <p className="text-gray-400 mt-1">{turfs.length} court{turfs.length !== 1 ? 's' : ''} listed</p>
                </div>
                <Link href="/owner/courts/add">
                    <Button variant="primary" className="gap-2 w-full sm:w-auto">
                        <Plus size={18} /> Add Court
                    </Button>
                </Link>
            </div>

            {turfs.length === 0 ? (
                <GlassCard className="p-12 text-center border-white/10">
                    <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl text-white font-medium">No courts yet</h3>
                    <p className="text-gray-400 mt-2 mb-6">Start by adding your first court to receive bookings.</p>
                    <Link href="/owner/courts/add">
                        <Button variant="primary">Add Your First Court</Button>
                    </Link>
                </GlassCard>
            ) : (
                <div className="space-y-6">
                    {turfs.map((turf) => (
                        <GlassCard key={turf.id} className="p-0 overflow-hidden border-white/10">
                            {editingId === turf.id ? (
                                /* ──── Edit Mode ──── */
                                <div className="p-4 sm:p-6 space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-bold text-white">Edit Court</h3>
                                        <button onClick={handleCancelEdit} className="text-gray-400 hover:text-white">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Court Name"
                                            value={editData.name || ''}
                                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                        />
                                        <Select
                                            label="City"
                                            value={editData.city || ''}
                                            onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                                            options={CITY_OPTIONS}
                                        />
                                        <div className="md:col-span-2">
                                            <Input
                                                label="Address"
                                                value={editData.address || ''}
                                                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                            />
                                        </div>
                                        <Input
                                            label="Price per Hour (₹)"
                                            type="number"
                                            value={String(editData.pricePerHour || '')}
                                            onChange={(e) => setEditData({ ...editData, pricePerHour: Number(e.target.value) })}
                                        />
                                        <Input
                                            label="Number of Courts"
                                            type="number"
                                            value={String(editData.courts || '')}
                                            onChange={(e) => setEditData({ ...editData, courts: Number(e.target.value) })}
                                        />
                                        <Input
                                            label="Opening Time"
                                            type="time"
                                            value={editData.operatingHours?.open || '06:00'}
                                            onChange={(e) => setEditData({ ...editData, operatingHours: { ...editData.operatingHours!, open: e.target.value, close: editData.operatingHours?.close || '22:00' } })}
                                        />
                                        <Input
                                            label="Closing Time"
                                            type="time"
                                            value={editData.operatingHours?.close || '22:00'}
                                            onChange={(e) => setEditData({ ...editData, operatingHours: { ...editData.operatingHours!, close: e.target.value, open: editData.operatingHours?.open || '06:00' } })}
                                        />
                                        <Input
                                            label="Contact Phone"
                                            value={editData.contactPhone || ''}
                                            onChange={(e) => setEditData({ ...editData, contactPhone: e.target.value })}
                                        />
                                        <Input
                                            label="Contact Email"
                                            type="email"
                                            value={editData.contactEmail || ''}
                                            onChange={(e) => setEditData({ ...editData, contactEmail: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300 ml-1">Description</label>
                                        <textarea
                                            className="flex w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-gray-500 focus:border-[var(--turf-green)] focus:ring-1 focus:ring-[var(--turf-green)] focus:outline-none transition-all h-20"
                                            value={editData.description || ''}
                                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <Button onClick={handleSaveEdit} isLoading={actionLoading === turf.id} className="gap-2">
                                            <Check size={16} /> Save Changes
                                        </Button>
                                        <Button variant="secondary" onClick={handleCancelEdit}>Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                /* ──── View Mode ──── */
                                <div className="flex flex-col md:flex-row">
                                    {/* Image */}
                                    <div className="relative w-full md:w-48 lg:w-56 h-44 md:h-auto flex-shrink-0">
                                        <Image
                                            src={turf.images?.[0] || 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=2000&auto=format&fit=crop'}
                                            alt={turf.name}
                                            fill
                                            className="object-cover"
                                        />
                                        <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold uppercase ${turf.status === 'inactive'
                                            ? 'bg-red-500/20 text-red-400 border border-red-500/20'
                                            : 'bg-green-500/20 text-green-400 border border-green-500/20'
                                            }`}>
                                            {turf.status || 'active'}
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-1">{turf.name}</h3>
                                            <div className="flex items-center text-gray-400 text-sm mb-3">
                                                <MapPin size={14} className="mr-1 text-[var(--turf-green)]" />
                                                {turf.address && turf.city
                                                    ? `${turf.address}, ${turf.city}`
                                                    : turf.location || 'Location not specified'
                                                }
                                            </div>
                                            <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <IndianRupee size={14} className="text-[var(--turf-green)]" />
                                                    ₹{turf.pricePerHour}/hr
                                                </span>
                                                {turf.operatingHours && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={14} className="text-[var(--turf-green)]" />
                                                        {turf.operatingHours.open} – {turf.operatingHours.close}
                                                    </span>
                                                )}
                                                <span className="capitalize px-2 py-0.5 rounded bg-white/5 text-gray-300 text-xs">
                                                    {turf.wicketType} wicket
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 pt-4 border-t border-white/10">
                                            <button
                                                onClick={() => handleEdit(turf)}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                                            >
                                                <Pencil size={14} /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(turf.id)}
                                                disabled={actionLoading === turf.id}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-400 bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                            >
                                                {actionLoading === turf.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
}
