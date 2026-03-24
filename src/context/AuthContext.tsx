// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// ─── Super Admin Email ──────────────────────────────────────────────
export const SUPER_ADMIN_EMAIL = 'gamedenoffiz@gmail.com';

interface UserData {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL?: string | null;
    phone?: string | null;
    role?: 'user' | 'turf_admin' | 'super_admin' | 'pending_approval';
}

interface AuthContextType {
    user: UserData | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, logout: async () => { } });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    // Auto-create Firestore doc if missing (e.g. new Google sign-in)
                    if (!userDoc.exists() && firebaseUser.email !== SUPER_ADMIN_EMAIL) {
                        const newRole = 'user';
                        await setDoc(userDocRef, {
                            uid: firebaseUser.uid,
                            name: firebaseUser.displayName || 'User',
                            email: firebaseUser.email || '',
                            role: newRole,
                            createdAt: new Date().toISOString()
                        });
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName,
                            photoURL: firebaseUser.photoURL,
                            role: newRole
                        });
                        setLoading(false);
                        return;
                    }

                    const userData = userDoc.data();
                    let role = userData?.role || 'user';

                    // Auto-promote super admin by email
                    if (firebaseUser.email === SUPER_ADMIN_EMAIL && role !== 'super_admin') {
                        role = 'super_admin';
                        try {
                            if (userDoc.exists()) {
                                await updateDoc(userDocRef, { role: 'super_admin' });
                            } else {
                                await setDoc(userDocRef, {
                                    uid: firebaseUser.uid,
                                    name: firebaseUser.displayName || 'Super Admin',
                                    email: firebaseUser.email,
                                    role: 'super_admin',
                                    createdAt: new Date().toISOString()
                                });
                            }
                        } catch (e) {
                            console.error("Failed to auto-promote super admin:", e);
                        }
                    }

                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        photoURL: userData?.photoURL || firebaseUser.photoURL,
                        phone: userData?.phone || userData?.contactPhone,
                        role
                    });
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        photoURL: firebaseUser.photoURL,
                        role: firebaseUser.email === SUPER_ADMIN_EMAIL ? 'super_admin' : 'user'
                    });
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        try {
            await auth.signOut();
            setUser(null);
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
