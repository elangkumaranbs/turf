// ─── EmailJS Booking Notification Utility ──────────────────────────
// Sends booking confirmation emails to turf owner and customer
// Uses EmailJS client-side SDK (fire-and-forget, won't block bookings)

import emailjs from '@emailjs/browser';

// ─── Config ────────────────────────────────────────────────────────
const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '';
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '';
const OWNER_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_OWNER_TEMPLATE_ID || '';
const CUSTOMER_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_CUSTOMER_TEMPLATE_ID || '';

// Initialize EmailJS once
let initialized = false;
const initEmailJS = () => {
    if (!initialized && PUBLIC_KEY) {
        emailjs.init(PUBLIC_KEY);
        initialized = true;
    }
};

// ─── Booking Email Parameters ──────────────────────────────────────
export interface BookingEmailParams {
    // Turf details
    turfName: string;
    turfLocation: string;
    // Booking details
    bookingDate: string;      // formatted date string
    bookingSlots: string;     // comma-separated slots e.g. "07:00 AM, 08:00 AM"
    amountPaid: number;       // in rupees
    // Customer details
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    // Owner details
    ownerName: string;
    ownerEmail: string;
}

// ─── Send Booking Emails ───────────────────────────────────────────
// Sends both owner notification and customer confirmation emails
// This is fire-and-forget — errors are logged but don't throw
export const sendBookingEmails = async (params: BookingEmailParams): Promise<void> => {
    initEmailJS();

    if (!SERVICE_ID || !PUBLIC_KEY) {
        console.warn('⚠️ EmailJS not configured — skipping booking emails');
        return;
    }

    const {
        turfName,
        turfLocation,
        bookingDate,
        bookingSlots,
        amountPaid,
        customerName,
        customerEmail,
        customerPhone,
        ownerName,
        ownerEmail,
    } = params;

    // ─── Email to Turf Owner ───────────────────────────────────────
    if (OWNER_TEMPLATE_ID && ownerEmail) {
        try {
            await emailjs.send(SERVICE_ID, OWNER_TEMPLATE_ID, {
                to_email: ownerEmail,
                to_name: ownerName,
                turf_name: turfName,
                turf_location: turfLocation,
                booking_date: bookingDate,
                booking_slots: bookingSlots,
                amount_paid: `₹${amountPaid.toLocaleString('en-IN')}`,
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone || 'Not provided',
            });
            console.log('✅ Owner booking notification email sent to:', ownerEmail);
        } catch (error) {
            console.error('❌ Failed to send owner notification email:', error);
        }
    }

    // ─── Email to Customer ─────────────────────────────────────────
    if (CUSTOMER_TEMPLATE_ID && customerEmail) {
        try {
            await emailjs.send(SERVICE_ID, CUSTOMER_TEMPLATE_ID, {
                to_email: customerEmail,
                to_name: customerName,
                turf_name: turfName,
                turf_location: turfLocation,
                booking_date: bookingDate,
                booking_slots: bookingSlots,
                amount_paid: `₹${amountPaid.toLocaleString('en-IN')}`,
            });
            console.log('✅ Customer booking confirmation email sent to:', customerEmail);
        } catch (error) {
            console.error('❌ Failed to send customer confirmation email:', error);
        }
    }
};
