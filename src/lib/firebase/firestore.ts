import { db, storage } from './config';
import { collection, getDocs, doc, getDoc, addDoc, setDoc, query, where, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ─── Turf Interface ────────────────────────────────────────────────
export interface OperatingHours {
    open: string;  // e.g. "06:00"
    close: string; // e.g. "22:00"
}

export interface Turf {
    id: string;
    name: string;
    location?: string;         // Deprecated — kept for backward compatibility
    address: string;           // Street address
    city: string;              // City name (e.g. "Gobichettipalayam")
    pricePerHour: number;
    description: string;
    images: string[];
    amenities: string[];
    wicketType: 'turf' | 'mat' | 'cement';
    adminId: string;           // Owner's UID
    contactPhone?: string;
    contactEmail?: string;
    operatingHours?: OperatingHours;
    availableTimeSlots?: string[];  // Owner-configured slots, e.g. ["06:00 AM", "07:00 AM"]
    courts?: number;           // Number of courts/pitches at this venue
    status?: 'active' | 'inactive';
    createdAt?: string;
}

// ─── Booking Interface ─────────────────────────────────────────────
export interface Booking {
    id?: string;
    userId: string;
    turfId: string;
    date: string; // YYYY-MM-DD
    time?: string; // Deprecated — kept for backward compat with old bookings
    times: string[]; // Array of selected time slots, e.g. ["07:00 AM", "08:00 AM"]
    duration: number; // in minutes
    createdAt: string;
    status: 'confirmed' | 'cancelled' | 'pending';
}

// ═══════════════════════════════════════════════════════════════════
//  TURF OPERATIONS (fully dynamic — no hardcoded data)
// ═══════════════════════════════════════════════════════════════════

export const getTurfs = async (): Promise<Turf[]> => {
    try {
        const turfsCol = collection(db, 'turfs');
        const turfSnapshot = await getDocs(turfsCol);
        return turfSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Turf));
    } catch (error) {
        console.error("Error fetching turfs:", error);
        return [];
    }
};

// Get all turfs with owner information (for super admin)
export const getAllTurfsWithOwners = async (): Promise<(Turf & { ownerName?: string; ownerEmail?: string })[]> => {
    try {
        const turfsCol = collection(db, 'turfs');
        const turfSnapshot = await getDocs(turfsCol);
        const turfs = turfSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Turf));
        
        // Fetch owner details for each turf
        const turfsWithOwners = await Promise.all(
            turfs.map(async (turf) => {
                try {
                    const ownerDoc = await getDoc(doc(db, 'users', turf.adminId));
                    if (ownerDoc.exists()) {
                        const ownerData = ownerDoc.data();
                        return {
                            ...turf,
                            ownerName: ownerData.name || 'Unknown',
                            ownerEmail: ownerData.email || 'Unknown'
                        };
                    }
                    return { ...turf, ownerName: 'Unknown', ownerEmail: 'Unknown' };
                } catch (error) {
                    return { ...turf, ownerName: 'Unknown', ownerEmail: 'Unknown' };
                }
            })
        );
        
        return turfsWithOwners;
    } catch (error) {
        console.error("Error fetching turfs with owners:", error);
        return [];
    }
};

export const getTurfById = async (id: string): Promise<Turf | null> => {
    try {
        const turfDoc = await getDoc(doc(db, 'turfs', id));
        if (turfDoc.exists()) {
            return { id: turfDoc.id, ...turfDoc.data() } as Turf;
        }
        return null;
    } catch (error) {
        console.error("Error fetching turf by ID:", error);
        return null;
    }
};

export const getTurfsByAdmin = async (adminId: string): Promise<Turf[]> => {
    try {
        const turfsCol = collection(db, 'turfs');
        const q = query(turfsCol, where("adminId", "==", adminId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Turf));
    } catch (error) {
        console.error("Error fetching admin turfs:", error);
        return [];
    }
};

export const addTurf = async (turfData: Omit<Turf, 'id' | 'adminId'>, adminId: string): Promise<string> => {
    try {
        const turfsCol = collection(db, 'turfs');
        const newTurf = {
            ...turfData,
            adminId,
            createdAt: new Date().toISOString(),
            status: turfData.status || 'active'
        };
        const docRef = await addDoc(turfsCol, newTurf);
        return docRef.id;
    } catch (error) {
        console.error("Error adding turf:", error);
        throw error;
    }
};

export const updateTurf = async (turfId: string, data: Partial<Omit<Turf, 'id' | 'adminId'>>): Promise<void> => {
    try {
        const turfRef = doc(db, 'turfs', turfId);
        await updateDoc(turfRef, { ...data, updatedAt: new Date().toISOString() });
    } catch (error) {
        console.error("Error updating turf:", error);
        throw error;
    }
};

export const deleteTurf = async (turfId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, 'turfs', turfId));
    } catch (error) {
        console.error("Error deleting turf:", error);
        throw error;
    }
};

// ═══════════════════════════════════════════════════════════════════
//  BOOKING OPERATIONS
// ═══════════════════════════════════════════════════════════════════

