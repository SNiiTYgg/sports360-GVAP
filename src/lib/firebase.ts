/**
 * Firebase Configuration - campus360
 * 
 * Initializes Firebase for authentication only.
 * Used for poll voting with Google Sign-In.
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, Auth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Check if Firebase is configured
const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

if (!isConfigured) {
    console.warn('Firebase is not configured. Please add VITE_FIREBASE_* env variables.');
}

// Initialize Firebase only if configured
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (isConfigured) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);

        // Set persistence to LOCAL - user stays logged in until cache is cleared
        setPersistence(auth, browserLocalPersistence).catch((error) => {
            console.warn('Failed to set Firebase persistence:', error);
        });
    } catch (error) {
        console.error('Failed to initialize Firebase:', error);
    }
}

export { auth };
export default app;
