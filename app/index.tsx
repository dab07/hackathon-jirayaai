import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    scrollTo,
    useAnimatedRef,
    runOnJS
} from 'react-native-reanimated';

// Components
import InfoSection from '../components/InfoSection';
import StatsSection from '../components/StatsSection';
import FeaturesSection from '../components/FeaturesSection';
import HowItWorksSection from '../components/HowItWorksSection';
import TestimonialsSection from '../components/FeedbackSection';
import CTASection from '../components/CTASection';
import ContactSection from '../components/ContactSection';
import InterviewModal from '../components/InterviewModal';
import AuthModal from '../components/AuthModal';
import Navbar from '../components/Navbar';
import { useAuthStore } from '@/utils/stores/authStore';
import { supabase } from '@/utils/supabase/client';

const AnimatedScrollView = Animated.createAnimatedComponent(Animated.ScrollView);
const { height } = Dimensions.get('window');

// Define types for better TypeScript support
interface SectionConfig {
    name: string;
    height: number;
}

interface SectionPosition {
    index: number;
    name: string;
    start: number;
    end: number;
    height: number;
}

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

const SECTIONS: Record<string, SectionConfig> = {
    hero: { name: 'hero', height: height },
    stats: { name: 'stats', height: 250 },
    features: { name: 'features', height: 650 },
    howItWorks: { name: 'howItWorks', height: 550 },
    testimonials: { name: 'testimonials', height: 550 },
    cta: { name: 'cta', height: 350 },
    contact: { name: 'contact', height: 650 },
};

// Calculate cumulative heights for accurate navigation
const calculateSectionPositions = (): SectionPosition[] => {
    const sections = Object.values(SECTIONS);
    const positions: SectionPosition[] = [];
    let cumulativeHeight = 0;

    sections.forEach((section, index) => {
        positions.push({
            index,
            name: section.name,
            start: cumulativeHeight,
            end: cumulativeHeight + section.height,
            height: section.height,
        });
        cumulativeHeight += section.height;
    });

    return positions;
};

export default function HomePage() {
    const router = useRouter();
    const { user, profile, initialized } = useAuthStore();
    const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [currentSection, setCurrentSection] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sectionPositions, setSectionPositions] = useState(calculateSectionPositions());
    const scrollY = useSharedValue(0);

    // Redirect authenticated users to main app
    useEffect(() => {
        if (initialized && user) {
            console.log('Landing page - User is authenticated, redirecting to main app');
            router.replace('/(tabs)');
        }
    }, [initialized, user, router]);

    const updateCurrentSection = (scrollPosition: number) => {
        // Add offset for better section detection (when section is 1/3 visible)
        const offset = 100;
        const adjustedPosition = scrollPosition + offset;

        for (let i = 0; i < sectionPositions.length; i++) {
            const section = sectionPositions[i];

            // Check if scroll position is within this section
            if (adjustedPosition >= section.start && adjustedPosition < section.end) {
                if (currentSection !== i) {
                    setCurrentSection(i);
                }
                return;
            }
        }

        // Handle edge case: if we're past all sections, set to last section
        const lastSectionIndex = sectionPositions.length - 1;
        if (adjustedPosition >= sectionPositions[lastSectionIndex].end) {
            if (currentSection !== lastSectionIndex) {
                setCurrentSection(lastSectionIndex);
            }
        }
    };

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;

            // Use runOnJS to update current section on JS thread
            runOnJS(updateCurrentSection)(event.contentOffset.y);
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
        if (sectionIndex < 0 || sectionIndex >= sectionPositions.length) {
            console.warn('Invalid section index:', sectionIndex);
            return;
        }

        const targetPosition = sectionPositions[sectionIndex];
        const targetY = targetPosition.start;

        console.log(`Navigating to section ${sectionIndex} (${targetPosition.name}) at position ${targetY}`);

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
