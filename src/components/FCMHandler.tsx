'use client';

import { useFCM } from '@/hooks/useFCM';

export const FCMHandler = () => {
    // This hook automatically requests permission and manages token generation
    // when a user logs in. It returns nothing to render.
    useFCM();
    return null;
};
