'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { getOwnerRequests, updateOwnerRequestStatus, deleteOwnerRequest, TurfOwnerRequest } from '@/lib/firebase/firestore';
import { Loader2, ArrowLeft, Mail, Phone, MapPin, Building, Clock, CheckCircle, XCircle, Trash2, ShieldCheck } from 'lucide-react';

export default function PartnerRequestsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [requests, setRequests] = useState<TurfOwnerRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== 'super_admin') {
                router.push('/dashboard');
            } else {
                fetchRequests();
            }
        }
    }, [user, authLoading, router]);

    const fetchRequests = async () => {
        setLoading(true);
        const data = await getOwnerRequests();
        setRequests(data);
        setLoading(false);
    };

    const handleUpdateStatus = async (id: string, status: TurfOwnerRequest['status']) => {
        setActionLoading(id);
        try {
            await updateOwnerRequestStatus(id, status);
            setRequests(requests.map(r => r.id === id ? { ...r, status } : r));
        } catch (error: any) {
            alert('Failed to update status: ' + error.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this request?')) return;
        setActionLoading(id);
        try {
            await deleteOwnerRequest(id);
            setRequests(requests.filter(r => r.id !== id));
        } catch (error: any) {
            alert('Failed to delete request: ' + error.message);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredRequests = requests.filter(r => filterStatus === 'all' || r.status === filterStatus);
    const pendingCount = requests.filter(r => r.status === 'pending').length;

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
                <Loader2 className="animate-spin text-[var(--turf-green)] w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] p-4 sm:p-6 lg:p-8 animate-fade-up">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors group"
                        >
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-medium">Back to Dashboard</span>
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border border-blue-500/30">
                                <Mail className="w-6 h-6 text-blue-400" />
                            </div>
                            <h1 className="text-3xl font-bold text-white">Partner Requests</h1>
                        </div>
                        <p className="text-gray-400 ml-14 mt-1">Manage inquiries from turf owners wanting to join the platform.</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    {['all', 'pending', 'reviewed', 'approved', 'rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                                filterStatus === status 
                                ? 'bg-[var(--turf-green)] text-black' 
                                : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
                            }`}
                        >
                            {status} {status === 'pending' && pendingCount > 0 && `(${pendingCount})`}
                        </button>
                    ))}
                </div>

                {/* Requests List */}
                {filteredRequests.length === 0 ? (
                    <GlassCard className="p-12 text-center border-white/10">
                        <Mail className="w-12 h-12 text-gray-500 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl text-white font-medium">No requests found</h3>
                        <p className="text-gray-400 mt-2">There are no {filterStatus !== 'all' ? filterStatus : ''} partner inquiries.</p>
                    </GlassCard>
                ) : (
                    <div className="grid gap-4">
                        {filteredRequests.map(req => (
                            <GlassCard key={req.id} className="p-6 border-white/10 relative overflow-hidden group">
                                <div className={`absolute top-0 left-0 w-1 h-full ${
                                    req.status === 'pending' ? 'bg-yellow-500' :
                                    req.status === 'approved' ? 'bg-green-500' :
                                    req.status === 'rejected' ? 'bg-red-500' : 'bg-blue-500'
                                }`} />
                                
                                <div className="flex flex-col lg:flex-row gap-6 justify-between">
                                    <div className="space-y-4 flex-1">
                                        <div className="flex items-start justify-between sm:justify-start gap-4">
                                            <h3 className="text-xl font-bold text-white">{req.turfName}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                                req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                                                req.status === 'approved' ? 'bg-green-500/20 text-green-500' :
                                                req.status === 'rejected' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'
                                            }`}>
                                                {req.status}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                                <Building className="w-4 h-4 text-gray-500" /> {req.name}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                                <Mail className="w-4 h-4 text-gray-500" /> <a href={`mailto:${req.email}`} className="hover:text-blue-400">{req.email}</a>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                                <Phone className="w-4 h-4 text-gray-500" /> <a href={`tel:${req.phone}`} className="hover:text-blue-400">{req.phone}</a>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                                <MapPin className="w-4 h-4 text-gray-500" /> {req.location}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 sm:col-span-2">
                                                <Clock className="w-4 h-4" /> Received: {new Date(req.createdAt).toLocaleString()}
                                            </div>
                                        </div>

                                        {req.message && (
                                            <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/5">
                                                <p className="text-sm text-gray-300 italic">"{req.message}"</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-row lg:flex-col gap-2 justify-start lg:justify-end items-end shrink-0 pt-4 border-t border-white/5 lg:border-t-0 lg:border-l lg:pl-6">
                                        {req.status === 'pending' && (
                                            <button
                                                onClick={() => handleUpdateStatus(req.id!, 'reviewed')}
                                                disabled={actionLoading === req.id}
                                                className="w-full sm:w-auto lg:w-32 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                            >
                                                {actionLoading === req.id ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} Mark Reviewed
                                            </button>
                                        )}
                                        {req.status !== 'approved' && (
                                            <button
                                                onClick={() => handleUpdateStatus(req.id!, 'approved')}
                                                disabled={actionLoading === req.id}
                                                className="w-full sm:w-auto lg:w-32 flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                            >
                                                {actionLoading === req.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} Approve
                                            </button>
                                        )}
                                        {req.status !== 'rejected' && (
                                            <button
                                                onClick={() => handleUpdateStatus(req.id!, 'rejected')}
                                                disabled={actionLoading === req.id}
                                                className="w-full sm:w-auto lg:w-32 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                            >
                                                {actionLoading === req.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} Reject
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(req.id!)}
                                            disabled={actionLoading === req.id}
                                            className="w-full sm:w-auto lg:w-32 flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 mt-auto"
                                        >
                                            {actionLoading === req.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Delete
                                        </button>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
