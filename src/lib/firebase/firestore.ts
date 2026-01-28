import { db, storage } from './config';
import { collection, getDocs, doc, getDoc, addDoc, query, where, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface Turf {
    id: string;
    name: string;
    location: string;
    pricePerHour: number;
    description: string;
    images: string[];
    amenities: string[];
    wicketType: 'turf' | 'mat' | 'cement';
    adminId: string;
}

// Mock data to use until backend is populated
const MOCK_TURFS: Turf[] = [
    {
        id: 'pony-turf',
        name: 'Pony Turf',
        location: 'Gobichettipalayam',
        pricePerHour: 1000,
        description: 'Premium quality turf for cricket and football enthusiasts.',
        images: ['https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=2000&auto=format&fit=crop'],
        amenities: ['Floodlights', 'Parking', 'Water', 'Restroom'],
        wicketType: 'turf',
        adminId: 'admin1'
    }
];

export const getTurfs = async (): Promise<Turf[]> => {
    try {
        const turfsCol = collection(db, 'turfs');
        const turfSnapshot = await getDocs(turfsCol);
        const turfs = turfSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Turf));

        // Return mock data if Firestore is empty (for demo purposes)
        if (turfs.length === 0) {
            return MOCK_TURFS;
        }
        return turfs;
    } catch (error) {
        console.warn("Error fetching turfs (using mock data):", error);
        return MOCK_TURFS;
    }
};

export const getTurfById = async (id: string): Promise<Turf | null> => {
    try {
        // Check mock data first if ID matches
        const mockTurf = MOCK_TURFS.find(t => t.id === id);
        if (mockTurf) return mockTurf;

        const turfDoc = await getDoc(doc(db, 'turfs', id));
        if (turfDoc.exists()) {
            return { id: turfDoc.id, ...turfDoc.data() } as Turf;
        }
        return null;
    } catch (error) {
        console.warn("Error fetching turf by ID:", error);
        return MOCK_TURFS.find(t => t.id === id) || null;
    }
};

export interface Booking {
    id?: string;
    userId: string;
    turfId: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
    duration: number; // in minutes
    createdAt: string;
    status: 'confirmed' | 'cancelled' | 'pending';
}

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
        // In a real app, this would be paginated or filtered by admin's turfs
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
    } catch (error) {
        console.error("Error fetching all bookings:", error);
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
            status: 'active'
        };
        const docRef = await addDoc(turfsCol, newTurf);
        return docRef.id;
    } catch (error) {
        console.error("Error adding turf:", error);
        throw error;
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

export const updateUserRole = async (userId: string, newRole: 'user' | 'turf_admin' | 'super_admin'): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { role: newRole });
    } catch (error) {
        console.error("Error updating user role:", error);
        throw error;
    }
};
