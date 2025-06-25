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
    signOut: () => Promise<{ error?: string }>;
    updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>;
    refreshProfile: () => Promise<void>;
    initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    session: null,
    profile: null,
    loading: false,
    initialized: false,

    initialize: async () => {
        try {
            // Get initial session
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('Error getting session:', error);
                set({ initialized: true });
                return;
            }

            if (session?.user) {
                // Fetch user profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

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
                    // Wait a bit for the trigger to create the profile
                    if (event === 'SIGNED_UP') {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                    // Fetch user profile with retry logic
                    let profile = null;
                    let retries = 3;

                    while (retries > 0 && !profile) {
                        const { data } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', session.user.id)
                            .single();

                        if (data) {
                            profile = data;
                        } else if (retries > 1) {
                            // Wait before retrying
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                        retries--;
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

            // Profile will be fetched automatically by the auth state change listener
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
                // Email confirmation required
                set({ loading: false });
                return { error: 'Please check your email to confirm your account before signing in.' };
            }

            // If we have a session, the profile should be created by the trigger
            // The auth state change listener will handle fetching the profile
            set({ loading: false });
            return {};
        } catch (error) {
            set({ loading: false });
            return { error: 'An unexpected error occurred' };
        }
    },

    signOut: async () => {
        set({ loading: true });

        try {
            console.log('Attempting to sign out...');

            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error('Sign out error:', error);
                set({ loading: false });
                return { error: error.message };
            }

            console.log('Sign out successful, clearing state...');

            // Clear state immediately
            set({
                user: null,
                session: null,
                profile: null,
                loading: false,
            });

            return {};
        } catch (error) {
            console.error('Unexpected sign out error:', error);
            set({ loading: false });
            return { error: 'Failed to sign out. Please try again.' };
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
                return { error: error.message };
            }

            set({ profile: data });
            return {};
        } catch (error) {
            return { error: 'Failed to update profile' };
        }
    },

    refreshProfile: async () => {
        const { user } = get();
        if (!user) return;

        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            set({ profile });
        } catch (error) {
            console.error('Error refreshing profile:', error);
        }
    },
}));
