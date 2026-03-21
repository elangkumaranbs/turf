import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// ─── Rate Limiting (in-memory, per-process) ────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(userId);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }
    if (entry.count >= RATE_LIMIT_MAX) {
        return false;
    }
    entry.count++;
    return true;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { amount, currency, turfId, turfName, slots, date, userId } = body;

        // ─── Input Validation ──────────────────────────────────────
        if (!amount || !turfId || !slots || !date || !userId) {
            return NextResponse.json(
                { error: 'Missing required fields: amount, turfId, slots, date, userId' },
                { status: 400, headers: securityHeaders() }
            );
        }

        if (typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json(
                { error: 'Invalid amount' },
                { status: 400, headers: securityHeaders() }
            );
        }

        if (!Array.isArray(slots) || slots.length === 0) {
            return NextResponse.json(
                { error: 'Slots must be a non-empty array' },
                { status: 400, headers: securityHeaders() }
            );
        }

        // ─── Rate Limiting ─────────────────────────────────────────
        if (!checkRateLimit(userId)) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429, headers: securityHeaders() }
            );
        }

        // ─── Create Razorpay Order ─────────────────────────────────
        const amountInPaise = Math.round(amount * 100); // Convert rupees to paise

        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: currency || 'INR',
            notes: {
                turfId,
                turfName: sanitize(turfName || ''),
                date,
                userId,
                slots: JSON.stringify(slots),
            },
        });

        return NextResponse.json(
            {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
            },
            { status: 200, headers: securityHeaders() }
        );
    } catch (error: any) {
        console.error('Error creating Razorpay order:', error);
        return NextResponse.json(
            { error: 'Failed to create order' },
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

// ─── Input Sanitization ────────────────────────────────────────────
function sanitize(str: string): string {
    return str.replace(/[<>\"'&]/g, '').substring(0, 200);
}
