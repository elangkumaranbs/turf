'use client';

import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { getAllUsers, updateUserRole, createUserDocument, deleteUserDocument, updateUserProfile } from '@/lib/firebase/firestore';
import { Loader2, Shield, ShieldCheck, ShieldX, Users, Search, CheckCircle, XCircle, Clock, UserPlus, Pencil, Trash2, X, ArrowLeft } from 'lucide-react';
import { useAuth, SUPER_ADMIN_EMAIL } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

export default function ManageUsersPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [createFormData, setCreateFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'turf_admin' as 'user' | 'turf_admin' | 'super_admin' | 'pending_approval',
        phone: ''
    });
    const [editFormData, setEditFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });

    useEffect(() => {
        if (user && user.role !== 'super_admin') {
            router.push('/dashboard');
        }
    }, [user, router]);

    useEffect(() => {
        const fetchUsers = async () => {
            const data = await getAllUsers();
            setUsers(data);
            setLoading(false);
        };
        fetchUsers();
    }, []);

    const handleRoleUpdate = async (userId: string, newRole: 'user' | 'turf_admin' | 'super_admin' | 'pending_approval') => {
        setActionLoading(userId);
        try {
            await updateUserRole(userId, newRole);
            setUsers(users.map(u => u.uid === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            alert('Failed to update role');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading('create');
        try {
            // Create Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                createFormData.email,
                createFormData.password
            );

            // Create Firestore user document
            await createUserDocument(userCredential.user.uid, {
                email: createFormData.email,
                name: createFormData.name,
                role: createFormData.role,
                phone: createFormData.phone
            });

            // Refresh user list
            const updatedUsers = await getAllUsers();
            setUsers(updatedUsers);

            // Reset form and close modal
            setCreateFormData({ name: '', email: '', password: '', role: 'turf_admin', phone: '' });
            setShowCreateModal(false);
            alert('User created successfully!');
        } catch (error: any) {
            console.error('Error creating user:', error);
            alert(`Failed to create user: ${error.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleEditUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setActionLoading('edit');
        try {
            await updateUserProfile(editingUser.uid, {
                name: editFormData.name,
                email: editFormData.email,
                phone: editFormData.phone
            });

            // Update local state
            setUsers(users.map(u =>
                u.uid === editingUser.uid
                    ? { ...u, name: editFormData.name, email: editFormData.email, phone: editFormData.phone }
                    : u
            ));

            setShowEditModal(false);
            setEditingUser(null);
            alert('User updated successfully!');
        } catch (error: any) {
            console.error('Error updating user:', error);
            alert(`Failed to update user: ${error.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!confirm(`⚠️ Are you sure you want to delete ${userName}?\n\nThis will permanently delete:\n• User account\n• All their bookings\n• All their turfs (if owner)\n\nThis action cannot be undone!`)) return;
        setActionLoading(userId);
        try {
            await deleteUserDocument(userId);
            setUsers(users.filter(u => u.uid !== userId));
            alert('✅ User and all associated data deleted successfully!');
        } catch (error: any) {
            console.error('Error deleting user:', error);
            alert(`Failed to delete user: ${error.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const openEditModal = (user: any) => {
        setEditingUser(user);
        setEditFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || ''
        });
        setShowEditModal(true);
    };

    // Filter and search
    const filteredUsers = users.filter((u) => {
        const matchesSearch = (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === 'all' || u.role === filterRole;
        return matchesSearch && matchesRole;
    });

    // Count by role
    const pendingCount = users.filter(u => u.role === 'pending_approval').length;
    const adminCount = users.filter(u => u.role === 'turf_admin').length;
    const userCount = users.filter(u => u.role === 'user').length;
    const superCount = users.filter(u => u.role === 'super_admin').length;

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'super_admin':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-300 border border-purple-500/30 shadow-lg shadow-purple-500/10">
                    <Shield size={12} /> Super Admin
                </span>;
            case 'turf_admin':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase bg-gradient-to-r from-[var(--turf-green)]/20 to-emerald-500/20 text-[var(--turf-green)] border border-[var(--turf-green)]/30 shadow-lg shadow-green-500/10">
                    <ShieldCheck size={12} /> Turf Admin
                </span>;
            case 'pending_approval':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border border-yellow-500/30 shadow-lg shadow-yellow-500/10 animate-pulse">
                    <Clock size={12} /> Pending
                </span>;
            default:
                return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase bg-gray-500/10 text-gray-300 border border-gray-500/20">
                    <Users size={12} /> Player
                </span>;
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
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30">
                            <Users className="w-6 h-6 text-purple-400" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">User Management</h1>
                    </div>
                    <p className="text-gray-400 text-sm sm:text-base sm:ml-14">Manage {users.length} registered user{users.length !== 1 ? 's' : ''} across the platform</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} className="gap-2 w-full sm:w-auto bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg shadow-purple-500/20">
                    <UserPlus size={18} /> Create New User
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <GlassCard
                    className={`p-5 text-center border-yellow-500/20 cursor-pointer hover:border-yellow-500/50 transition-all duration-300 group ${filterRole === 'pending_approval' ? 'bg-yellow-500/10 border-yellow-500/40' : ''}`}
                    onClick={() => setFilterRole(filterRole === 'pending_approval' ? 'all' : 'pending_approval')}
                >
                    <div className="p-2.5 rounded-xl bg-yellow-500/10 group-hover:bg-yellow-500/20 w-fit mx-auto mb-3 transition-colors">
                        <Clock className="w-6 h-6 text-yellow-400" />
                    </div>
                    <p className="text-3xl font-bold text-yellow-400 mb-1">{pendingCount}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Pending Approval</p>
                </GlassCard>
                <GlassCard
                    className={`p-5 text-center border-[var(--turf-green)]/20 cursor-pointer hover:border-[var(--turf-green)]/50 transition-all duration-300 group ${filterRole === 'turf_admin' ? 'bg-[var(--turf-green)]/10 border-[var(--turf-green)]/40' : ''}`}
                    onClick={() => setFilterRole(filterRole === 'turf_admin' ? 'all' : 'turf_admin')}
                >
                    <div className="p-2.5 rounded-xl bg-[var(--turf-green)]/10 group-hover:bg-[var(--turf-green)]/20 w-fit mx-auto mb-3 transition-colors">
                        <ShieldCheck className="w-6 h-6 text-[var(--turf-green)]" />
                    </div>
                    <p className="text-3xl font-bold text-[var(--turf-green)] mb-1">{adminCount}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Turf Admins</p>
                </GlassCard>
                <GlassCard
                    className={`p-5 text-center border-gray-500/20 cursor-pointer hover:border-gray-500/50 transition-all duration-300 group ${filterRole === 'user' ? 'bg-gray-500/10 border-gray-500/40' : ''}`}
                    onClick={() => setFilterRole(filterRole === 'user' ? 'all' : 'user')}
                >
                    <div className="p-2.5 rounded-xl bg-gray-500/10 group-hover:bg-gray-500/20 w-fit mx-auto mb-3 transition-colors">
                        <Users className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-3xl font-bold text-gray-300 mb-1">{userCount}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Players</p>
                </GlassCard>
                <GlassCard
                    className={`p-5 text-center border-purple-500/20 cursor-pointer hover:border-purple-500/50 transition-all duration-300 group ${filterRole === 'super_admin' ? 'bg-purple-500/10 border-purple-500/40' : ''}`}
                    onClick={() => setFilterRole(filterRole === 'super_admin' ? 'all' : 'super_admin')}
                >
                    <div className="p-2.5 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 w-fit mx-auto mb-3 transition-colors">
                        <Shield className="w-6 h-6 text-purple-400" />
                    </div>
                    <p className="text-3xl font-bold text-purple-400 mb-1">{superCount}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Super Admins</p>
                </GlassCard>
            </div>

            {/* Pending Approvals Alert */}
            {pendingCount > 0 && filterRole !== 'pending_approval' && (
                <GlassCard className="p-4 sm:p-5 border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 hover:border-yellow-500/50 transition-all duration-300">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 flex-1">
                            <div className="p-2.5 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex-shrink-0">
                                <Clock className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-yellow-400 font-semibold text-sm">
                                    {pendingCount} account{pendingCount !== 1 ? 's' : ''} awaiting approval
                                </p>
                                <p className="text-gray-400 text-xs mt-0.5">Review and approve new turf owner registrations</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setFilterRole('pending_approval')}
                            className="w-full sm:w-auto text-sm font-medium text-yellow-400 hover:text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 px-4 py-2 rounded-xl transition-all text-center flex-shrink-0"
                        >
                            Review Now →
                        </button>
                    </div>
                </GlassCard>
            )}

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all shadow-lg shadow-black/5"
                    />
                </div>
                {filterRole !== 'all' && (
                    <button
                        onClick={() => setFilterRole('all')}
                        className="h-12 px-5 rounded-xl text-sm font-medium text-gray-400 border border-white/10 hover:bg-white/5 hover:text-white transition-all flex items-center gap-2"
                    >
                        Clear Filter <X size={14} />
                    </button>
                )}
            </div>

            {/* Users List - Desktop Table / Mobile Cards */}
            <GlassCard className="overflow-hidden border-white/10 p-0 shadow-xl">
                {/* Desktop Table - Hidden on Mobile */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gradient-to-r from-white/[0.08] to-white/[0.04] text-white font-semibold text-xs border-b border-white/10">
                            <tr>
                                <th className="px-6 py-4 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-4 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.map((u) => {
                                const isSelf = u.uid === user?.uid;
                                const isSuperAdmin = u.email === SUPER_ADMIN_EMAIL;
                                return (
                                    <tr key={u.uid} className={`hover:bg-white/5 transition-all duration-200 group ${u.role === 'pending_approval' ? 'bg-yellow-500/5 hover:bg-yellow-500/10' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center font-bold text-white group-hover:scale-110 transition-transform">
                                                    {(u.name || u.email || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-white">{u.name || 'No Name'}</div>
                                                    <div className="text-xs text-gray-400">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getRoleBadge(u.role || 'user')}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-400">
                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {isSuperAdmin || isSelf ? (
                                                <span className="px-3 py-1.5 text-xs text-gray-500 bg-white/5 border border-white/5 rounded-lg italic">Protected Account</span>
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    {/* Edit and Delete buttons - always visible */}
                                                    <button
                                                        onClick={() => openEditModal(u)}
                                                        className="flex items-center gap-1.5 text-xs border border-blue-500/40 hover:bg-blue-500/20 text-blue-400 px-3 py-2 rounded-lg transition-all hover:scale-105 active:scale-95 font-medium"
                                                    >
                                                        <Pencil size={13} />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(u.uid, u.name || u.email)}
                                                        disabled={actionLoading === u.uid}
                                                        className="flex items-center gap-1.5 text-xs border border-red-500/40 hover:bg-red-500/20 text-red-400 px-3 py-2 rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                                    >
                                                        {actionLoading === u.uid ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                                        Delete
                                                    </button>

                                                    {/* Role management buttons */}
                                                    {u.role === 'pending_approval' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleRoleUpdate(u.uid, 'turf_admin')}
                                                                disabled={actionLoading === u.uid}
                                                                className="flex items-center gap-1.5 text-xs border border-green-500/40 bg-green-500/10 hover:bg-green-500/25 text-green-400 px-3 py-2 rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 font-medium"
                                                            >
                                                                {actionLoading === u.uid ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleRoleUpdate(u.uid, 'user')}
                                                                disabled={actionLoading === u.uid}
                                                                className="flex items-center gap-1.5 text-xs border border-red-500/40 bg-red-500/10 hover:bg-red-500/25 text-red-400 px-3 py-2 rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 font-medium"
                                                            >
                                                                <XCircle size={13} />
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {u.role === 'user' && (
                                                        <button
                                                            onClick={() => handleRoleUpdate(u.uid, 'turf_admin')}
                                                            disabled={actionLoading === u.uid}
                                                            className="flex items-center gap-1.5 text-xs border border-[var(--turf-green)]/40 hover:bg-[var(--turf-green)]/20 text-[var(--turf-green)] px-3 py-2 rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 font-medium"
                                                        >
                                                            {actionLoading === u.uid ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                                                            Make Admin
                                                        </button>
                                                    )}
                                                    {u.role === 'turf_admin' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleRoleUpdate(u.uid, 'user')}
                                                                disabled={actionLoading === u.uid}
                                                                className="flex items-center gap-1.5 text-xs border border-gray-500/40 hover:bg-gray-500/20 text-gray-400 px-3 py-2 rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 font-medium"
                                                            >
                                                                <ShieldX size={13} />
                                                                Revoke
                                                            </button>
                                                            <button
                                                                onClick={() => handleRoleUpdate(u.uid, 'super_admin')}
                                                                disabled={actionLoading === u.uid}
                                                                className="flex items-center gap-1.5 text-xs border border-purple-500/40 hover:bg-purple-500/20 text-purple-400 px-3 py-2 rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 font-medium"
                                                            >
                                                                <Shield size={13} />
                                                                Super Admin
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card Layout - Hidden on Desktop */}
                <div className="lg:hidden divide-y divide-white/5">
                    {filteredUsers.map((u) => {
                        const isSelf = u.uid === user?.uid;
                        const isSuperAdmin = u.email === SUPER_ADMIN_EMAIL;
                        return (
                            <div key={u.uid} className={`p-4 hover:bg-white/5 transition-all duration-200 ${u.role === 'pending_approval' ? 'bg-yellow-500/5' : ''}`}>
                                {/* User Info */}
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center font-bold text-white flex-shrink-0">
                                        {(u.name || u.email || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-white truncate">{u.name || 'No Name'}</div>
                                        <div className="text-xs text-gray-400 truncate">{u.email}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                        </div>
                                    </div>
                                </div>

                                {/* Role Badge */}
                                <div className="mb-3">
                                    {getRoleBadge(u.role || 'user')}
                                </div>

                                {/* Actions */}
                                {isSuperAdmin || isSelf ? (
                                    <span className="inline-block px-3 py-1.5 text-xs text-gray-500 bg-white/5 border border-white/5 rounded-lg italic">Protected Account</span>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openEditModal(u)}
                                                className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-blue-500/40 hover:bg-blue-500/20 text-blue-400 px-3 py-2.5 rounded-lg transition-all font-medium"
                                            >
                                                <Pencil size={13} />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(u.uid, u.name || u.email)}
                                                disabled={actionLoading === u.uid}
                                                className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-red-500/40 hover:bg-red-500/20 text-red-400 px-3 py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                            >
                                                {actionLoading === u.uid ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                                Delete
                                            </button>
                                        </div>

                                        {/* Role management buttons */}
                                        {u.role === 'pending_approval' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleRoleUpdate(u.uid, 'turf_admin')}
                                                    disabled={actionLoading === u.uid}
                                                    className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-green-500/40 bg-green-500/10 hover:bg-green-500/25 text-green-400 px-3 py-2.5 rounded-lg transition-all disabled:opacity-50 font-medium"
                                                >
                                                    {actionLoading === u.uid ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleRoleUpdate(u.uid, 'user')}
                                                    disabled={actionLoading === u.uid}
                                                    className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-red-500/40 bg-red-500/10 hover:bg-red-500/25 text-red-400 px-3 py-2.5 rounded-lg transition-all disabled:opacity-50 font-medium"
                                                >
                                                    <XCircle size={13} />
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                        {u.role === 'user' && (
                                            <button
                                                onClick={() => handleRoleUpdate(u.uid, 'turf_admin')}
                                                disabled={actionLoading === u.uid}
                                                className="w-full flex items-center justify-center gap-1.5 text-xs border border-[var(--turf-green)]/40 hover:bg-[var(--turf-green)]/20 text-[var(--turf-green)] px-3 py-2.5 rounded-lg transition-all disabled:opacity-50 font-medium"
                                            >
                                                {actionLoading === u.uid ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                                                Make Admin
                                            </button>
                                        )}
                                        {u.role === 'turf_admin' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleRoleUpdate(u.uid, 'user')}
                                                    disabled={actionLoading === u.uid}
                                                    className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-gray-500/40 hover:bg-gray-500/20 text-gray-400 px-3 py-2.5 rounded-lg transition-all disabled:opacity-50 font-medium"
                                                >
                                                    <ShieldX size={13} />
                                                    Revoke
                                                </button>
                                                <button
                                                    onClick={() => handleRoleUpdate(u.uid, 'super_admin')}
                                                    disabled={actionLoading === u.uid}
                                                    className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-purple-500/40 hover:bg-purple-500/20 text-purple-400 px-3 py-2.5 rounded-lg transition-all disabled:opacity-50 font-medium"
                                                >
                                                    <Shield size={13} />
                                                    Super Admin
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {filteredUsers.length === 0 && (
                    <div className="p-16 text-center bg-gradient-to-br from-white/[0.02] to-white/[0.05]">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 w-fit mx-auto mb-6">
                            <Users className="w-16 h-16 text-purple-400" />
                        </div>
                        <h3 className="text-2xl text-white font-bold mb-2">No users found</h3>
                        <p className="text-gray-400 max-w-md mx-auto">Try adjusting your search or filter criteria</p>
                    </div>
                )}
            </GlassCard>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
                    <GlassCard className="w-full max-w-lg border-white/10 shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] p-0">
                        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-white/10 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30">
                                    <UserPlus className="w-6 h-6 text-purple-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">Create New User</h2>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                <X size={22} />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-6 sm:p-8 pt-6 custom-scrollbar">
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <Input
                                    label="Full Name"
                                    value={createFormData.name}
                                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    value={createFormData.email}
                                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Password"
                                    type="password"
                                    value={createFormData.password}
                                    onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Phone (optional)"
                                    value={createFormData.phone}
                                    onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                                />
                                <Select
                                    label="Role"
                                    value={createFormData.role}
                                    onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value as any })}
                                    options={[
                                        { label: 'Player', value: 'user' },
                                        { label: 'Turf Admin', value: 'turf_admin' },
                                        { label: 'Pending Approval', value: 'pending_approval' },
                                        { label: 'Super Admin', value: 'super_admin' }
                                    ]}
                                />
                                <div className="flex gap-3 pt-4">
                                    <Button type="submit" isLoading={actionLoading === 'create'} className="flex-1">
                                        Create User
                                    </Button>
                                    <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
                    <GlassCard className="w-full max-w-lg border-white/10 shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] p-0">
                        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-white/10 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30">
                                    <Pencil className="w-6 h-6 text-blue-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">Edit User</h2>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                <X size={22} />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-6 sm:p-8 pt-6 custom-scrollbar">
                            <form onSubmit={handleEditUser} className="space-y-4">
                                <Input
                                    label="Full Name"
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    value={editFormData.email}
                                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Phone"
                                    value={editFormData.phone}
                                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                />
                                <div className="flex gap-3 pt-4">
                                    <Button type="submit" isLoading={actionLoading === 'edit'} className="flex-1">
                                        Save Changes
                                    </Button>
                                    <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
