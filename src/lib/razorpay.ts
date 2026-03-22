// ─── Razorpay Client SDK Utilities ─────────────────────────────────
// Handles script loading and payment checkout initiation

declare global {
    interface Window {
        Razorpay: any;
    }
}

// ─── Load Razorpay Checkout Script ─────────────────────────────────
let scriptLoaded = false;
let scriptLoading: Promise<void> | null = null;

export const loadRazorpayScript = (): Promise<void> => {
    if (scriptLoaded) return Promise.resolve();
    if (scriptLoading) return scriptLoading;

    scriptLoading = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
            scriptLoaded = true;
            resolve();
        };
        script.onerror = () => {
            scriptLoading = null;
            reject(new Error('Failed to load Razorpay SDK'));
        };
        document.body.appendChild(script);
    });

    return scriptLoading;
};

// ─── Payment Options ───────────────────────────────────────────────
export interface PaymentOptions {
    orderId: string;
    amount: number; // in paise
    currency: string;
    turfName: string;
    userName: string;
    userEmail: string;
    userPhone?: string;
    onSuccess: (response: RazorpaySuccessResponse) => void;
    onFailure: (error: any) => void;
    onDismiss?: () => void;
}

export interface RazorpaySuccessResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

// ─── Initiate Payment ──────────────────────────────────────────────
export const initiatePayment = async (options: PaymentOptions): Promise<void> => {
    await loadRazorpayScript();

    const {
        orderId,
        amount,
        currency,
        turfName,
        userName,
        userEmail,
        userPhone,
        onSuccess,
        onFailure,
        onDismiss,
    } = options;

    const razorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency || 'INR',
        name: 'Game Den',
        description: `Booking at ${turfName}`,
        order_id: orderId,
        handler: function (response: RazorpaySuccessResponse) {
            onSuccess(response);
        },
        prefill: {
            name: userName || '',
            email: userEmail || '',
            contact: userPhone || '',
        },
        theme: {
            color: '#2ecc71',
            backdrop_color: 'rgba(0, 0, 0, 0.85)',
        },
        modal: {
            ondismiss: function () {
                if (onDismiss) onDismiss();
            },
            confirm_close: true,
            escape: true,
            animation: true,
        },
        // ─── All Payment Methods Enabled ───────────────────────────
        config: {
            display: {
                blocks: {
                    utib: {
                        name: 'Pay using',
                        instruments: [
                            { method: 'upi', flows: ['intent'] },
                            { method: 'card' },
                            { method: 'netbanking' },
                            { method: 'wallet' },
                            { method: 'emi' },
                            { method: 'paylater' },
                        ],
                    },
                },
                sequence: ['block.utib'],
                preferences: {
                    show_default_blocks: true,
                },
            },
        },
        webview_intent: true,
        // Retry on failure
        retry: {
            enabled: true,
            max_count: 3,
        },
    };

    try {
        const razorpay = new window.Razorpay(razorpayOptions);
        razorpay.on('payment.failed', function (response: any) {
            onFailure(response.error);
        });
        razorpay.open();
    } catch (error) {
        onFailure(error);
    }
};

// ─── Create Order via API ──────────────────────────────────────────
export const createRazorpayOrder = async (data: {
    amount: number; // in rupees
    turfId: string;
    turfName: string;
    slots: string[];
    date: string;
    userId: string;
}): Promise<{ orderId: string; amount: number; currency: string }> => {
    const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            amount: data.amount,
            currency: 'INR',
            turfId: data.turfId,
            turfName: data.turfName,
            slots: data.slots,
            date: data.date,
            userId: data.userId,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
    }

    return response.json();
};

// ─── Verify Payment via API ────────────────────────────────────────
export const verifyPayment = async (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    bookingData: any;
}): Promise<{ verified: boolean; paymentId: string; orderId: string; contactPhone?: string }> => {
    const response = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment verification failed');
    }

    return response.json();
};

// ─── Request Refund via API ────────────────────────────────────────
export const requestRefund = async (data: {
    paymentId: string;
    bookingId: string;
    amount?: number; // optional, in rupees — omit for full refund
}): Promise<{ refundId: string; status: string; amount: number }> => {
    const response = await fetch('/api/razorpay/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Refund request failed');
    }

    return response.json();
};
