import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    interpolate,
} from 'react-native-reanimated';

// Components
import InfoSection from '../../components/InfoSection';
import StatsSection from '../../components/StatsSection';
import FeaturesSection from '../../components/FeaturesSection';
import HowItWorksSection from '../../components/HowItWorksSection';
import TestimonialsSection from '../../components/TestimonialsSection';
import CTASection from '../../components/CTASection';
import ContactSection from '../../components/ContactSection';
import Navbar from '../../components/Navbar';
import InterviewModal from '../../components/InterviewModal';
import { useAuthStore } from '../../utils/stores/authStore';
import { supabase } from '../../utils/supabase/client';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
const { height } = Dimensions.get('window');

// Section heights for navigation - more accurate measurements
const SECTION_HEIGHTS = {
    info: height,
    stats: 280,
    features: 700,
    howItWorks: 600,
    testimonials: 650,
    cta: 400,
    contact: 700,
};


export default function HomePage() {
    const router = useRouter();
    const { user, profile, refreshProfile } = useAuthStore();
    const scrollViewRef = useRef<ScrollView>(null);
    const [currentSection, setCurrentSection] = useState(0);
    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const scrollY = useSharedValue(0);

    // Calculate cumulative section positions with proper boundaries
    const sectionPositions = React.useMemo(() => {
        const sections = Object.values(SECTION_HEIGHTS);
        const positions = [0]; // Start with 0 for first section

        for (let i = 1; i < sections.length; i++) {
            positions[i] = positions[i - 1] + sections[i - 1];
        }

        return positions;
    }, []);

    // Total content height
    const totalHeight = React.useMemo(() => {
        return Object.values(SECTION_HEIGHTS).reduce((sum, height) => sum + height, 0);
    }, []);


    // Optimized scroll handler with better state management
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

    // Navigation handler with smooth scrolling and proper positioning
    const handleNavigateToSection = useCallback((sectionIndex: number) => {
        if (sectionIndex < 0 || sectionIndex >= sectionPositions.length) {
            console.warn('Invalid section index:', sectionIndex);
            return;
        }

        const targetY = sectionPositions[sectionIndex];
        const maxScrollY = totalHeight - height;
        const clampedTargetY = Math.max(0, Math.min(targetY, maxScrollY));

        if (scrollViewRef.current) {
            // Update current section immediately for better UX
            setCurrentSection(sectionIndex);

            // Smooth scroll to target position
            scrollViewRef.current.scrollTo({
                y: clampedTargetY,
                animated: true
            });
        }
    }, [sectionPositions, totalHeight]);

    const handleStartInterview = () => {
        console.log('Starting interview from main app');

        // Check if user is authenticated
        if (!user) {
            console.log('User not authenticated, redirecting to interview tab for auth');
            router.push('/(tabs)/interview');
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

        // Show interview setup modal
        setShowInterviewModal(true);
    };

    const handleInterviewSubmit = async (data: any) => {
        if (!user) {
            Alert.alert('Authentication Required', 'Please sign in to continue.');
            return;
        }

        // Check token availability again
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

            // Create job detail record in database with resume data
            const jobDetailData = {
                user_id: user.id,
                job_title: data.jobTitle,
                job_description: data.jobDescription,
                skills: data.skills,
                years_experience: data.yearsExperience,
                resume_text: data.resumeText || null,
                resume_filename: data.resumeFilename || null,
            };

            const { data: jobDetail, error: jobError } = await supabase
                .from('job_details')
                .insert(jobDetailData)
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

    // Hero parallax effect with improved performance
    const heroAnimatedStyle = useAnimatedStyle(() => {
        const translateY = interpolate(
            scrollY.value,
            [0, SECTION_HEIGHTS.info],
            [0, -SECTION_HEIGHTS.info * 0.5],
        );

        const opacity = interpolate(
            scrollY.value,
            [0, SECTION_HEIGHTS.info * 0.8, SECTION_HEIGHTS.info],
            [1, 0.7, 0.3],
        );

        return {
            transform: [{ translateY }],
            opacity,
        };
    }, []);

    return (
        <View style={styles.container}>
            <AnimatedScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                bounces={true}
                bouncesZoom={false}
                decelerationRate="normal"
                contentContainerStyle={styles.contentContainer}
                // Optimize scroll performance
                removeClippedSubviews={true}
                maxToRenderPerBatch={2}
                windowSize={3}
            >
                {/* Floating Navigation */}
                <Navbar
                    scrollY={scrollY}
                    onNavigateToSection={handleNavigateToSection}
                    onStartInterview={handleStartInterview}
                    currentSection={currentSection}
                />

                {/* Hero Section */}
                <View style={[styles.section, { minHeight: SECTION_HEIGHTS.info }]}>
                    <InfoSection
                        heroAnimatedStyle={heroAnimatedStyle}
                        onStartInterview={handleStartInterview}
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
    contentContainer: {
        flexGrow: 1,
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
