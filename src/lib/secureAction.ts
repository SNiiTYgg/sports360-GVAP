/**
 * secureAction — Firebase JWT → Supabase Edge Function utilities
 *
 * Provides helpers to:
 * 1. Get the current Firebase user's ID token (JWT)
 * 2. Call the `secure-action` Edge Function with the token
 *
 * Usage:
 *   import { callSecureAction } from '@/lib/secureAction';
 *   const result = await callSecureAction();
 */

import { auth } from '@/lib/firebase';

/**
 * Get the current Firebase user's ID token (JWT).
 * Returns null if no user is signed in or Firebase is not configured.
 *
 * @param forceRefresh - If true, forces a token refresh from Firebase servers.
 *                       Default false (uses cached token if not expired).
 */
export async function getFirebaseToken(forceRefresh = false): Promise<string | null> {
    if (!auth) {
        console.error('Firebase auth is not configured');
        return null;
    }

    const user = auth.currentUser;
    if (!user) {
        console.error('No Firebase user signed in');
        return null;
    }

    try {
        return await user.getIdToken(forceRefresh);
    } catch (error) {
        console.error('Failed to get Firebase ID token:', error);
        return null;
    }
}

/**
 * Call the `secure-action` Supabase Edge Function with the current
 * Firebase user's verified ID token.
 *
 * @returns The parsed JSON response from the Edge Function
 * @throws Error if the user is not signed in or the request fails
 */
export async function callSecureAction(): Promise<{ success: boolean; uid?: string; error?: string }> {
    const token = await getFirebaseToken();
    if (!token) {
        throw new Error('Not authenticated — sign in first');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
        throw new Error('VITE_SUPABASE_URL is not configured');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/secure-action`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || `Edge Function returned ${response.status}`);
    }

    return data;
}
