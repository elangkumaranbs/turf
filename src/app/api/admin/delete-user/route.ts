import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

// ─── Security Headers ──────────────────────────────────────────────
function securityHeaders(): Record<string, string> {
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
    };
}

export async function POST(request: NextRequest) {
    try {
        const { userId, adminUid } = await request.json();

        // ─── Input Validation ──────────────────────────────────────
        if (!userId || !adminUid) {
            return NextResponse.json(
                { error: 'Missing userId or adminUid' },
                { status: 400, headers: securityHeaders() }
            );
        }

        // ─── Verify the requester is a super_admin ─────────────────
        const adminDoc = await adminDb.collection('users').doc(adminUid).get();
        if (!adminDoc.exists || adminDoc.data()?.role !== 'super_admin') {
            return NextResponse.json(
                { error: 'Unauthorized: Only super admins can delete users' },
                { status: 403, headers: securityHeaders() }
            );
        }

        // ─── Prevent self-deletion ─────────────────────────────────
        if (userId === adminUid) {
            return NextResponse.json(
                { error: 'Cannot delete your own account' },
                { status: 400, headers: securityHeaders() }
            );
        }

        // ─── Step 1: Delete Firestore data (cascade) ───────────────
        const db = adminDb;

        // Delete user's bookings
        const userBookings = await db.collection('bookings').where('userId', '==', userId).get();
        const batch1 = db.batch();
        userBookings.docs.forEach(doc => batch1.delete(doc.ref));
        if (userBookings.size > 0) await batch1.commit();

        // Delete user's turfs and their bookings
        const userTurfs = await db.collection('turfs').where('adminId', '==', userId).get();
        for (const turfDoc of userTurfs.docs) {
            const turfBookings = await db.collection('bookings').where('turfId', '==', turfDoc.id).get();
            const batch2 = db.batch();
            turfBookings.docs.forEach(doc => batch2.delete(doc.ref));
            if (turfBookings.size > 0) await batch2.commit();
            await turfDoc.ref.delete();
        }

        // Delete pending orders
        const pendingOrders = await db.collection('pending_orders').where('userId', '==', userId).get();
        const batch3 = db.batch();
        pendingOrders.docs.forEach(doc => batch3.delete(doc.ref));
        if (pendingOrders.size > 0) await batch3.commit();

        // Delete the user Firestore document
        await db.collection('users').doc(userId).delete();

        // ─── Step 2: Delete Firebase Auth account ──────────────────
        try {
            await adminAuth.deleteUser(userId);
        } catch (authError: any) {
            // User may not exist in Auth (e.g., manually deleted already)
            if (authError.code !== 'auth/user-not-found') {
                console.error('Failed to delete Auth account:', authError);
                return NextResponse.json(
                    { error: 'Firestore data deleted, but failed to delete Auth account. User may still be able to log in.' },
                    { status: 207, headers: securityHeaders() }
                );
            }
        }

        return NextResponse.json(
            { success: true, message: 'User fully deleted (Auth + Firestore)' },
            { status: 200, headers: securityHeaders() }
        );
    } catch (error: any) {
        console.error('Error in delete-user API:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete user' },
            { status: 500, headers: securityHeaders() }
        );
    }
}
