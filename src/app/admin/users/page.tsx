'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { getAllUsers, updateUserRole } from '@/lib/firebase/firestore';
import { Loader2, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ManageUsersPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Basic protection (in real app, usage of middleware or server checks is better)
        if (user && user.role !== 'super_admin' && user.email !== 'admin@turf.com') { // simplified check
            // allow view for demo if needed, otherwise redirect
            // router.push('/dashboard');
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

    const handleRoleUpdate = async (userId: string, newRole: 'user' | 'turf_admin' | 'super_admin') => {
        try {
            await updateUserRole(userId, newRole);
            setUsers(users.map(u => u.uid === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            alert('Failed to update role');
        }
    };

    if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>;

    return (
        <main className="min-h-screen bg-[#0a0a0a] pb-12">
            <Navbar />
            <div className="container mx-auto px-6 pt-32">
                <h1 className="text-3xl font-bold text-white mb-8">Manage Users (Super Admin)</h1>

                <GlassCard className="overflow-hidden border-white/10">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-white/5 text-white uppercase font-medium">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {users.map((u) => (
                                    <tr key={u.uid} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{u.name || 'No Name'}</div>
                                            <div>{u.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role === 'super_admin' ? 'bg-purple-500/20 text-purple-400' :
                                                    u.role === 'turf_admin' ? 'bg-[var(--turf-green)]/20 text-[var(--turf-green)]' :
                                                        'bg-gray-500/20 text-gray-400'
                                                }`}>
                                                {u.role || 'user'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleRoleUpdate(u.uid, 'turf_admin')}
                                                    className="text-xs border border-white/20 hover:bg-white/10 px-2 py-1 rounded text-white"
                                                >
                                                    Make Turf Admin
                                                </button>
                                                <button
                                                    onClick={() => handleRoleUpdate(u.uid, 'super_admin')}
                                                    className="text-xs border border-purple-500/20 hover:bg-purple-500/10 text-purple-400 px-2 py-1 rounded"
                                                >
                                                    Make Super Admin
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            </div>
        </main>
    );
}
