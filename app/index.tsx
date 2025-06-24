import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    scrollTo,
    useAnimatedRef,
} from 'react-native-reanimated';

// Components
import InfoSection from '../components/InfoSection';
import StatsSection from '../components/StatsSection';
import FeaturesSection from '../components/FeaturesSection';
import HowItWorksSection from '../components/HowItWorksSection';
import TestimonialsSection from '../components/TestimonialsSection';
import CTASection from '../components/CTASection';
import ContactSection from '../components/ContactSection';
import InterviewModal from '../components/InterviewModal';
import AuthModal from '../components/AuthModal';
import Navbar from '../components/Navbar';
import { useAuthStore } from '../utils/stores/authStore';
import { supabase } from '../utils/supabase/client';

const AnimatedScrollView = Animated.createAnimatedComponent(Animated.ScrollView);
const { height } = Dimensions.get('window');

// Section heights for navigation
const SECTION_HEIGHTS = {
    hero: height,
    stats: 200,
    features: 600,
    howItWorks: 500,
    testimonials: 500,
    cta: 300,
    contact: 600,
};

export default function HomePage() {
    const router = useRouter();
    const { user, profile, initialized } = useAuthStore();
    const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [currentSection, setCurrentSection] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const scrollY = useSharedValue(0);

    // Redirect authenticated users to main app
    useEffect(() => {
        if (initialized && user) {
            console.log('Landing page - User is authenticated, redirecting to main app');
            router.replace('/(tabs)');
        }
    }, [initialized, user, router]);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;

            // Determine current section based on scroll position
            const scrollPosition = event.contentOffset.y;
            let section = 0;
            let cumulativeHeight = 0;

            const sections = Object.values(SECTION_HEIGHTS);
            for (let i = 0; i < sections.length; i++) {
                cumulativeHeight += sections[i];
                if (scrollPosition < cumulativeHeight - 100) {
                    section = i;
                    break;
                }
            }

            // Update current section on main thread
            setCurrentSection(section);
        },
    });

    const handleInterviewSubmit = async (data: any) => {
        if (!user) {
            setShowAuthModal(true);
            return;
        }

        // Check if user has enough tokens
        if (profile && profile.tokens_used >= profile.tokens_limit) {
            Alert.alert(
                'Token Limit Reached',
                'You have reached your token limit. Please upgrade your plan to continue practicing interviews.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'View Plans', onPress: () => router.push('/(tabs)/pricing') },
                ]
            );
            return;
        }

        setIsSubmitting(true);
        setShowInterviewModal(false);

        try {
            console.log('Creating job details for interview:', data);

            // Create job detail record in database
            const { data: jobDetail, error: jobError } = await supabase
                .from('job_details')
                .insert({
                    user_id: user.id,
                    job_title: data.jobTitle,
                    job_description: data.jobDescription,
                    skills: data.skills,
                    years_experience: data.yearsExperience,
                })
                .select()
                .single();

            if (jobError) {
                console.error('Error creating job details:', jobError);
                throw new Error('Failed to save job details. Please try again.');
            }

            console.log('Job details created successfully:', jobDetail.id);

            // Navigate to interview session with job detail ID
            router.push({
                pathname: '/interview-session',
                params: {
                    jobDetailId: jobDetail.id,
                }
            });

        } catch (error) {
            console.error('Error submitting interview:', error);
            Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to start interview. Please try again.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStartInterview = () => {
        if (!user) {
            setShowAuthModal(true);
            return;
        }

        // Check token availability
        if (profile && profile.tokens_used >= profile.tokens_limit) {
            Alert.alert(
                'Token Limit Reached',
                'You have reached your token limit. Please upgrade your plan to continue practicing interviews.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'View Plans', onPress: () => router.push('/(tabs)/pricing') },
                ]
            );
            return;
        }

        setShowInterviewModal(true);
    };

    const handleNavigateToSection = (sectionIndex: number) => {
        let targetY = 0;
        const sections = Object.values(SECTION_HEIGHTS);

        for (let i = 0; i < sectionIndex; i++) {
            targetY += sections[i];
        }

        if (scrollViewRef.current) {
            scrollTo(scrollViewRef, 0, targetY, true);
        }
    };

    const handleAuthSuccess = () => {
        setShowAuthModal(false);
        // After successful auth, user will be redirected by AuthGuard
    };

    // Don't render the landing page if user is authenticated
    // AuthGuard will handle the redirect
    if (initialized && user) {
        return null;
    }

    // Show loading state while checking authentication
    if (!initialized) {
        return null;
    }

    return (
        <View style={styles.container}>
            {/* Floating Navigation */}
            <Navbar
                scrollY={scrollY}
                onNavigateToSection={handleNavigateToSection}
                onStartInterview={handleStartInterview}
                currentSection={currentSection}
            />

            <AnimatedScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section */}
                <View style={[styles.section, { minHeight: SECTION_HEIGHTS.hero }]}>
                    <InfoSection
                        onStartInterview={handleStartInterview}
                        heroAnimatedStyle={{}}
                    />
                </View>

                {/* Stats Section */}
                <View style={[styles.section, { minHeight: SECTION_HEIGHTS.stats }]}>
                    <StatsSection />
                </View>

                {/* Features Section */}
                <View style={[styles.section, { minHeight: SECTION_HEIGHTS.features }]}>
                    <FeaturesSection />
                </View>

                {/* How It Works Section */}
                <View style={[styles.section, { minHeight: SECTION_HEIGHTS.howItWorks }]}>
                    <HowItWorksSection />
                </View>

                {/* Testimonials Section */}
                <View style={[styles.section, { minHeight: SECTION_HEIGHTS.testimonials }]}>
                    <TestimonialsSection />
                </View>

                {/* CTA Section */}
                <View style={[styles.section, { minHeight: SECTION_HEIGHTS.cta }]}>
                    <CTASection onStartInterview={handleStartInterview} />
                </View>

                {/* Contact Section */}
                <View style={[styles.section, { minHeight: SECTION_HEIGHTS.contact }]}>
                    <ContactSection />
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2024 Jiraya. All rights reserved.</Text>
                </View>
            </AnimatedScrollView>

            {/* Interview Modal */}
            <InterviewModal
                isVisible={showInterviewModal}
                onClose={() => setShowInterviewModal(false)}
                onSubmit={handleInterviewSubmit}
                loading={isSubmitting}
            />

            {/* Auth Modal */}
            <AuthModal
                isVisible={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onSuccess={handleAuthSuccess}
                initialMode="signup"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    scrollView: {
        flex: 1,
    },
    section: {
        // Individual section styling handled by components
    },
    footer: {
        paddingVertical: 40,
        paddingHorizontal: 24,
        alignItems: 'center',
        backgroundColor: '#111111',
    },
    footerText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
});
