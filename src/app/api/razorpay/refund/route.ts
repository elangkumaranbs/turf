import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { paymentId, amount, bookingId } = body;

        // ─── Input Validation ──────────────────────────────────────
        if (!paymentId) {
            return NextResponse.json(
                { error: 'Missing paymentId' },
                { status: 400, headers: securityHeaders() }
            );
        }

        if (!bookingId) {
            return NextResponse.json(
                { error: 'Missing bookingId' },
                { status: 400, headers: securityHeaders() }
            );
        }

        // ─── Process Refund via Razorpay ───────────────────────────
        const refundOptions: any = {};

        // If amount is provided, do a partial refund; otherwise full refund
        if (amount && typeof amount === 'number' && amount > 0) {
            refundOptions.amount = Math.round(amount * 100); // Convert to paise
        }

        const refund = await razorpay.payments.refund(paymentId, refundOptions);

        return NextResponse.json(
            {
                refundId: refund.id,
                status: refund.status,
                amount: refund.amount,
            },
            { status: 200, headers: securityHeaders() }
        );
    } catch (error: any) {
        console.error('Error processing refund:', error);

        // Handle specific Razorpay errors
        if (error.statusCode === 400) {
            return NextResponse.json(
                { error: 'Refund request failed. Payment may already be refunded.' },
                { status: 400, headers: securityHeaders() }
            );
        }

        return NextResponse.json(
            { error: 'Failed to process refund' },
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
