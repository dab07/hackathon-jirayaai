import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    interpolate,
    Extrapolate,
    runOnJS,
    useDerivedValue,
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
    hero: height,
    stats: 280,
    features: 700,
    howItWorks: 600,
    testimonials: 650,
    cta: 400,
    contact: 700,
};

// Optimized section detection configuration
const SECTION_DETECTION_CONFIG = {
    // Minimum percentage of section that needs to be visible to be considered "current"
    VISIBILITY_THRESHOLD: 0.4, // 40% of section needs to be visible
    // Offset from top to consider a section as "entered"
    ENTER_OFFSET: height * 0.3, // 30% of viewport height
    // Debounce time for scroll updates (ms)
    DEBOUNCE_TIME: 50,
    // Snap threshold for determining section boundaries
    SNAP_THRESHOLD: 50,
};

export default function HomePage() {
    const router = useRouter();
    const { user, profile, refreshProfile } = useAuthStore();
    const scrollViewRef = useRef<ScrollView>(null);
    const [currentSection, setCurrentSection] = useState(0);
    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const scrollY = useSharedValue(0);
    const lastUpdateTime = useSharedValue(0);
    const isScrolling = useSharedValue(false);

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

    // Optimized section detection function
    const detectCurrentSection = useCallback((scrollPosition: number): number => {
        const viewportHeight = height;
        const maxScrollY = totalHeight - viewportHeight;

        // Clamp scroll position to valid range
        const clampedScrollY = Math.max(0, Math.min(scrollPosition, maxScrollY));

        // Handle edge cases
        if (clampedScrollY <= SECTION_DETECTION_CONFIG.SNAP_THRESHOLD) {
            return 0; // First section
        }

        if (clampedScrollY >= maxScrollY - SECTION_DETECTION_CONFIG.SNAP_THRESHOLD) {
            return sectionPositions.length - 1; // Last section
        }

        // Calculate viewport center and bounds
        const viewportTop = clampedScrollY;
        const viewportBottom = clampedScrollY + viewportHeight;
        const viewportCenter = clampedScrollY + (viewportHeight / 2);

        let bestSection = 0;
        let maxVisibility = 0;

        // Check each section for visibility and determine the most visible one
        for (let i = 0; i < sectionPositions.length; i++) {
            const sectionStart = sectionPositions[i];
            const sectionHeight = Object.values(SECTION_HEIGHTS)[i];
            const sectionEnd = sectionStart + sectionHeight;

            // Calculate visible portion of this section
            const visibleStart = Math.max(viewportTop, sectionStart);
            const visibleEnd = Math.min(viewportBottom, sectionEnd);
            const visibleHeight = Math.max(0, visibleEnd - visibleStart);
            const visibilityRatio = visibleHeight / Math.min(sectionHeight, viewportHeight);

            // Check if section center is in viewport (gives priority to centered sections)
            const sectionCenter = sectionStart + (sectionHeight / 2);
            const centerDistance = Math.abs(viewportCenter - sectionCenter);
            const centerWeight = Math.max(0, 1 - (centerDistance / (viewportHeight / 2)));

            // Combined score: visibility + center proximity + enter offset consideration
            const enterThreshold = sectionStart + SECTION_DETECTION_CONFIG.ENTER_OFFSET;
            const hasEnteredSection = viewportTop >= enterThreshold - SECTION_DETECTION_CONFIG.SNAP_THRESHOLD;
            const enterWeight = hasEnteredSection ? 1 : 0.5;

            const combinedScore = (visibilityRatio * 0.6) + (centerWeight * 0.3) + (enterWeight * 0.1);

            // Update best section if this one has higher visibility and meets threshold
            if (combinedScore > maxVisibility && visibilityRatio >= SECTION_DETECTION_CONFIG.VISIBILITY_THRESHOLD) {
                maxVisibility = combinedScore;
                bestSection = i;
            }
        }

        // Fallback: if no section meets visibility threshold, use center-based detection
        if (maxVisibility === 0) {
            for (let i = 0; i < sectionPositions.length; i++) {
                const sectionStart = sectionPositions[i];
                const sectionHeight = Object.values(SECTION_HEIGHTS)[i];
                const sectionEnd = sectionStart + sectionHeight;

                if (viewportCenter >= sectionStart && viewportCenter < sectionEnd) {
                    bestSection = i;
                    break;
                }
            }
        }

        return bestSection;
    }, [sectionPositions, totalHeight]);

    // Debounced section update function
    const updateCurrentSection = useCallback((newSection: number) => {
        if (newSection !== currentSection && newSection >= 0 && newSection < sectionPositions.length) {
            setCurrentSection(newSection);
        }
    }, [currentSection, sectionPositions.length]);

    // Derived value for section detection with improved debouncing
    const currentSectionDerived = useDerivedValue(() => {
        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdateTime.value;

        // Only update if enough time has passed or if scrolling has stopped
        if (timeSinceLastUpdate >= SECTION_DETECTION_CONFIG.DEBOUNCE_TIME || !isScrolling.value) {
            lastUpdateTime.value = now;
            const detectedSection = detectCurrentSection(scrollY.value);
            runOnJS(updateCurrentSection)(detectedSection);
            return detectedSection;
        }

        return currentSection;
    }, [scrollY.value, isScrolling.value]);

    // Optimized scroll handler with better state management
    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            const newScrollY = event.contentOffset.y;
            const maxScrollY = totalHeight - height;

            // Clamp scroll position to valid range
            const clampedScrollY = Math.max(0, Math.min(newScrollY, maxScrollY));
            scrollY.value = clampedScrollY;
            isScrolling.value = true;
        },
        onBeginDrag: () => {
            isScrolling.value = true;
            // Reset debounce timer when user starts dragging
            lastUpdateTime.value = 0;
        },
        onEndDrag: () => {
            isScrolling.value = false;
            // Force immediate update when drag ends
            lastUpdateTime.value = 0;
            const detectedSection = detectCurrentSection(scrollY.value);
            runOnJS(updateCurrentSection)(detectedSection);
        },
        onMomentumBegin: () => {
            isScrolling.value = true;
        },
        onMomentumEnd: () => {
            isScrolling.value = false;
            // Force immediate update when momentum ends
            lastUpdateTime.value = 0;
            const detectedSection = detectCurrentSection(scrollY.value);
            runOnJS(updateCurrentSection)(detectedSection);
        },
    }, [detectCurrentSection, updateCurrentSection, totalHeight]);

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

    // Hero parallax effect with improved performance
    const heroAnimatedStyle = useAnimatedStyle(() => {
        const translateY = interpolate(
            scrollY.value,
            [0, SECTION_HEIGHTS.hero],
            [0, -SECTION_HEIGHTS.hero * 0.5],
            Extrapolate.CLAMP
        );

        const opacity = interpolate(
            scrollY.value,
            [0, SECTION_HEIGHTS.hero * 0.8, SECTION_HEIGHTS.hero],
            [1, 0.7, 0.3],
            Extrapolate.CLAMP
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
                {/* Hero Section */}
                <View style={[styles.section, { minHeight: SECTION_HEIGHTS.hero }]}>
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

            {/* Floating Navigation */}
            <Navbar
                scrollY={scrollY}
                onNavigateToSection={handleNavigateToSection}
                onStartInterview={handleStartInterview}
                currentSection={currentSection}
            />

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
