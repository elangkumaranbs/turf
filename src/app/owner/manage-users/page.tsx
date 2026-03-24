'use client';

import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { getAllUsers, updateUserRole, createUserDocument, updateUserProfile } from '@/lib/firebase/firestore';
import { Loader2, Shield, ShieldCheck, ShieldX, Users, Search, CheckCircle, XCircle, Clock, UserPlus, Pencil, Trash2, X } from 'lucide-react';
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
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                createFormData.email,
                createFormData.password
            );
            await createUserDocument(userCredential.user.uid, {
                email: createFormData.email,
                name: createFormData.name,
                role: createFormData.role,
                phone: createFormData.phone
            });
            const updatedUsers = await getAllUsers();
            setUsers(updatedUsers);
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
        if (!confirm(`⚠️ Are you sure you want to delete ${userName}?\n\nThis will permanently delete:\n• Firebase Auth account (they cannot log in again)\n• User profile & data\n• All their bookings\n• All their turfs (if owner)\n\nThis action cannot be undone!`)) return;
        setActionLoading(userId);
        try {
            const response = await fetch('/api/admin/delete-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, adminUid: user?.uid }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete user');
            }
            setUsers(users.filter(u => u.uid !== userId));
            alert('✅ User fully deleted (Auth account + all data)!');
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

    const filteredUsers = users.filter((u) => {
        const matchesSearch = (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === 'all' || u.role === filterRole;
        return matchesSearch && matchesRole;
    });

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
        <div className="space-y-8 animate-fade-up">
            {/* Header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        User <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-500">Management</span>
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">Manage {users.length} registered user{users.length !== 1 ? 's' : ''} across the platform.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:scale-[1.02]"
                >
                    <UserPlus size={18} /> Create New User
                </button>
            </div>

            {/* Stats Section */}
            <GlassCard className="p-6 sm:p-8 lg:p-10 border-white/5 bg-white/[0.02] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-3xl rounded-full pointer-events-none" />
                <div className="relative z-10 space-y-6">
                    <h3 className="text-xl font-bold text-white border-b border-white/5 pb-3 flex items-center gap-2">
                        <span className="bg-purple-500/10 text-purple-400 p-1.5 rounded-lg"><Users size={18} /></span>
                        Overview
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button onClick={() => setFilterRole(filterRole === 'pending_approval' ? 'all' : 'pending_approval')} className="text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:border-yellow-500/30 transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock size={16} className="text-yellow-400" />
                                <span className="text-xs text-gray-400 uppercase tracking-wide">Pending</span>
                            </div>
                            <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
                        </button>
                        <button onClick={() => setFilterRole(filterRole === 'turf_admin' ? 'all' : 'turf_admin')} className="text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <ShieldCheck size={16} className="text-emerald-400" />
                                <span className="text-xs text-gray-400 uppercase tracking-wide">Admins</span>
                            </div>
                            <p className="text-2xl font-bold text-emerald-400">{adminCount}</p>
                        </button>
                        <button onClick={() => setFilterRole(filterRole === 'user' ? 'all' : 'user')} className="text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <Users size={16} className="text-blue-400" />
                                <span className="text-xs text-gray-400 uppercase tracking-wide">Players</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-400">{userCount}</p>
                        </button>
                        <button onClick={() => setFilterRole(filterRole === 'super_admin' ? 'all' : 'super_admin')} className="text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <Shield size={16} className="text-purple-400" />
                                <span className="text-xs text-gray-400 uppercase tracking-wide">Super</span>
                            </div>
                            <p className="text-2xl font-bold text-purple-400">{superCount}</p>
                        </button>
                    </div>
                </div>
            </GlassCard>

            {/* Pending Approval Alert */}
            {pendingCount > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-400 shrink-0" />
                    <p className="text-sm text-yellow-300 font-medium">{pendingCount} user{pendingCount > 1 ? 's' : ''} awaiting approval. Review pending requests below.</p>
                </div>
            )}

            {/* User List Section */}
            <GlassCard className="p-6 sm:p-8 lg:p-10 border-white/5 bg-white/[0.02]">
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white border-b border-white/5 pb-3 flex items-center gap-2">
                        <span className="bg-blue-500/10 text-blue-400 p-1.5 rounded-lg"><Search size={18} /></span>
                        User Directory
                        <span className="ml-auto text-sm font-medium bg-white/10 text-gray-300 px-3 py-1 rounded-full">
                            {filteredUsers.length} result{filteredUsers.length !== 1 ? 's' : ''}
                        </span>
                    </h3>

                    {/* Search & Filter */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-11 pl-10 pr-4 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 focus:outline-none transition-all"
                            />
                        </div>
                        <Select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            options={[
                                { label: 'All Roles', value: 'all' },
                                { label: 'Players', value: 'user' },
                                { label: 'Turf Admins', value: 'turf_admin' },
                                { label: 'Super Admins', value: 'super_admin' },
                                { label: 'Pending Approval', value: 'pending_approval' },
                            ]}
                        />
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto rounded-xl border border-white/10">
                        <table className="w-full text-sm">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Phone</th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredUsers.map((u) => (
                                    <tr key={u.uid} className="hover:bg-white/5 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                    {(u.name || u.email || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-white font-medium truncate">{u.name || 'No Name'}</p>
                                                    <p className="text-gray-500 text-xs truncate">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">{getRoleBadge(u.role)}</td>
                                        <td className="px-5 py-4 text-gray-400">{u.phone || '—'}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* Role Actions */}
                                                {u.role === 'pending_approval' && (
                                                    <>
                                                        <button onClick={() => handleRoleUpdate(u.uid, 'turf_admin')} disabled={actionLoading === u.uid} className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all" title="Approve">
                                                            {actionLoading === u.uid ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                                        </button>
                                                        <button onClick={() => handleRoleUpdate(u.uid, 'user')} disabled={actionLoading === u.uid} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Reject">
                                                            <XCircle size={14} />
                                                        </button>
                                                    </>
                                                )}
                                                {u.role === 'user' && (
                                                    <button onClick={() => handleRoleUpdate(u.uid, 'turf_admin')} disabled={actionLoading === u.uid} className="p-1.5 text-xs text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all border border-emerald-500/20 px-2" title="Promote">
                                                        {actionLoading === u.uid ? <Loader2 size={12} className="animate-spin" /> : '↑ Admin'}
                                                    </button>
                                                )}
                                                {u.role === 'turf_admin' && u.email !== SUPER_ADMIN_EMAIL && (
                                                    <button onClick={() => handleRoleUpdate(u.uid, 'user')} disabled={actionLoading === u.uid} className="p-1.5 text-xs text-orange-400 hover:bg-orange-500/10 rounded-lg transition-all border border-orange-500/20 px-2" title="Revoke">
                                                        {actionLoading === u.uid ? <Loader2 size={12} className="animate-spin" /> : '↓ Player'}
                                                    </button>
                                                )}
                                                {/* Edit / Delete */}
                                                <button onClick={() => openEditModal(u)} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all" title="Edit">
                                                    <Pencil size={14} />
                                                </button>
                                                {u.email !== SUPER_ADMIN_EMAIL && (
                                                    <button onClick={() => handleDeleteUser(u.uid, u.name || u.email)} disabled={actionLoading === u.uid} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Delete">
                                                        {actionLoading === u.uid ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredUsers.length === 0 && (
                            <div className="text-center py-12">
                                <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-400">No users found matching your criteria.</p>
                            </div>
                        )}
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                        {filteredUsers.map((u) => (
                            <div key={u.uid} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-white font-bold flex-shrink-0">
                                            {(u.name || u.email || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-white font-medium truncate">{u.name || 'No Name'}</p>
                                            <p className="text-gray-500 text-xs truncate">{u.email}</p>
                                        </div>
                                    </div>
                                    {getRoleBadge(u.role)}
                                </div>
                                {u.phone && <p className="text-sm text-gray-400">📞 {u.phone}</p>}
                                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                    {u.role === 'pending_approval' && (
                                        <>
                                            <button onClick={() => handleRoleUpdate(u.uid, 'turf_admin')} disabled={actionLoading === u.uid} className="flex-1 py-2 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-all">
                                                {actionLoading === u.uid ? <Loader2 size={12} className="animate-spin mx-auto" /> : '✓ Approve'}
                                            </button>
                                            <button onClick={() => handleRoleUpdate(u.uid, 'user')} disabled={actionLoading === u.uid} className="flex-1 py-2 text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all">
                                                ✕ Reject
                                            </button>
                                        </>
                                    )}
                                    {u.role === 'user' && (
                                        <button onClick={() => handleRoleUpdate(u.uid, 'turf_admin')} disabled={actionLoading === u.uid} className="flex-1 py-2 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-all">
                                            ↑ Promote to Admin
                                        </button>
                                    )}
                                    {u.role === 'turf_admin' && u.email !== SUPER_ADMIN_EMAIL && (
                                        <button onClick={() => handleRoleUpdate(u.uid, 'user')} disabled={actionLoading === u.uid} className="flex-1 py-2 text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-lg hover:bg-orange-500/20 transition-all">
                                            ↓ Revoke Admin
                                        </button>
                                    )}
                                    <button onClick={() => openEditModal(u)} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all">
                                        <Pencil size={14} />
                                    </button>
                                    {u.email !== SUPER_ADMIN_EMAIL && (
                                        <button onClick={() => handleDeleteUser(u.uid, u.name || u.email)} disabled={actionLoading === u.uid} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                                            {actionLoading === u.uid ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {filteredUsers.length === 0 && (
                            <div className="text-center py-12">
                                <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-400">No users found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </GlassCard>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <GlassCard className="w-full max-w-lg p-6 sm:p-8 border-white/10 relative overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 blur-3xl rounded-full pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span className="bg-purple-500/10 text-purple-400 p-1.5 rounded-lg"><UserPlus size={18} /></span>
                                    Create New User
                                </h3>
                                <button onClick={() => setShowCreateModal(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateUser} className="space-y-5">
                                <Input label="Full Name" value={createFormData.name} onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })} placeholder="John Doe" required />
                                <Input label="Email Address" type="email" value={createFormData.email} onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })} placeholder="user@example.com" required />
                                <Input label="Password" type="password" value={createFormData.password} onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })} placeholder="Min 6 characters" required />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Select label="Role" value={createFormData.role} onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value as any })} options={[
                                        { label: 'Turf Admin', value: 'turf_admin' },
                                        { label: 'Player', value: 'user' },
                                        { label: 'Super Admin', value: 'super_admin' },
                                    ]} />
                                    <Input label="Phone Number" type="tel" value={createFormData.phone} onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })} placeholder="+91 98765 43210" />
                                </div>
                                <button
                                    type="submit"
                                    disabled={actionLoading === 'create'}
                                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3.5 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                                >
                                    {actionLoading === 'create' ? (
                                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</>
                                    ) : (
                                        <><CheckCircle size={18} /> Create User</>
                                    )}
                                </button>
                            </form>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <GlassCard className="w-full max-w-lg p-6 sm:p-8 border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span className="bg-blue-500/10 text-blue-400 p-1.5 rounded-lg"><Pencil size={18} /></span>
                                    Edit User
                                </h3>
                                <button onClick={() => { setShowEditModal(false); setEditingUser(null); }} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleEditUser} className="space-y-5">
                                <Input label="Full Name" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} placeholder="John Doe" required />
                                <Input label="Email Address" type="email" value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} placeholder="user@example.com" required />
                                <Input label="Phone Number" type="tel" value={editFormData.phone} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} placeholder="+91 98765 43210" />
                                <button
                                    type="submit"
                                    disabled={actionLoading === 'edit'}
                                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3.5 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                                >
                                    {actionLoading === 'edit' ? (
                                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                                    ) : (
                                        <><CheckCircle size={18} /> Save Changes</>
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
