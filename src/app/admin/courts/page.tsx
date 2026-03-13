'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAllTurfsWithOwners, deleteTurf, updateTurf, addTurf, Turf, getAllUsers, getLocations, Location } from '@/lib/firebase/firestore';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { MapPin, Trash2, Pencil, X, Check, Loader2, Plus, IndianRupee, Clock, User, Building2, Search, ArrowLeft, Upload, Link as LinkIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { formatTime12Hour } from '@/lib/utils';
import { uploadImagesToCloudinary } from '@/lib/cloudinary';
import { geocodeAddress } from '@/lib/geocoding';

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
    const [locations, setLocations] = useState<Location[]>([]);

    const [createFormData, setCreateFormData] = useState({
        name: '',
        address: '',
        city: '',
        pricePerHour: '',
        description: '',
        wicketType: 'turf' as 'turf' | 'mat' | 'cement',
        courts: '1',
        contactPhone: '',
        contactEmail: '',
        openTime: '06:00',
        closeTime: '22:00',
        adminId: '',
        lat: '' as string,
        lng: '' as string,
    });

    // Create form extra state
    const [createAmenities, setCreateAmenities] = useState<string[]>([]);
    const [createNewAmenity, setCreateNewAmenity] = useState('');
    const [createImages, setCreateImages] = useState<File[]>([]);
    const [createImageUrls, setCreateImageUrls] = useState<string[]>([]);
    const [createNewImageUrl, setCreateNewImageUrl] = useState('');
    const [createImageMode, setCreateImageMode] = useState<'upload' | 'url'>('upload');
    const [createUploadProgress, setCreateUploadProgress] = useState('');
    const [geocodingAll, setGeocodingAll] = useState(false);
    const [geocodeProgress, setGeocodeProgress] = useState('');
    const [editMapsLink, setEditMapsLink] = useState('');
    const [editMapsLoading, setEditMapsLoading] = useState(false);
    const [createMapsLink, setCreateMapsLink] = useState('');
    const [createMapsLoading, setCreateMapsLoading] = useState(false);

    // Edit form image state
    const [editImages, setEditImages] = useState<File[]>([]);
    const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
    const [editNewImageUrl, setEditNewImageUrl] = useState('');
    const [editImageMode, setEditImageMode] = useState<'upload' | 'url'>('upload');
    const [editExistingImages, setEditExistingImages] = useState<string[]>([]);

    const fetchCoordsFromMapsLink = async (
        url: string,
        onSuccess: (lat: number, lng: number) => void,
        setLoading: (v: boolean) => void
    ) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/resolve-maps?url=${encodeURIComponent(url)}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            onSuccess(data.lat, data.lng);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Could not fetch coordinates from this link.');
        } finally {
            setLoading(false);
        }
    };

    const handleGeocodeAll = async () => {
        const missing = turfs.filter(t => t.lat == null || t.lng == null);
        if (missing.length === 0) {
            alert('All courts already have location coordinates.');
            return;
        }
        if (!confirm(`Geocode ${missing.length} court${missing.length !== 1 ? 's' : ''} missing GPS coordinates? This may take a moment.`)) return;
        setGeocodingAll(true);
        let updated = 0;
        let failed = 0;
        for (let i = 0; i < missing.length; i++) {
            const turf = missing[i];
            setGeocodeProgress(`Geocoding ${i + 1}/${missing.length}: ${turf.name}...`);
            const coords = await geocodeAddress(turf.address || '', turf.city || turf.location || '');
            if (coords) {
                await updateTurf(turf.id, { lat: coords.lat, lng: coords.lng });
                updated++;
            } else {
                failed++;
            }
            // Rate limit: Nominatim allows 1 req/sec
            if (i < missing.length - 1) await new Promise(r => setTimeout(r, 1100));
        }
        setGeocodingAll(false);
        setGeocodeProgress('');
        await fetchTurfs();
        alert(`Done! ${updated} geocoded, ${failed} failed (address not found).`);
    };

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

    const fetchLocations = async () => {
        const data = await getLocations();
        setLocations(data);
    };

    useEffect(() => {
        fetchTurfs();
        fetchTurfAdmins();
        fetchLocations();
    }, []);

    const resetCreateForm = () => {
        setCreateFormData({
            name: '', address: '', city: '', pricePerHour: '', description: '',
            wicketType: 'turf', courts: '1', contactPhone: '', contactEmail: '',
            openTime: '06:00', closeTime: '22:00', adminId: '', lat: '', lng: '',
        });
        setCreateAmenities([]);
        setCreateNewAmenity('');
        setCreateImages([]);
        setCreateImageUrls([]);
        setCreateNewImageUrl('');
        setCreateImageMode('upload');
        setCreateUploadProgress('');
        setCreateMapsLink('');
    };

    const handleAddCreateAmenity = () => {
        if (createNewAmenity.trim()) {
            setCreateAmenities([...createAmenities, createNewAmenity.trim()]);
            setCreateNewAmenity('');
        }
    };

    const handleAddCreateImageUrl = () => {
        const url = createNewImageUrl.trim();
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
            setCreateImageUrls([...createImageUrls, url]);
            setCreateNewImageUrl('');
        }
    };

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
            lat: turf.lat,
            lng: turf.lng,
        });
        setEditExistingImages(turf.images || []);
        setEditImages([]);
        setEditImageUrls([]);
        setEditNewImageUrl('');
        setEditImageMode('upload');
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        setActionLoading(editingId);
        try {
            // Upload new files to Cloudinary if any
            let uploadedUrls: string[] = [];
            if (editImages.length > 0) {
                uploadedUrls = await uploadImagesToCloudinary(editImages, ({ index, total, file }) => {
                    // Could add upload progress UI here if needed
                    console.log(`Uploading image ${index}/${total}: ${file}`);
                });
            }

            // Combine all images: existing + newly uploaded files + newly added URLs
            const allImages = [...editExistingImages, ...uploadedUrls, ...editImageUrls];

            // Strip undefined values — Firestore rejects them
            const sanitized = Object.fromEntries(
                Object.entries(editData).filter(([, v]) => v !== undefined)
            ) as typeof editData;

            // Add images to update data
            const updateData = {
                ...sanitized,
                ...(allImages.length > 0 ? { images: allImages } : {}),
            };

            await updateTurf(editingId, updateData);
            setTurfs(turfs.map(t => t.id === editingId ? { ...t, ...updateData } : t));
            setEditingId(null);
            setEditData({});
            setEditMapsLink('');
            setEditExistingImages([]);
            setEditImages([]);
            setEditImageUrls([]);
            setEditNewImageUrl('');
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
        setEditMapsLink('');
        setEditExistingImages([]);
        setEditImages([]);
        setEditImageUrls([]);
        setEditNewImageUrl('');
    };

    const handleAddEditImageUrl = () => {
        const url = editNewImageUrl.trim();
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
            setEditImageUrls([...editImageUrls, url]);
            setEditNewImageUrl('');
        }
    };

    const handleCreateCourt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createFormData.adminId) {
            alert('Please select a turf admin');
            return;
        }
        setActionLoading('create');
        setCreateUploadProgress('');
        try {
            // Upload files to Cloudinary
            let uploadedUrls: string[] = [];
            if (createImages.length > 0) {
                uploadedUrls = await uploadImagesToCloudinary(createImages, ({ index, total, file }) => {
                    setCreateUploadProgress(`Uploading image ${index}/${total}: ${file}`);
                });
                setCreateUploadProgress('All images uploaded!');
            }

            const allImages = [...uploadedUrls, ...createImageUrls];

            // Use manual coordinates if provided, otherwise geocode
            let coords = null;
            if (createFormData.lat && createFormData.lng) {
                coords = { lat: Number(createFormData.lat), lng: Number(createFormData.lng) };
            } else {
                setCreateUploadProgress('Geocoding address...');
                coords = await geocodeAddress(createFormData.address, createFormData.city);
                setCreateUploadProgress('');
            }

            await addTurf({
                name: createFormData.name,
                address: createFormData.address,
                city: createFormData.city,
                pricePerHour: Number(createFormData.pricePerHour),
                description: createFormData.description,
                wicketType: createFormData.wicketType,
                images: allImages.length > 0 ? allImages : ['https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=2000&auto=format&fit=crop'],
                amenities: createAmenities,
                courts: Number(createFormData.courts),
                contactPhone: createFormData.contactPhone,
                contactEmail: createFormData.contactEmail,
                operatingHours: {
                    open: createFormData.openTime,
                    close: createFormData.closeTime,
                },
                status: 'active',
                ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
            }, createFormData.adminId);

            await fetchTurfs();
            resetCreateForm();
            setShowCreateModal(false);
            alert('Court created successfully!');
        } catch (error) {
            console.error('Error creating court:', error);
            alert(`Failed to create court: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setActionLoading(null);
            setCreateUploadProgress('');
        }
    };

    const filteredTurfs = turfs.filter(turf =>
        turf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        turf.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        turf.ownerName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const cityOptions = locations.map(loc => ({ label: loc.name, value: loc.name }));

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[var(--turf-green)] w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-up">
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
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">Courts Management</h1>
                    </div>
                    <p className="text-gray-400 text-sm sm:text-base sm:ml-14">Manage {turfs.length} court{turfs.length !== 1 ? 's' : ''} across all turf admins</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                    <Button onClick={() => setShowCreateModal(true)} className="gap-2 w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/20">
                        <Plus size={18} /> Add New Court
                    </Button>
                </div>
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
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Input
                                            label="Court Name"
                                            value={editData.name || ''}
                                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                        />
                                        <Select
                                            label="City"
                                            value={editData.city || ''}
                                            onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                                            options={cityOptions}
                                        />
                                        <div className="sm:col-span-2">
                                            <Input
                                                label="Address"
                                                value={editData.address || ''}
                                                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                            />
                                        </div>
                                        <div className="sm:col-span-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                                            <label className="text-sm font-medium text-gray-300 block">GPS Coordinates <span className="text-gray-500 font-normal text-xs">(optional)</span></label>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="text"
                                                    placeholder="Paste Google Maps link — https://maps.app.goo.gl/..."
                                                    value={editMapsLink}
                                                    onChange={(e) => setEditMapsLink(e.target.value)}
                                                    className="flex-1 h-10 px-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-gray-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => fetchCoordsFromMapsLink(
                                                        editMapsLink,
                                                        (lat, lng) => { setEditData(d => ({ ...d, lat, lng })); setEditMapsLink(''); },
                                                        setEditMapsLoading
                                                    )}
                                                    disabled={!editMapsLink.trim() || editMapsLoading}
                                                    className="h-10 px-4 rounded-xl text-sm font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                                >
                                                    {editMapsLoading ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                                                    Fetch
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input
                                                    label="Latitude"
                                                    type="number"
                                                    placeholder="e.g. 11.4532"
                                                    value={editData.lat != null ? String(editData.lat) : ''}
                                                    onChange={(e) => setEditData({ ...editData, lat: e.target.value ? Number(e.target.value) : undefined })}
                                                />
                                                <Input
                                                    label="Longitude"
                                                    type="number"
                                                    placeholder="e.g. 77.7302"
                                                    value={editData.lng != null ? String(editData.lng) : ''}
                                                    onChange={(e) => setEditData({ ...editData, lng: e.target.value ? Number(e.target.value) : undefined })}
                                                />
                                            </div>
                                            {editData.lat != null && editData.lng != null && (
                                                <p className="text-xs text-emerald-400 flex items-center gap-1">
                                                    <MapPin size={11} /> Coordinates set
                                                </p>
                                            )}
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

                                    {/* ── Images ── */}
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                                            <Upload size={14} /> Update Images
                                        </h3>

                                        {/* Existing Images */}
                                        {editExistingImages.length > 0 && (
                                            <div>
                                                <label className="text-xs font-medium text-gray-400 block mb-2">Current Images</label>
                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                    {editExistingImages.map((url, idx) => (
                                                        <div key={`existing-${idx}`} className="relative group/img rounded-lg overflow-hidden border border-white/10 aspect-video">
                                                            <img src={url} alt={`Existing ${idx + 1}`} className="w-full h-full object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditExistingImages(editExistingImages.filter((_, i) => i !== idx))}
                                                                className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-red-400 opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                            <span className="absolute bottom-1 left-1 text-[9px] bg-black/70 text-gray-300 px-1 py-0.5 rounded">Current</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Add New Images */}
                                        <div>
                                            <label className="text-xs font-medium text-gray-400 block mb-2">Add New Images</label>

                                            {/* Toggle */}
                                            <div className="flex bg-white/5 rounded-xl p-1 border border-white/10 max-w-xs mb-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditImageMode('upload')}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${editImageMode === 'upload' ? 'bg-orange-500 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                                                >
                                                    <Upload size={13} /> Upload Files
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditImageMode('url')}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${editImageMode === 'url' ? 'bg-orange-500 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                                                >
                                                    <LinkIcon size={13} /> Paste URL
                                                </button>
                                            </div>

                                            {editImageMode === 'upload' ? (
                                                <div className="border border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-orange-500/50 transition-colors relative group">
                                                    <input
                                                        type="file"
                                                        multiple
                                                        accept="image/*"
                                                        onChange={(e) => { if (e.target.files) setEditImages(Array.from(e.target.files)); }}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                    />
                                                    <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-orange-400 transition-colors">
                                                        <Upload className="w-8 h-8" />
                                                        <span className="text-sm">
                                                            {editImages.length > 0 ? `${editImages.length} file${editImages.length > 1 ? 's' : ''} selected` : 'Click or drag to upload images'}
                                                        </span>
                                                        <span className="text-xs text-gray-600">PNG, JPG up to 10MB each</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={editNewImageUrl}
                                                        onChange={(e) => setEditNewImageUrl(e.target.value)}
                                                        placeholder="https://example.com/photo.jpg"
                                                        className="flex-1"
                                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEditImageUrl(); } }}
                                                    />
                                                    <Button type="button" onClick={handleAddEditImageUrl} variant="secondary" className="flex-shrink-0 gap-1">
                                                        <Plus size={16} /> Add
                                                    </Button>
                                                </div>
                                            )}

                                            {/* New Images Preview */}
                                            {(editImages.length > 0 || editImageUrls.length > 0) && (
                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
                                                    {editImages.map((file, idx) => (
                                                        <div key={`file-${idx}`} className="relative group/img rounded-lg overflow-hidden border border-white/10 aspect-video">
                                                            <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditImages(editImages.filter((_, i) => i !== idx))}
                                                                className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-red-400 opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                            <span className="absolute bottom-1 left-1 text-[9px] bg-black/70 text-gray-300 px-1 py-0.5 rounded">New</span>
                                                        </div>
                                                    ))}
                                                    {editImageUrls.map((url, idx) => (
                                                        <div key={`url-${idx}`} className="relative group/img rounded-lg overflow-hidden border border-white/10 aspect-video">
                                                            <img src={url} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditImageUrls(editImageUrls.filter((_, i) => i !== idx))}
                                                                className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-red-400 opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                            <span className="absolute bottom-1 left-1 text-[9px] bg-black/70 text-gray-300 px-1 py-0.5 rounded">New URL</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                        <Button onClick={handleSaveEdit} isLoading={actionLoading === turf.id} className="gap-2 w-full sm:w-auto">
                                            <Check size={16} /> Save Changes
                                        </Button>
                                        <Button variant="secondary" onClick={handleCancelEdit} className="w-full sm:w-auto">Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                /* ──── View Mode ──── */
                                <div className="flex flex-col md:flex-row">
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

                                    <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between">
                                        <div className="space-y-3 sm:space-y-4">
                                            <div>
                                                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">{turf.name}</h3>
                                                <div className="flex items-start text-gray-400 text-sm">
                                                    <MapPin size={16} className="mr-2 text-orange-400 mt-0.5 flex-shrink-0" />
                                                    <span className="leading-relaxed">{[turf.address, turf.city].filter(Boolean).join(', ') || turf.location || 'Location not specified'}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                                    <User size={14} className="text-blue-400" />
                                                    <span className="text-blue-400 font-medium truncate">{turf.ownerName}</span>
                                                </div>
                                                <span className="hidden sm:inline text-gray-600">•</span>
                                                <span className="text-xs text-gray-500 truncate">{turf.ownerEmail}</span>
                                            </div>

                                            <div className="flex flex-wrap gap-2 sm:gap-3">
                                                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg">
                                                    <IndianRupee size={16} className="text-green-400" />
                                                    <span className="text-white font-bold">₹{turf.pricePerHour}</span>
                                                    <span className="text-gray-400 text-xs sm:text-sm">/hour</span>
                                                </div>
                                                {turf.operatingHours && (
                                                    <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                                        <Clock size={16} className="text-purple-400 flex-shrink-0" />
                                                        <span className="text-white text-xs sm:text-sm font-medium whitespace-nowrap">{formatTime12Hour(turf.operatingHours.open)} – {formatTime12Hour(turf.operatingHours.close)}</span>
                                                    </div>
                                                )}
                                                <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
                                                    <span className="text-gray-300 text-xs sm:text-sm font-medium capitalize">{turf.wicketType} wicket</span>
                                                </div>
                                                <div className={`px-3 py-2 rounded-lg border text-xs font-medium ${turf.lat != null && turf.lng != null ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                                    <MapPin size={12} className="inline mr-1" />{turf.lat != null && turf.lng != null ? 'GPS ✓' : 'No GPS'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-white/10">
                                            <button
                                                onClick={() => handleEdit(turf)}
                                                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 hover:from-orange-500/30 hover:to-orange-600/30 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto"
                                            >
                                                <Pencil size={16} /> Edit Court
                                            </button>
                                            <button
                                                onClick={() => handleDelete(turf.id)}
                                                disabled={actionLoading === turf.id}
                                                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                                            >
                                                {actionLoading === turf.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
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

            {/* ──── Add New Court Modal ──── */}
            {showCreateModal && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
                    className="bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 pt-70"
                    onClick={(e) => { if (e.target === e.currentTarget) { resetCreateForm(); setShowCreateModal(false); } }}
                >
                    <div
                        className="w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50 flex flex-col max-h-[92vh]"
                        style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(24px)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30">
                                    <Plus className="w-5 h-5 text-orange-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Add New Court</h2>
                                    <p className="text-xs text-gray-500">Fill in the details to create a new court</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { resetCreateForm(); setShowCreateModal(false); }}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrollable Form Body */}
                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                            <form onSubmit={handleCreateCourt} className="p-6 space-y-6">

                                {/* ── Owner Assignment ── */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                                        <User size={14} /> Owner Assignment
                                    </h3>
                                    <Select
                                        label="Turf Admin *"
                                        value={createFormData.adminId}
                                        onChange={(e) => setCreateFormData({ ...createFormData, adminId: e.target.value })}
                                        options={[
                                            { label: 'Select an owner...', value: '' },
                                            ...turfAdmins.map(admin => ({
                                                label: `${admin.name} (${admin.email})`,
                                                value: admin.uid,
                                            }))
                                        ]}
                                        required
                                    />
                                </div>

                                {/* ── Basic Information ── */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                                        <MapPin size={14} /> Basic Information
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Input
                                            label="Court Name *"
                                            placeholder="e.g. Green Field Turf"
                                            value={createFormData.name}
                                            onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                                            required
                                        />
                                        <Select
                                            label="City *"
                                            value={createFormData.city}
                                            onChange={(e) => setCreateFormData({ ...createFormData, city: e.target.value })}
                                            options={[
                                                { label: 'Select a city...', value: '' },
                                                ...cityOptions,
                                            ]}
                                            required
                                        />
                                    </div>
                                    <Input
                                        label="Address *"
                                        placeholder="e.g. 12, Main Road, Near Bus Stand"
                                        value={createFormData.address}
                                        onChange={(e) => setCreateFormData({ ...createFormData, address: e.target.value })}
                                        required
                                    />
                                    {/* GPS Coordinates */}
                                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                                        <label className="text-sm font-medium text-gray-300 block">GPS Coordinates <span className="text-gray-500 font-normal text-xs">(optional — will auto-geocode from address if blank)</span></label>
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                placeholder="Paste Google Maps link — https://maps.app.goo.gl/..."
                                                value={createMapsLink}
                                                onChange={(e) => setCreateMapsLink(e.target.value)}
                                                className="flex-1 h-10 px-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-gray-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fetchCoordsFromMapsLink(
                                                    createMapsLink,
                                                    (lat, lng) => { setCreateFormData(d => ({ ...d, lat: String(lat), lng: String(lng) })); setCreateMapsLink(''); },
                                                    setCreateMapsLoading
                                                )}
                                                disabled={!createMapsLink.trim() || createMapsLoading}
                                                className="h-10 px-4 rounded-xl text-sm font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                            >
                                                {createMapsLoading ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                                                Fetch
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input
                                                label="Latitude"
                                                type="number"
                                                placeholder="e.g. 11.4532"
                                                value={createFormData.lat}
                                                onChange={(e) => setCreateFormData({ ...createFormData, lat: e.target.value })}
                                            />
                                            <Input
                                                label="Longitude"
                                                type="number"
                                                placeholder="e.g. 77.7302"
                                                value={createFormData.lng}
                                                onChange={(e) => setCreateFormData({ ...createFormData, lng: e.target.value })}
                                            />
                                        </div>
                                        {createFormData.lat && createFormData.lng && (
                                            <p className="text-xs text-emerald-400 flex items-center gap-1">
                                                <MapPin size={11} /> Coordinates set — geocoding will be skipped
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-300 ml-1 block">Description *</label>
                                        <textarea
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 outline-none transition-all resize-none h-20"
                                            placeholder="Describe your court, facilities, and what makes it special..."
                                            value={createFormData.description}
                                            onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* ── Pricing & Specs ── */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                                        <IndianRupee size={14} /> Pricing & Specifications
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <Input
                                            label="Price per Hour (₹) *"
                                            type="number"
                                            placeholder="1000"
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
                                                { label: 'Cement Wicket', value: 'cement' },
                                            ]}
                                        />
                                        <Input
                                            label="Number of Courts *"
                                            type="number"
                                            placeholder="1"
                                            value={createFormData.courts}
                                            onChange={(e) => setCreateFormData({ ...createFormData, courts: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* ── Operating Hours ── */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                                        <Clock size={14} /> Operating Hours
                                    </h3>
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
                                    <p className="text-xs text-gray-500 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                        ⏰ Booking slots will be auto-generated in 1-hour intervals between opening and closing time.
                                    </p>
                                </div>

                                {/* ── Contact Information ── */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                                        <User size={14} /> Contact Information
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Input
                                            label="Phone Number"
                                            type="tel"
                                            placeholder="+91 98765 43210"
                                            value={createFormData.contactPhone}
                                            onChange={(e) => setCreateFormData({ ...createFormData, contactPhone: e.target.value })}
                                        />
                                        <Input
                                            label="Email"
                                            type="email"
                                            placeholder="owner@example.com"
                                            value={createFormData.contactEmail}
                                            onChange={(e) => setCreateFormData({ ...createFormData, contactEmail: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* ── Amenities ── */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                                        <Check size={14} /> Amenities
                                    </h3>
                                    <div className="flex gap-2">
                                        <Input
                                            value={createNewAmenity}
                                            onChange={(e) => setCreateNewAmenity(e.target.value)}
                                            placeholder="e.g. Parking, Floodlights, Changing Room"
                                            className="flex-1"
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCreateAmenity(); } }}
                                        />
                                        <Button type="button" onClick={handleAddCreateAmenity} variant="secondary" className="flex-shrink-0">
                                            <Plus size={16} />
                                        </Button>
                                    </div>
                                    {createAmenities.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {createAmenities.map((item, idx) => (
                                                <span key={idx} className="bg-orange-500/10 text-orange-300 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 border border-orange-500/20">
                                                    {item}
                                                    <button type="button" onClick={() => setCreateAmenities(createAmenities.filter((_, i) => i !== idx))} className="hover:text-white transition-colors">
                                                        <X size={12} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* ── Images ── */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                                        <Upload size={14} /> Images
                                    </h3>

                                    {/* Toggle */}
                                    <div className="flex bg-white/5 rounded-xl p-1 border border-white/10 max-w-xs">
                                        <button
                                            type="button"
                                            onClick={() => setCreateImageMode('upload')}
                                            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${createImageMode === 'upload' ? 'bg-orange-500 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            <Upload size={13} /> Upload Files
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCreateImageMode('url')}
                                            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${createImageMode === 'url' ? 'bg-orange-500 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            <LinkIcon size={13} /> Paste URL
                                        </button>
                                    </div>

                                    {createImageMode === 'upload' ? (
                                        <div className="border border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-orange-500/50 transition-colors relative group">
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={(e) => { if (e.target.files) setCreateImages(Array.from(e.target.files)); }}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                            <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-orange-400 transition-colors">
                                                <Upload className="w-8 h-8" />
                                                <span className="text-sm">
                                                    {createImages.length > 0 ? `${createImages.length} file${createImages.length > 1 ? 's' : ''} selected` : 'Click or drag to upload images'}
                                                </span>
                                                <span className="text-xs text-gray-600">PNG, JPG up to 10MB each · Stored on Cloudinary</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Input
                                                value={createNewImageUrl}
                                                onChange={(e) => setCreateNewImageUrl(e.target.value)}
                                                placeholder="https://example.com/photo.jpg"
                                                className="flex-1"
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCreateImageUrl(); } }}
                                            />
                                            <Button type="button" onClick={handleAddCreateImageUrl} variant="secondary" className="flex-shrink-0 gap-1">
                                                <Plus size={16} /> Add
                                            </Button>
                                        </div>
                                    )}

                                    {/* Upload progress */}
                                    {createUploadProgress && (
                                        <div className="flex items-center gap-2 text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">
                                            <Loader2 size={14} className="animate-spin flex-shrink-0" />
                                            {createUploadProgress}
                                        </div>
                                    )}

                                    {/* Image previews */}
                                    {(createImages.length > 0 || createImageUrls.length > 0) && (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                            {createImages.map((file, idx) => (
                                                <div key={`file-${idx}`} className="relative group/img rounded-lg overflow-hidden border border-white/10 aspect-video">
                                                    <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setCreateImages(createImages.filter((_, i) => i !== idx))}
                                                        className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-red-400 opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                    <span className="absolute bottom-1 left-1 text-[9px] bg-black/70 text-gray-300 px-1 py-0.5 rounded">File</span>
                                                </div>
                                            ))}
                                            {createImageUrls.map((url, idx) => (
                                                <div key={`url-${idx}`} className="relative group/img rounded-lg overflow-hidden border border-white/10 aspect-video">
                                                    <img src={url} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setCreateImageUrls(createImageUrls.filter((_, i) => i !== idx))}
                                                        className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-red-400 opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                    <span className="absolute bottom-1 left-1 text-[9px] bg-black/70 text-gray-300 px-1 py-0.5 rounded">URL</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* ── Submit ── */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-white/10">
                                    <Button
                                        type="submit"
                                        isLoading={actionLoading === 'create'}
                                        className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/20"
                                    >
                                        Create Court
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => { resetCreateForm(); setShowCreateModal(false); }}
                                        className="sm:w-auto"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
