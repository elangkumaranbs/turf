import { db } from './config';
import { collection, doc, addDoc, getDocs, deleteDoc, updateDoc, query, where, orderBy, getDoc } from 'firebase/firestore';

export interface Review {
    id?: string;
    turfId: string;
    userId: string;
    userName: string;
    userImage?: string;
    rating: number; // 1 to 5
    comment: string;
    createdAt: string;
}

export const getReviewsForTurf = async (turfId: string): Promise<Review[]> => {
    try {
        const reviewsCol = collection(db, 'reviews');
        const q = query(reviewsCol, where("turfId", "==", turfId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return [];
    }
};

export const addReview = async (reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<string> => {
    try {
        const reviewsCol = collection(db, 'reviews');
        const newReview = {
            ...reviewData,
            createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(reviewsCol, newReview);
        
        // Update Turf average rating
        await updateTurfRating(reviewData.turfId);
        
        return docRef.id;
    } catch (error) {
        console.error("Error adding review:", error);
        throw error;
    }
};

export const deleteReview = async (reviewId: string, turfId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, 'reviews', reviewId));
        // Update Turf average rating
        await updateTurfRating(turfId);
    } catch (error) {
        console.error("Error deleting review:", error);
        throw error;
    }
};

// Internal helper to recalculate and update the turf's average rating
const updateTurfRating = async (turfId: string) => {
    try {
        const reviews = await getReviewsForTurf(turfId);
        let averageRating = 0;
        const reviewCount = reviews.length;
        
        if (reviewCount > 0) {
            const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
            averageRating = sum / reviewCount;
        }
        
        const turfRef = doc(db, 'turfs', turfId);
        await updateDoc(turfRef, { averageRating, reviewCount });
    } catch (error) {
        console.error("Error updating turf rating:", error);
        throw error;
    }
};
