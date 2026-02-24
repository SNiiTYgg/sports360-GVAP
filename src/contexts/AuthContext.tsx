/**
 * AuthContext - campus360
 * 
 * Firebase authentication context for poll voting & secure actions.
 * Provides:
 * - Current user state
 * - Google Sign-In method
 * - Get ID Token (JWT) for Edge Function auth
 * - Auth loading state
 * 
 * No sign-out provided - users stay logged in until cache clear.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<User | null>;
    getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Auth Provider component - wrap app with this
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Listen to auth state changes
    useEffect(() => {
        // If Firebase isn't configured, just set loading to false
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Google Sign-In
    const signInWithGoogle = async (): Promise<User | null> => {
        if (!auth) {
            console.error('Firebase auth is not configured');
            return null;
        }

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            return result.user;
        } catch (error) {
            console.error('Google sign-in error:', error);
            return null;
        }
    };

    // Get Firebase ID Token (JWT) for Edge Function auth
    const getIdToken = async (forceRefresh = false): Promise<string | null> => {
        if (!auth || !user) {
            return null;
        }
        try {
            return await user.getIdToken(forceRefresh);
        } catch (error) {
            console.error('Failed to get ID token:', error);
            return null;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, getIdToken }}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Hook to access auth context
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
