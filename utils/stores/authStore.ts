import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { Database } from '../supabase/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    loading: boolean;
    initialized: boolean;

    // Actions
    signIn: (email: string, password: string) => Promise<{ error?: string }>;
    signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
    signOut: () => Promise<void>;
    updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>;
    refreshProfile: () => Promise<void>;
    initialize: () => Promise<void>;
}

// Helper function to fetch profile with retries
const fetchProfileWithRetry = async (userId: string, maxRetries = 5): Promise<Profile | null> => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (data) {
                return data;
            }

            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
                console.error('Profile fetch error:', error);
            }

            // Wait before retrying (exponential backoff)
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        } catch (error) {
            console.error('Profile fetch attempt failed:', error);
        }
    }
    return null;
};

// Helper function to create profile manually
const createProfileManually = async (user: User, fullName: string): Promise<Profile | null> => {
    try {
        const profileData = {
            id: user.id,
            email: user.email || '',
            full_name: fullName.trim(),
            avatar_url: null,
            subscription_plan: 'free' as const,
            subscription_status: 'active' as const,
            tokens_used: 0,
            tokens_limit: 1000,
            interviews_completed: 0,
        };

        const { data, error } = await supabase
            .from('profiles')
            .insert([profileData])
            .select()
            .single();

        if (error) {
            console.error('Manual profile creation failed:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Manual profile creation error:', error);
        return null;
    }
};

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    session: null,
    profile: null,
    loading: false,
    initialized: false,

    initialize: async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('Error getting session:', error);
                set({ initialized: true });
                return;
            }

            if (session?.user) {
                const profile = await fetchProfileWithRetry(session.user.id);
                set({
                    user: session.user,
                    session,
                    profile,
                    initialized: true,
                });
            } else {
                set({ initialized: true });
            }

            // Listen for auth changes
            supabase.auth.onAuthStateChange(async (event, session) => {
                console.log('Auth state changed:', event, session?.user?.email);

                if (session?.user) {
                    let profile = null;

                    if (event === 'SIGNED_UP') {
                        // For new signups, wait longer and try to create profile if needed
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        profile = await fetchProfileWithRetry(session.user.id, 3);

                        if (!profile) {
                            // Try to create profile manually
                            const userData = session.user.user_metadata;
                            const fullName = userData?.full_name || userData?.name || '';
                            profile = await createProfileManually(session.user, fullName);
                        }
                    } else {
                        // For other events, try to fetch profile
                        profile = await fetchProfileWithRetry(session.user.id, 3);
                    }

                    set({
                        user: session.user,
                        session,
                        profile,
                    });
                } else {
                    set({
                        user: null,
                        session: null,
                        profile: null,
                    });
                }
            });
        } catch (error) {
            console.error('Error initializing auth:', error);
            set({ initialized: true });
        }
    },

    signIn: async (email: string, password: string) => {
        set({ loading: true });

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.toLowerCase().trim(),
                password,
            });

            if (error) {
                set({ loading: false });
                return { error: error.message };
            }

            set({ loading: false });
            return {};
        } catch (error) {
            set({ loading: false });
            return { error: 'An unexpected error occurred' };
        }
    },

    signUp: async (email: string, password: string, fullName: string) => {
        set({ loading: true });

        try {
            const { data, error } = await supabase.auth.signUp({
                email: email.toLowerCase().trim(),
                password,
                options: {
                    data: {
                        full_name: fullName.trim(),
                    },
                },
            });

            if (error) {
                set({ loading: false });
                return { error: error.message };
            }

            if (data.user && !data.session) {
                set({ loading: false });
                return { error: 'Please check your email to confirm your account before signing in.' };
            }

            set({ loading: false });
            return {};
        } catch (error) {
            console.error('Signup error:', error);
            set({ loading: false });
            return { error: 'An unexpected error occurred' };
        }
    },

    signOut: async () => {
        set({ loading: true });

        try {
            await supabase.auth.signOut();
            set({
                user: null,
                session: null,
                profile: null,
                loading: false,
            });
        } catch (error) {
            console.error('Error signing out:', error);
            set({ loading: false });
        }
    },

    updateProfile: async (updates: Partial<Profile>) => {
        const { user } = get();
        if (!user) return { error: 'Not authenticated' };

        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id)
                .select()
                .single();

            if (error) {
                console.error('Profile update error:', error);
                return { error: error.message };
            }

            set({ profile: data });
            return {};
        } catch (error) {
            console.error('Profile update failed:', error);
            return { error: 'Failed to update profile' };
        }
    },

    refreshProfile: async () => {
        const { user } = get();
        if (!user) return;

        try {
            const profile = await fetchProfileWithRetry(user.id);
            set({ profile });
        } catch (error) {
            console.error('Error refreshing profile:', error);
        }
    },
}));
