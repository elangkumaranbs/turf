'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAllTurfsWithOwners, deleteTurf, updateTurf, addTurf, Turf, getAllUsers, getLocations, Location } from '@/lib/firebase/firestore';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { MapPin, Trash2, Pencil, X, Check, Loader2, Plus, IndianRupee, Clock, User, Building2, Search, Upload, Link as LinkIcon } from 'lucide-react';
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
    const [editAmenities, setEditAmenities] = useState<string[]>([]);
    const [editNewAmenity, setEditNewAmenity] = useState('');
    const [editUploadProgress, setEditUploadProgress] = useState('');

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
        setEditAmenities(turf.amenities || []);
        setEditNewAmenity('');
        setEditUploadProgress('');
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        setActionLoading(editingId);
        try {
            let uploadedUrls: string[] = [];
            if (editImages.length > 0) {
                uploadedUrls = await uploadImagesToCloudinary(editImages, ({ index, total, file }) => {
                    setEditUploadProgress(`Uploading image ${index}/${total}: ${file}`);
                });
                setEditUploadProgress('All images uploaded!');
            }
            const allImages = [...editExistingImages, ...uploadedUrls, ...editImageUrls];
            const sanitized = Object.fromEntries(
                Object.entries(editData).filter(([, v]) => v !== undefined)
            ) as typeof editData;
            const updateData = {
                ...sanitized,
                amenities: editAmenities,
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
            setEditAmenities([]);
            setEditNewAmenity('');
            setEditUploadProgress('');
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
        setEditAmenities([]);
        setEditNewAmenity('');
        setEditUploadProgress('');
    };

    const handleAddEditAmenity = () => {
        if (editNewAmenity.trim()) {
            setEditAmenities([...editAmenities, editNewAmenity.trim()]);
            setEditNewAmenity('');
        }
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
            let uploadedUrls: string[] = [];
            if (createImages.length > 0) {
                uploadedUrls = await uploadImagesToCloudinary(createImages, ({ index, total, file }) => {
                    setCreateUploadProgress(`Uploading image ${index}/${total}: ${file}`);
                });
                setCreateUploadProgress('All images uploaded!');
            }
            const allImages = [...uploadedUrls, ...createImageUrls];
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

    const activeTurfs = turfs.filter(t => t.status === 'active').length;
    const inactiveTurfs = turfs.filter(t => t.status !== 'active').length;
    const cities = new Set(turfs.map(t => t.city || t.location)).size;

    return (
        <div className="space-y-8 animate-fade-up">
            {/* Header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        Courts <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">Management</span>
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">Manage {turfs.length} court{turfs.length !== 1 ? 's' : ''} across all turf admins.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:scale-[1.02]"
                >
                    <Plus size={18} /> Add New Court
                </button>
            </div>

            {/* Stats Section */}
            <GlassCard className="p-6 sm:p-8 lg:p-10 border-white/5 bg-white/[0.02] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-3xl rounded-full pointer-events-none" />
                <div className="relative z-10 space-y-6">
                    <h3 className="text-xl font-bold text-white border-b border-white/5 pb-3 flex items-center gap-2">
                        <span className="bg-orange-500/10 text-orange-400 p-1.5 rounded-lg"><Building2 size={18} /></span>
                        Overview
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                                <Building2 size={16} className="text-orange-400" />
                                <span className="text-xs text-gray-400 uppercase tracking-wide">Total</span>
                            </div>
                            <p className="text-2xl font-bold text-orange-400">{turfs.length}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                                <Check size={16} className="text-emerald-400" />
                                <span className="text-xs text-gray-400 uppercase tracking-wide">Active</span>
                            </div>
                            <p className="text-2xl font-bold text-emerald-400">{activeTurfs}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                                <X size={16} className="text-red-400" />
                                <span className="text-xs text-gray-400 uppercase tracking-wide">Inactive</span>
                            </div>
                            <p className="text-2xl font-bold text-red-400">{inactiveTurfs}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                                <MapPin size={16} className="text-blue-400" />
                                <span className="text-xs text-gray-400 uppercase tracking-wide">Cities</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-400">{cities}</p>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Geocode alert */}
            {geocodingAll && geocodeProgress && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
                    <p className="text-sm text-blue-300 font-medium">{geocodeProgress}</p>
                </div>
            )}

            {/* Courts List Section */}
            <GlassCard className="p-6 sm:p-8 lg:p-10 border-white/5 bg-white/[0.02]">
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white border-b border-white/5 pb-3 flex items-center gap-2">
                        <span className="bg-blue-500/10 text-blue-400 p-1.5 rounded-lg"><Search size={18} /></span>
                        All Courts
                        <span className="ml-auto text-sm font-medium bg-white/10 text-gray-300 px-3 py-1 rounded-full">
                            {filteredTurfs.length} result{filteredTurfs.length !== 1 ? 's' : ''}
                        </span>
                    </h3>

                    {/* Search & Geocode */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search by name, city or owner..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-11 pl-10 pr-4 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-gray-500 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 focus:outline-none transition-all"
                            />
                        </div>
                        <button
                            onClick={handleGeocodeAll}
                            disabled={geocodingAll}
                            className="h-11 px-4 rounded-xl text-sm font-semibold bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                            {geocodingAll ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                            Geocode All
                        </button>
                    </div>

                    {/* Court Cards */}
                    {filteredTurfs.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                                <Building2 className="w-8 h-8 text-gray-600" />
                            </div>
                            <p className="text-gray-400 font-medium">No courts found</p>
                            <p className="text-gray-500 text-sm mt-1">Try adjusting your search or add a new court.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredTurfs.map((turf) => (
                                <div key={turf.id} className="p-4 sm:p-5 bg-white/5 border border-white/10 rounded-xl hover:border-orange-500/20 transition-all">
                                    {editingId === turf.id ? (
                                        /* ─── Edit Mode ─── */
                                        <div className="space-y-5">
                                            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                                    <Pencil size={16} className="text-orange-400" /> Editing Court
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={handleSaveEdit} disabled={actionLoading === turf.id} className="px-4 py-2 text-sm font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50">
                                                        {actionLoading === turf.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
                                                    </button>
                                                    <button onClick={handleCancelEdit} className="px-4 py-2 text-sm font-semibold bg-white/5 text-gray-400 border border-white/10 rounded-lg hover:bg-white/10 transition-all flex items-center gap-1.5">
                                                        <X size={14} /> Cancel
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Basic Info */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input label="Court Name" value={editData.name || ''} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                                                <Input label="City" value={editData.city || ''} onChange={(e) => setEditData({ ...editData, city: e.target.value })} />
                                            </div>
                                            <Input label="Address" value={editData.address || ''} onChange={(e) => setEditData({ ...editData, address: e.target.value })} />
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-300 ml-1 block">Description</label>
                                                <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:border-[var(--turf-green)]/50 focus:ring-1 focus:ring-[var(--turf-green)]/30 outline-none transition-all resize-none min-h-[100px]" placeholder="Describe the court..." value={editData.description || ''} onChange={(e) => setEditData({ ...editData, description: e.target.value })} />
                                            </div>
                                            {/* Pricing & Specs */}
                                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                                <Input label="Price/Hour (₹)" type="number" value={String(editData.pricePerHour || '')} onChange={(e) => setEditData({ ...editData, pricePerHour: Number(e.target.value) })} />
                                                <Select label="Wicket Type" value={editData.wicketType || 'turf'} onChange={(e) => setEditData({ ...editData, wicketType: e.target.value as any })} options={[{ label: 'Turf', value: 'turf' }, { label: 'Mat', value: 'mat' }, { label: 'Cement', value: 'cement' }]} />
                                                <Input label="Courts" type="number" value={String(editData.courts || '')} onChange={(e) => setEditData({ ...editData, courts: Number(e.target.value) })} />
                                                <Select label="Status" value={editData.status || 'active'} onChange={(e) => setEditData({ ...editData, status: e.target.value as any })} options={[{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }]} />
                                            </div>
                                            {/* Operating Hours */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <Input label="Open Time" type="time" value={editData.operatingHours?.open || '06:00'} onChange={(e) => setEditData({ ...editData, operatingHours: { ...editData.operatingHours, open: e.target.value, close: editData.operatingHours?.close || '22:00' } })} />
                                                <Input label="Close Time" type="time" value={editData.operatingHours?.close || '22:00'} onChange={(e) => setEditData({ ...editData, operatingHours: { ...editData.operatingHours, open: editData.operatingHours?.open || '06:00', close: e.target.value } })} />
                                            </div>
                                            {/* Contact */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input label="Contact Phone" type="tel" value={editData.contactPhone || ''} onChange={(e) => setEditData({ ...editData, contactPhone: e.target.value })} />
                                                <Input label="Contact Email" type="email" value={editData.contactEmail || ''} onChange={(e) => setEditData({ ...editData, contactEmail: e.target.value })} />
                                            </div>
                                            {/* Amenities */}
                                            <div className="space-y-3">
                                                <label className="text-sm font-medium text-gray-300 ml-1">Amenities</label>
                                                <div className="flex gap-2">
                                                    <Input value={editNewAmenity} onChange={(e) => setEditNewAmenity(e.target.value)} placeholder="Add amenity (e.g. Parking)" className="flex-1" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEditAmenity(); } }} />
                                                    <Button type="button" onClick={handleAddEditAmenity} variant="secondary" className="shrink-0"><Plus size={16} /></Button>
                                                </div>
                                                {editAmenities.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {editAmenities.map((item, idx) => (
                                                            <span key={idx} className="bg-[var(--turf-green)]/10 text-[var(--turf-green)] text-xs px-3 py-1.5 rounded-full flex items-center gap-2 border border-[var(--turf-green)]/20">
                                                                {item}
                                                                <button type="button" onClick={() => setEditAmenities(editAmenities.filter((_, i) => i !== idx))} className="hover:text-white transition-colors"><X size={12} /></button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {/* GPS */}
                                            <div className="space-y-3">
                                                <label className="text-sm font-medium text-gray-300 ml-1">GPS Coordinates</label>
                                                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                                                    <div className="flex gap-2 items-center">
                                                        <input type="text" placeholder="Paste Google Maps link..." value={editMapsLink} onChange={(e) => setEditMapsLink(e.target.value)} className="flex-1 h-10 px-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-gray-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all" />
                                                        <button type="button" onClick={() => fetchCoordsFromMapsLink(editMapsLink, (lat, lng) => { setEditData({ ...editData, lat, lng }); setEditMapsLink(''); alert(`✓ Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`); }, setEditMapsLoading)} disabled={!editMapsLink.trim() || editMapsLoading} className="h-10 px-4 rounded-xl text-sm font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
                                                            {editMapsLoading ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />} Fetch
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-sm font-medium text-gray-300 ml-1 block mb-1">Latitude</label>
                                                            <input type="number" step="any" placeholder="e.g. 11.4532" value={editData.lat != null ? String(editData.lat) : ''} onChange={(e) => setEditData({ ...editData, lat: e.target.value ? Number(e.target.value) : undefined })} className="w-full h-10 px-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-gray-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all" />
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-medium text-gray-300 ml-1 block mb-1">Longitude</label>
                                                            <input type="number" step="any" placeholder="e.g. 77.7302" value={editData.lng != null ? String(editData.lng) : ''} onChange={(e) => setEditData({ ...editData, lng: e.target.value ? Number(e.target.value) : undefined })} className="w-full h-10 px-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-gray-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Images */}
                                            <div className="space-y-3">
                                                <label className="text-sm font-medium text-gray-300 ml-1">Images</label>
                                                {editExistingImages.length > 0 && (
                                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                                        {editExistingImages.map((img, idx) => (
                                                            <div key={idx} className="relative group/img rounded-lg overflow-hidden border border-white/10 aspect-video">
                                                                <img src={img} alt="" className="w-full h-full object-cover" />
                                                                <button type="button" onClick={() => setEditExistingImages(editExistingImages.filter((_, i) => i !== idx))} className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-red-400 opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500 hover:text-white">
                                                                    <X size={10} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {/* Upload/URL toggle */}
                                                <div className="flex bg-white/5 rounded-xl p-1 border border-white/10 max-w-xs">
                                                    <button type="button" onClick={() => setEditImageMode('upload')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${editImageMode === 'upload' ? 'bg-[var(--turf-green)] text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                                                        <Upload size={14} /> Upload Files
                                                    </button>
                                                    <button type="button" onClick={() => setEditImageMode('url')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${editImageMode === 'url' ? 'bg-[var(--turf-green)] text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                                                        <LinkIcon size={14} /> Paste URL
                                                    </button>
                                                </div>
                                                {editImageMode === 'upload' ? (
                                                    <div className="border border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-[var(--turf-green)] transition-colors relative group">
                                                        <input type="file" multiple accept="image/*" onChange={(e) => { if (e.target.files) setEditImages(prev => [...prev, ...Array.from(e.target.files!)]); }} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                        <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-[var(--turf-green)] transition-colors">
                                                            <Upload className="w-8 h-8" />
                                                            <span className="text-sm">{editImages.length > 0 ? `${editImages.length} new file${editImages.length > 1 ? 's' : ''} selected` : 'Click or drag to upload images'}</span>
                                                            <span className="text-xs text-gray-600">PNG, JPG up to 10MB each</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <Input value={editNewImageUrl} onChange={(e) => setEditNewImageUrl(e.target.value)} placeholder="https://example.com/photo.jpg" className="flex-1" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEditImageUrl(); } }} />
                                                        <Button type="button" onClick={handleAddEditImageUrl} variant="secondary" className="shrink-0 gap-1"><Plus size={16} /> Add</Button>
                                                    </div>
                                                )}
                                                {/* New image previews */}
                                                {(editImages.length > 0 || editImageUrls.length > 0) && (
                                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                                        {editImages.map((file, idx) => (
                                                            <div key={`file-${idx}`} className="relative group/img rounded-lg overflow-hidden border border-emerald-500/30 bg-white/5 aspect-video">
                                                                <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                                                                <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-[10px] text-emerald-400 text-center py-0.5">NEW</span>
                                                                <button type="button" onClick={() => setEditImages(editImages.filter((_, i) => i !== idx))} className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-red-400 opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"><X size={10} /></button>
                                                            </div>
                                                        ))}
                                                        {editImageUrls.map((url, idx) => (
                                                            <div key={`url-${idx}`} className="relative group/img rounded-lg overflow-hidden border border-emerald-500/30 bg-white/5 aspect-video">
                                                                <img src={url} alt="" className="w-full h-full object-cover" />
                                                                <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-[10px] text-emerald-400 text-center py-0.5">NEW</span>
                                                                <button type="button" onClick={() => setEditImageUrls(editImageUrls.filter((_, i) => i !== idx))} className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-red-400 opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"><X size={10} /></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {editUploadProgress && (
                                                    <div className="flex items-center gap-2 text-xs text-[var(--turf-green)] bg-[var(--turf-green)]/10 border border-[var(--turf-green)]/20 rounded-lg px-3 py-2">
                                                        <Loader2 size={14} className="animate-spin shrink-0" />
                                                        {editUploadProgress}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        /* ─── View Mode ─── */
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            {/* Thumbnail */}
                                            {turf.images && turf.images[0] && (
                                                <div className="sm:w-32 sm:h-24 h-40 rounded-lg overflow-hidden border border-white/10 shrink-0">
                                                    <Image src={turf.images[0]} alt={turf.name} width={128} height={96} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            {/* Info */}
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <h4 className="text-white font-bold text-lg truncate">{turf.name}</h4>
                                                        <div className="flex items-center gap-1 text-gray-400 text-sm mt-0.5">
                                                            <MapPin size={12} className="text-orange-400 shrink-0" />
                                                            <span className="truncate">{turf.address || turf.city || 'No address'}, {turf.city}</span>
                                                        </div>
                                                    </div>
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase shrink-0 ${turf.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/20'}`}>
                                                        {turf.status || 'active'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 text-xs">
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg text-gray-300"><IndianRupee size={11} />₹{turf.pricePerHour}/hr</span>
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg text-gray-300"><Clock size={11} />{turf.operatingHours ? `${formatTime12Hour(turf.operatingHours.open)} - ${formatTime12Hour(turf.operatingHours.close)}` : 'N/A'}</span>
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg text-gray-300"><User size={11} />{turf.ownerName || 'Unknown'}</span>
                                                    {turf.lat != null && turf.lng != null && <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded-lg text-emerald-400"><MapPin size={11} />GPS ✓</span>}
                                                </div>
                                            </div>
                                            {/* Actions */}
                                            <div className="flex sm:flex-col items-center gap-2 shrink-0 sm:ml-2">
                                                <button onClick={() => handleEdit(turf)} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all" title="Edit">
                                                    <Pencil size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(turf.id)} disabled={actionLoading === turf.id} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50" title="Delete">
                                                    {actionLoading === turf.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </GlassCard>

            {/* Create Court Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
                    <GlassCard className="w-full max-w-2xl my-8 p-6 sm:p-8 lg:p-10 border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-3xl rounded-full pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-white">Add New <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">Court</span></h2>
                                    <p className="text-gray-400 mt-1 text-sm">Create a court and assign to an admin.</p>
                                </div>
                                <button onClick={() => { setShowCreateModal(false); resetCreateForm(); }} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateCourt} className="space-y-8">
                                {/* Assign Admin */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Assign Owner</h3>
                                    <Select label="Turf Admin" value={createFormData.adminId} onChange={(e) => setCreateFormData({ ...createFormData, adminId: e.target.value })} options={[{ label: 'Select an admin...', value: '' }, ...turfAdmins.map(a => ({ label: `${a.name || a.email} (${a.role})`, value: a.uid }))]} required />
                                </div>
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2 flex items-center gap-2">
                                        <span className="bg-orange-500/10 text-orange-400 p-1.5 rounded-lg"><MapPin size={16} /></span>
                                        Basic Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input label="Court Name" placeholder="e.g. Green Field Turf" value={createFormData.name} onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })} required />
                                        <Select label="City" value={createFormData.city} onChange={(e) => setCreateFormData({ ...createFormData, city: e.target.value })} options={cityOptions.length > 0 ? [{ label: 'Select a City', value: '' }, ...cityOptions] : [{ label: 'Loading...', value: '' }]} required />
                                    </div>
                                    <Input label="Address" placeholder="e.g. 12, Main Road, Near Bus Stand" value={createFormData.address} onChange={(e) => setCreateFormData({ ...createFormData, address: e.target.value })} required />
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300 ml-1 block mb-1">Description</label>
                                        <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:border-[var(--turf-green)]/50 focus:ring-1 focus:ring-[var(--turf-green)]/30 outline-none transition-all resize-none min-h-[100px]" placeholder="Describe the court..." value={createFormData.description} onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })} required />
                                    </div>
                                </div>
                                {/* Pricing & Specs */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Pricing & Specifications</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <Input label="Price/Hour (₹)" type="number" placeholder="1000" value={createFormData.pricePerHour} onChange={(e) => setCreateFormData({ ...createFormData, pricePerHour: e.target.value })} required />
                                        <Select label="Wicket Type" value={createFormData.wicketType} onChange={(e) => setCreateFormData({ ...createFormData, wicketType: e.target.value as any })} options={[{ label: 'Turf', value: 'turf' }, { label: 'Mat', value: 'mat' }, { label: 'Cement', value: 'cement' }]} />
                                        <Input label="Courts" type="number" placeholder="1" value={createFormData.courts} onChange={(e) => setCreateFormData({ ...createFormData, courts: e.target.value })} />
                                    </div>
                                </div>
                                {/* Operating Hours */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Operating Hours</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Opening Time" type="time" value={createFormData.openTime} onChange={(e) => setCreateFormData({ ...createFormData, openTime: e.target.value })} />
                                        <Input label="Closing Time" type="time" value={createFormData.closeTime} onChange={(e) => setCreateFormData({ ...createFormData, closeTime: e.target.value })} />
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                        <p className="text-xs text-gray-400">⏰ Booking slots will be auto-generated in 1-hour intervals.</p>
                                    </div>
                                </div>
                                {/* Contact */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Contact Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input label="Phone" type="tel" placeholder="+91 98765 43210" value={createFormData.contactPhone} onChange={(e) => setCreateFormData({ ...createFormData, contactPhone: e.target.value })} />
                                        <Input label="Email" type="email" placeholder="owner@example.com" value={createFormData.contactEmail} onChange={(e) => setCreateFormData({ ...createFormData, contactEmail: e.target.value })} />
                                    </div>
                                </div>
                                {/* GPS */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">GPS Coordinates</h3>
                                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                                        <p className="text-xs text-gray-400">Add GPS coordinates for accurate distance calculations. Optional — will auto-geocode from address if blank.</p>
                                        <div className="flex gap-2 items-center">
                                            <input type="text" placeholder="Paste Google Maps link..." value={createMapsLink} onChange={(e) => setCreateMapsLink(e.target.value)} className="flex-1 h-10 px-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-gray-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all" />
                                            <button type="button" onClick={() => fetchCoordsFromMapsLink(createMapsLink, (lat, lng) => { setCreateFormData({ ...createFormData, lat: String(lat), lng: String(lng) }); setCreateMapsLink(''); alert(`✓ Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`); }, setCreateMapsLoading)} disabled={!createMapsLink.trim() || createMapsLoading} className="h-10 px-4 rounded-xl text-sm font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
                                                {createMapsLoading ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />} Fetch
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-sm font-medium text-gray-300 ml-1 block mb-1">Latitude</label>
                                                <input type="number" step="any" placeholder="e.g. 11.4532" value={createFormData.lat} onChange={(e) => setCreateFormData({ ...createFormData, lat: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-gray-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all" />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-300 ml-1 block mb-1">Longitude</label>
                                                <input type="number" step="any" placeholder="e.g. 77.7302" value={createFormData.lng} onChange={(e) => setCreateFormData({ ...createFormData, lng: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-gray-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all" />
                                            </div>
                                        </div>
                                        {createFormData.lat && createFormData.lng && <p className="text-xs text-emerald-400 flex items-center gap-1"><MapPin size={11} /> GPS coordinates set</p>}
                                    </div>
                                </div>
                                {/* Amenities */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Amenities</h3>
                                    <div className="flex gap-2">
                                        <Input value={createNewAmenity} onChange={(e) => setCreateNewAmenity(e.target.value)} placeholder="Add amenity (e.g. Parking)" className="flex-1" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCreateAmenity(); } }} />
                                        <Button type="button" onClick={handleAddCreateAmenity} variant="secondary" className="shrink-0"><Plus size={16} /></Button>
                                    </div>
                                    {createAmenities.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {createAmenities.map((item, idx) => (
                                                <span key={idx} className="bg-[var(--turf-green)]/10 text-[var(--turf-green)] text-xs px-3 py-1.5 rounded-full flex items-center gap-2 border border-[var(--turf-green)]/20">
                                                    {item}
                                                    <button type="button" onClick={() => setCreateAmenities(createAmenities.filter((_, i) => i !== idx))} className="hover:text-white transition-colors"><X size={12} /></button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {/* Images */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Images</h3>
                                    <div className="flex bg-white/5 rounded-xl p-1 border border-white/10 max-w-xs">
                                        <button type="button" onClick={() => setCreateImageMode('upload')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${createImageMode === 'upload' ? 'bg-[var(--turf-green)] text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                                            <Upload size={14} /> Upload Files
                                        </button>
                                        <button type="button" onClick={() => setCreateImageMode('url')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${createImageMode === 'url' ? 'bg-[var(--turf-green)] text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                                            <LinkIcon size={14} /> Paste URL
                                        </button>
                                    </div>
                                    {createImageMode === 'upload' ? (
                                        <div className="border border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-[var(--turf-green)] transition-colors relative group">
                                            <input type="file" multiple accept="image/*" onChange={(e) => { if (e.target.files) setCreateImages(prev => [...prev, ...Array.from(e.target.files!)]); }} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            <div className="flex flex-col items-center gap-3 text-gray-400 group-hover:text-[var(--turf-green)] transition-colors">
                                                <Upload className="w-10 h-10" />
                                                <span className="text-sm">{createImages.length > 0 ? `${createImages.length} file${createImages.length > 1 ? 's' : ''} selected` : 'Click or drag to upload images'}</span>
                                                <span className="text-xs text-gray-600">PNG, JPG up to 10MB each</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Input value={createNewImageUrl} onChange={(e) => setCreateNewImageUrl(e.target.value)} placeholder="https://example.com/photo.jpg" className="flex-1" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCreateImageUrl(); } }} />
                                            <Button type="button" onClick={handleAddCreateImageUrl} variant="secondary" className="shrink-0 gap-1"><Plus size={16} /> Add</Button>
                                        </div>
                                    )}
                                    {(createImages.length > 0 || createImageUrls.length > 0) && (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                            {createImages.map((file, idx) => (
                                                <div key={`file-${idx}`} className="relative group/img rounded-lg overflow-hidden border border-white/10 bg-white/5 aspect-video">
                                                    <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                                                    <button type="button" onClick={() => setCreateImages(createImages.filter((_, i) => i !== idx))} className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-red-400 opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"><X size={10} /></button>
                                                </div>
                                            ))}
                                            {createImageUrls.map((url, idx) => (
                                                <div key={`url-${idx}`} className="relative group/img rounded-lg overflow-hidden border border-white/10 bg-white/5 aspect-video">
                                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                                    <button type="button" onClick={() => setCreateImageUrls(createImageUrls.filter((_, i) => i !== idx))} className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-red-400 opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"><X size={10} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {createUploadProgress && (
                                        <div className="flex items-center gap-2 text-xs text-[var(--turf-green)] bg-[var(--turf-green)]/10 border border-[var(--turf-green)]/20 rounded-lg px-3 py-2">
                                            <Loader2 size={14} className="animate-spin shrink-0" />
                                            {createUploadProgress}
                                        </div>
                                    )}
                                </div>
                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={actionLoading === 'create'}
                                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-4 rounded-xl font-black text-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                                >
                                    {actionLoading === 'create' ? (
                                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating Court...</>
                                    ) : (
                                        <><Check size={22} /> Create Court</>
                                    )}
                                </button>
                            </form>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
