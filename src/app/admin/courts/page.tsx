'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAllTurfsWithOwners, deleteTurf, updateTurf, addTurf, Turf, getAllUsers } from '@/lib/firebase/firestore';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { MapPin, Trash2, Pencil, X, Check, Loader2, Plus, IndianRupee, Clock, User, Building2, Search, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { formatTime12Hour } from '@/lib/utils';

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

export default function AdminCourtsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [turfs, setTurfs] = useState<(Turf & { ownerName?: string; ownerEmail?: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Partial<Turf>>({});
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [turfAdmins, setTurfAdmins] = useState<Array<{ uid: string; name: string; email: string; role: string }>>([]);
    
    const [createFormData, setCreateFormData] = useState({
        name: '',
        address: '',
        city: 'Gobichettipalayam',
        pricePerHour: '',
        description: '',
        wicketType: 'turf' as 'turf' | 'mat' | 'cement',
        courts: '1',
        contactPhone: '',
        contactEmail: '',
        openTime: '06:00',
        closeTime: '22:00',
        adminId: '',
        amenities: [] as string[],
        imageUrl: ''
    });

    useEffect(() => {
        if (user && user.role !== 'super_admin') {
            router.push('/dashboard');
        }
    }, [user, router]);

    const fetchTurfs = async () => {
        setLoading(true);
        const data = await getAllTurfsWithOwners();
        setTurfs(data);
        setLoading(false);
    };

    const fetchTurfAdmins = async () => {
        const users = await getAllUsers();
        const admins = users.filter(u => u.role === 'turf_admin' || u.role === 'super_admin');
        setTurfAdmins(admins);
    };

    useEffect(() => {
        fetchTurfs();
        fetchTurfAdmins();
    }, []);

    const handleDelete = async (turfId: string) => {
        if (!confirm('⚠️ Are you sure you want to delete this court?\n\nThis will permanently delete:\n• The court/turf\n• All bookings for this court\n\nThis action cannot be undone!')) return;
        setActionLoading(turfId);
        try {
            await deleteTurf(turfId);
            setTurfs(turfs.filter(t => t.id !== turfId));
            alert('✅ Court and all associated bookings deleted successfully!');
        } catch (error) {
            alert(`Failed to delete court: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleEdit = (turf: Turf & { ownerName?: string; ownerEmail?: string }) => {
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
            status: turf.status || 'active',
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
            alert('Court updated successfully!');
        } catch (error) {
            alert(`Failed to update court: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditData({});
    };

    const handleCreateCourt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createFormData.adminId) {
            alert('Please select a turf admin');
            return;
        }
        setActionLoading('create');
        try {
            await addTurf({
                name: createFormData.name,
                address: createFormData.address,
                city: createFormData.city,
                pricePerHour: Number(createFormData.pricePerHour),
                description: createFormData.description,
                wicketType: createFormData.wicketType,
                images: createFormData.imageUrl ? [createFormData.imageUrl] : ['https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=2000&auto=format&fit=crop'],
                amenities: createFormData.amenities,
                courts: Number(createFormData.courts),
                contactPhone: createFormData.contactPhone,
                contactEmail: createFormData.contactEmail,
                operatingHours: {
                    open: createFormData.openTime,
                    close: createFormData.closeTime,
                },
                status: 'active',
            }, createFormData.adminId);

            // Refresh turfs list
            await fetchTurfs();
            
            // Reset form and close modal
            setCreateFormData({
                name: '',
                address: '',
                city: 'Gobichettipalayam',
                pricePerHour: '',
                description: '',
                wicketType: 'turf',
                courts: '1',
                contactPhone: '',
                contactEmail: '',
                openTime: '06:00',
                closeTime: '22:00',
                adminId: '',
                amenities: [],
                imageUrl: ''
            });
            setShowCreateModal(false);
            alert('Court created successfully!');
        } catch (error) {
            console.error('Error creating court:', error);
            alert(`Failed to create court: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredTurfs = turfs.filter(turf =>
        turf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        turf.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        turf.ownerName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[var(--turf-green)] w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
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
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30">
                            <Building2 className="w-6 h-6 text-orange-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-white">Courts Management</h1>
                    </div>
                    <p className="text-gray-400 ml-14">Manage {turfs.length} court{turfs.length !== 1 ? 's' : ''} across all turf admins</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} className="gap-2 w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/20">
                    <Plus size={18} /> Add New Court
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <GlassCard className="p-4 border-white/10 hover:border-orange-500/30 transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Courts</p>
                            <p className="text-2xl font-bold text-white">{turfs.length}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                            <Building2 className="w-5 h-5 text-orange-400" />
                        </div>
                    </div>
                </GlassCard>
                <GlassCard className="p-4 border-white/10 hover:border-green-500/30 transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Active</p>
                            <p className="text-2xl font-bold text-white">{turfs.filter(t => t.status === 'active' || !t.status).length}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                            <Check className="w-5 h-5 text-green-400" />
                        </div>
                    </div>
                </GlassCard>
                <GlassCard className="p-4 border-white/10 hover:border-red-500/30 transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Inactive</p>
                            <p className="text-2xl font-bold text-white">{turfs.filter(t => t.status === 'inactive').length}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                            <X className="w-5 h-5 text-red-400" />
                        </div>
                    </div>
                </GlassCard>
                <GlassCard className="p-4 border-white/10 hover:border-blue-500/30 transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Cities</p>
                            <p className="text-2xl font-bold text-white">{new Set(turfs.map(t => t.city).filter(Boolean)).size}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                            <MapPin className="w-5 h-5 text-blue-400" />
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Search by court name, city, or owner..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all shadow-lg shadow-black/5"
                />
            </div>

            {filteredTurfs.length === 0 ? (
                <GlassCard className="p-16 text-center border-white/10 bg-gradient-to-br from-white/[0.02] to-white/[0.08]">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 w-fit mx-auto mb-6">
                        <Building2 className="w-16 h-16 text-orange-400" />
                    </div>
                    <h3 className="text-2xl text-white font-bold mb-2">No courts found</h3>
                    <p className="text-gray-400 max-w-md mx-auto mb-8">
                        {searchQuery ? 'Try adjusting your search filters or create a new court' : 'Get started by adding your first court to the system'}
                    </p>
                    {!searchQuery && (
                        <Button variant="primary" onClick={() => setShowCreateModal(true)} className="gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                            <Plus size={18} /> Add Your First Court
                        </Button>
                    )}
                </GlassCard>
            ) : (
                <div className="space-y-5">
                    {filteredTurfs.map((turf) => (
                        <GlassCard key={turf.id} className="p-0 overflow-hidden border-white/10 hover:border-orange-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/5 group">
                            {editingId === turf.id ? (
                                /* ──── Edit Mode ──── */
                                <div className="p-6 space-y-5 bg-gradient-to-br from-white/[0.02] to-white/[0.05]">
                                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-orange-500/10">
                                                <Pencil className="w-5 h-5 text-orange-400" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white">Edit Court Details</h3>
                                        </div>
                                        <button onClick={handleCancelEdit} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
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
                                        <Select
                                            label="Status"
                                            value={editData.status || 'active'}
                                            onChange={(e) => setEditData({ ...editData, status: e.target.value as 'active' | 'inactive' })}
                                            options={[
                                                { label: 'Active', value: 'active' },
                                                { label: 'Inactive', value: 'inactive' }
                                            ]}
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
                                    <div className="relative w-full md:w-64 lg:w-72 h-56 md:h-auto flex-shrink-0 overflow-hidden">
                                        <Image
                                            src={turf.images?.[0] || 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=2000&auto=format&fit=crop'}
                                            alt={turf.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                        <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold uppercase backdrop-blur-md ${turf.status === 'inactive'
                                            ? 'bg-red-500/30 text-red-200 border border-red-400/30 shadow-lg shadow-red-500/20'
                                            : 'bg-green-500/30 text-green-200 border border-green-400/30 shadow-lg shadow-green-500/20'
                                            }`}>
                                            {turf.status === 'inactive' ? '⏸ Inactive' : '✓ Active'}
                                        </div>
                                        <div className="absolute bottom-4 left-4 right-4">
                                            <div className="flex items-center gap-2 text-white/90 text-sm backdrop-blur-md bg-black/30 px-3 py-2 rounded-lg">
                                                <MapPin size={14} className="text-orange-400" />
                                                <span className="truncate font-medium">{turf.city}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 p-6 flex flex-col justify-between">
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">{turf.name}</h3>
                                                <div className="flex items-start text-gray-400 text-sm">
                                                    <MapPin size={16} className="mr-2 text-orange-400 mt-0.5 flex-shrink-0" />
                                                    <span className="leading-relaxed">{[turf.address, turf.city].filter(Boolean).join(', ') || turf.location || 'Location not specified'}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 text-sm">
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                                    <User size={14} className="text-blue-400" />
                                                    <span className="text-blue-400 font-medium">{turf.ownerName}</span>
                                                </div>
                                                <span className="text-gray-600">•</span>
                                                <span className="text-xs text-gray-500">{turf.ownerEmail}</span>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-3">
                                                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg">
                                                    <IndianRupee size={16} className="text-green-400" />
                                                    <span className="text-white font-bold">₹{turf.pricePerHour}</span>
                                                    <span className="text-gray-400 text-sm">/hour</span>
                                                </div>
                                                {turf.operatingHours && (
                                                    <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                                        <Clock size={16} className="text-purple-400" />
                                                        <span className="text-white text-sm font-medium">{formatTime12Hour(turf.operatingHours.open)} – {formatTime12Hour(turf.operatingHours.close)}</span>
                                                    </div>
                                                )}
                                                <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
                                                    <span className="text-gray-300 text-sm font-medium capitalize">{turf.wicketType} wicket</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-white/10">
                                            <button
                                                onClick={() => handleEdit(turf)}
                                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 hover:from-orange-500/30 hover:to-orange-600/30 transition-all hover:scale-105 active:scale-95"
                                            >
                                                <Pencil size={16} /> Edit Court
                                            </button>
                                            <button
                                                onClick={() => handleDelete(turf.id)}
                                                disabled={actionLoading === turf.id}
                                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {actionLoading === turf.id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                                Delete Court
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </GlassCard>
                    ))}
                </div>
            )}

            {/* Create Court Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
                    <GlassCard className="w-full max-w-3xl p-8 border-white/10 shadow-2xl shadow-black/50 my-8 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30">
                                    <Plus className="w-6 h-6 text-orange-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">Add New Court</h2>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                <X size={22} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateCourt} className="space-y-5">
                            <Select
                                label="Turf Admin *"
                                value={createFormData.adminId}
                                onChange={(e) => setCreateFormData({ ...createFormData, adminId: e.target.value })}
                                options={[
                                    { label: 'Select owner...', value: '' },
                                    ...turfAdmins.map(admin => ({
                                        label: `${admin.name} (${admin.email})`,
                                        value: admin.uid
                                    }))
                                ]}
                                required
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Court Name *"
                                    value={createFormData.name}
                                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                                    required
                                />
                                <Select
                                    label="City *"
                                    value={createFormData.city}
                                    onChange={(e) => setCreateFormData({ ...createFormData, city: e.target.value })}
                                    options={CITY_OPTIONS}
                                    required
                                />
                            </div>
                            <Input
                                label="Address *"
                                value={createFormData.address}
                                onChange={(e) => setCreateFormData({ ...createFormData, address: e.target.value })}
                                required
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Input
                                    label="Price per Hour (₹) *"
                                    type="number"
                                    value={createFormData.pricePerHour}
                                    onChange={(e) => setCreateFormData({ ...createFormData, pricePerHour: e.target.value })}
                                    required
                                />
                                <Select
                                    label="Wicket Type *"
                                    value={createFormData.wicketType}
                                    onChange={(e) => setCreateFormData({ ...createFormData, wicketType: e.target.value as 'turf' | 'mat' | 'cement' })}
                                    options={[
                                        { label: 'Turf Wicket', value: 'turf' },
                                        { label: 'Mat Wicket', value: 'mat' },
                                        { label: 'Cement Wicket', value: 'cement' }
                                    ]}
                                />
                                <Input
                                    label="Number of Courts *"
                                    type="number"
                                    value={createFormData.courts}
                                    onChange={(e) => setCreateFormData({ ...createFormData, courts: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Opening Time *"
                                    type="time"
                                    value={createFormData.openTime}
                                    onChange={(e) => setCreateFormData({ ...createFormData, openTime: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Closing Time *"
                                    type="time"
                                    value={createFormData.closeTime}
                                    onChange={(e) => setCreateFormData({ ...createFormData, closeTime: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Contact Phone"
                                    value={createFormData.contactPhone}
                                    onChange={(e) => setCreateFormData({ ...createFormData, contactPhone: e.target.value })}
                                />
                                <Input
                                    label="Contact Email"
                                    type="email"
                                    value={createFormData.contactEmail}
                                    onChange={(e) => setCreateFormData({ ...createFormData, contactEmail: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 ml-1">Description *</label>
                                <textarea
                                    className="flex w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:border-[var(--turf-green)] focus:ring-1 focus:ring-[var(--turf-green)] focus:outline-none transition-all h-24 resize-none"
                                    value={createFormData.description}
                                    onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                                    required
                                />
                            </div>
                            <Input
                                label="Image URL (optional)"
                                placeholder="https://example.com/image.jpg"
                                value={createFormData.imageUrl}
                                onChange={(e) => setCreateFormData({ ...createFormData, imageUrl: e.target.value })}
                            />
                            <div className="flex gap-3 pt-4">
                                <Button type="submit" isLoading={actionLoading === 'create'} className="flex-1">
                                    Create Court
                                </Button>
                                <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