export const createBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>): Promise<string> => {
    try {
        const bookingsCol = collection(db, 'bookings');
        const newBooking = {
            ...bookingData,
            createdAt: new Date().toISOString(),
            status: 'confirmed'
        };
        const docRef = await addDoc(bookingsCol, newBooking);
        return docRef.id;
    } catch (error) {
        console.error("Error creating booking:", error);
        throw error;
    }
};

export const getBookingsForTurf = async (turfId: string, date: string): Promise<Booking[]> => {
    try {
        const bookingsCol = collection(db, 'bookings');
        const q = query(bookingsCol, where("turfId", "==", turfId), where("date", "==", date));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
    } catch (error) {
        console.error("Error fetching bookings:", error);
        return [];
    }
};

export const getBookingsByUser = async (userId: string): Promise<Booking[]> => {
    try {
        const bookingsCol = collection(db, 'bookings');
        const q = query(bookingsCol, where("userId", "==", userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
    } catch (error) {
        console.error("Error fetching user bookings:", error);
        return [];
    }
};

export const getAllBookings = async (): Promise<Booking[]> => {
    try {
        const bookingsCol = collection(db, 'bookings');
        const snapshot = await getDocs(bookingsCol);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
    } catch (error) {
        console.error("Error fetching all bookings:", error);
        return [];
    }
};

// Get all bookings across an owner's turfs
export const getBookingsByOwner = async (ownerId: string): Promise<(Booking & { turfName?: string })[]> => {
    try {
        // First, get all turfs owned by this owner
        const ownerTurfs = await getTurfsByAdmin(ownerId);
        if (ownerTurfs.length === 0) return [];

        const turfMap = new Map(ownerTurfs.map(t => [t.id, t.name]));
        const turfIds = ownerTurfs.map(t => t.id);

        // Firestore 'in' queries support max 30 values, chunk if needed
        const allBookings: (Booking & { turfName?: string })[] = [];
        const chunks = [];
        for (let i = 0; i < turfIds.length; i += 30) {
            chunks.push(turfIds.slice(i, i + 30));
        }

        for (const chunk of chunks) {
            const bookingsCol = collection(db, 'bookings');
            const q = query(bookingsCol, where("turfId", "in", chunk));
            const snapshot = await getDocs(q);
            const bookings = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    turfName: turfMap.get(data.turfId) || 'Unknown'
                } as Booking & { turfName?: string };
            });
            allBookings.push(...bookings);
        }

        // Sort by creation date (newest first)
        allBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return allBookings;
    } catch (error) {
        console.error("Error fetching owner bookings:", error);
        return [];
    }
};

// ═══════════════════════════════════════════════════════════════════
//  OWNER STATS
// ═══════════════════════════════════════════════════════════════════

export interface OwnerStats {
    totalCourts: number;
    totalBookings: number;
    activeCourts: number;
}

export const getOwnerStats = async (ownerId: string): Promise<OwnerStats> => {
    try {
        const ownerTurfs = await getTurfsByAdmin(ownerId);
        const turfIds = ownerTurfs.map(t => t.id);

        let totalBookings = 0;
        if (turfIds.length > 0) {
            const chunks = [];
            for (let i = 0; i < turfIds.length; i += 30) {
                chunks.push(turfIds.slice(i, i + 30));
            }
            for (const chunk of chunks) {
                const bookingsCol = collection(db, 'bookings');
                const q = query(bookingsCol, where("turfId", "in", chunk));
                const snapshot = await getDocs(q);
                totalBookings += snapshot.size;
            }
        }

        return {
            totalCourts: ownerTurfs.length,
            activeCourts: ownerTurfs.filter(t => t.status !== 'inactive').length,
            totalBookings
        };
    } catch (error) {
        console.error("Error fetching owner stats:", error);
        return { totalCourts: 0, activeCourts: 0, totalBookings: 0 };
    }
};

// ═══════════════════════════════════════════════════════════════════
//  USER OPERATIONS
// ═══════════════════════════════════════════════════════════════════

export const getAllUsers = async (): Promise<any[]> => {
    try {
        const usersCol = collection(db, 'users');
        const snapshot = await getDocs(usersCol);
        return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
};

export const updateUserRole = async (userId: string, newRole: 'user' | 'turf_admin' | 'super_admin' | 'pending_approval'): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { role: newRole });
    } catch (error) {
        console.error("Error updating user role:", error);
        throw error;
    }
};

export const updateUserProfile = async (userId: string, data: Record<string, any>): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { ...data, updatedAt: new Date().toISOString() });
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }
};

// Create a new user document in Firestore (for manual admin creation)
export const createUserDocument = async (uid: string, userData: {
    email: string;
    name: string;
    role: 'user' | 'turf_admin' | 'super_admin' | 'pending_approval';
    phone?: string;
}): Promise<void> => {
    try {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, {
            uid,
            ...userData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error creating user document:", error);
        throw error;
    }
};

// Delete user document from Firestore
export const deleteUserDocument = async (userId: string): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        await deleteDoc(userRef);
    } catch (error) {
        console.error("Error deleting user document:", error);
        throw error;
    }
};

// Get user by ID
export const getUserById = async (userId: string): Promise<any | null> => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            return { uid: userDoc.id, ...userDoc.data() };
        }
        return null;
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        return null;
    }
};
