import React, { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/utils/stores/authStore';

interface AuthGuardProps {
    children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
    const { initialize, initialized, user } = useAuthStore();
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        if (!initialized) {
            initialize();
        }
    }, [initialize, initialized]);

    useEffect(() => {
        if (!initialized) return;

        const inAuthGroup = segments[0] === '(tabs)';
        const isOnLandingPage = segments[0] === 'index' || segments.length == 0;

        // console.log('Auth Guard - User:', user?.email || 'Not signed in');
        // console.log('Auth Guard - Current segments:', segments);
        // console.log('Auth Guard - In auth group:', inAuthGroup);
        // console.log('Auth Guard - On landing page:', isOnLandingPage);

        if (user) {
            // User is signed in
            if (isOnLandingPage) {
                // Redirect signed-in users from landing page to main app
                console.log('Auth Guard - Redirecting signed-in user to main app');
                router.replace('/(tabs)');
            }
        } else {
            // User is not signed in
            if (inAuthGroup) {
                // Redirect unsigned users from protected routes to landing page
                console.log('Auth Guard - Redirecting unsigned user to landing page');
                router.replace('/');
            }
        }
    }, [user, initialized, segments, router]);

    if (!initialized) {
        return null; // Keep splash screen visible while initializing
    }

    return <>{children}</>;
}
