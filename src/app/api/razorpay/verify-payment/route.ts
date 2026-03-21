import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingData,
        } = body;

        // ─── Input Validation ──────────────────────────────────────
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json(
                { error: 'Missing payment verification fields' },
                { status: 400, headers: securityHeaders() }
            );
        }

        if (!bookingData || !bookingData.userId || !bookingData.turfId || !bookingData.date || !bookingData.times) {
            return NextResponse.json(
                { error: 'Missing booking data' },
                { status: 400, headers: securityHeaders() }
            );
        }

        // ─── HMAC SHA256 Signature Verification ────────────────────
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) {
            console.error('RAZORPAY_KEY_SECRET is not set');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500, headers: securityHeaders() }
            );
        }

        const generatedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            console.error('Payment signature verification FAILED', {
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
            });
            return NextResponse.json(
                { error: 'Payment verification failed. Invalid signature.' },
                { status: 400, headers: securityHeaders() }
            );
        }

        // ─── Signature Valid — Return success ──────────────────────
        // The actual booking creation happens on the client side after
        // receiving this verification success, using the Firestore client SDK.
        // This ensures Firestore security rules are properly applied.

        return NextResponse.json(
            {
                verified: true,
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
            },
            { status: 200, headers: securityHeaders() }
        );
    } catch (error: any) {
        console.error('Error verifying payment:', error);
        return NextResponse.json(
            { error: 'Payment verification failed' },
            { status: 500, headers: securityHeaders() }
        );
    }
}

// ─── Security Headers ──────────────────────────────────────────────
function securityHeaders(): Record<string, string> {
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
    };
}
