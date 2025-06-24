import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Brain, Play, Settings, BarChart3, Lock } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/utils/stores/authStore';
import InterviewModal from '../../components/InterviewModal';
import AuthModal from '../../components/AuthModal';

export default function InterviewTab() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user, profile } = useAuthStore();
    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);

    // Check if we should auto-start interview from navigation
    useEffect(() => {
        if (params.startInterview === 'true' && params.jobTitle && user) {
            // Auto-navigate to interview session if we have job data and user is authenticated
            router.replace({
                pathname: '/interview-session',
                params: {
                    jobTitle: params.jobTitle,
                    jobDescription: params.jobDescription,
                    skills: params.skills,
                    yearsExperience: params.yearsExperience,
                }
            });
        }
    }, [params, user]);

    const handleStartInterview = () => {
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

        setShowInterviewModal(true);
    };

    const handleInterviewSubmit = (data: any) => {
        console.log('Interview data:', data);
        setShowInterviewModal(false);

        // Navigate to the actual interview screen
        router.push({
            pathname: '/interview',
            params: {
                jobTitle: data.jobTitle,
                jobDescription: data.jobDescription,
                skills: JSON.stringify(data.skills),
                yearsExperience: data.yearsExperience.toString(),
            }
        });
    };

    const getTokensRemaining = () => {
        if (!profile) return 0;
        return Math.max(0, profile.tokens_limit - profile.tokens_used);
    };

    const getEstimatedInterviews = () => {
        const tokensRemaining = getTokensRemaining();
        // Estimate ~300-500 tokens per interview
        return Math.floor(tokensRemaining / 400);
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0a0a0a', '#1a1a2e', '#16213e']}
                style={styles.gradient}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Brain size={32} color="#00d4ff" />
                    <Text style={styles.title}>AI Interview</Text>
                    <Text style={styles.subtitle}>
                        Practice with AI-powered interviews tailored to your dream job
                    </Text>
                </View>

                {/* User Status */}
                {user && profile && (
                    <View style={styles.userStatusContainer}>
                        <View style={styles.statusCard}>
                            <Text style={styles.statusTitle}>Your Account</Text>
                            <View style={styles.statusRow}>
                                <Text style={styles.statusLabel}>Plan:</Text>
                                <Text style={styles.statusValue}>
                                    {(profile.subscription_plan || 'free').toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.statusRow}>
                                <Text style={styles.statusLabel}>Tokens Remaining:</Text>
                                <Text style={[
                                    styles.statusValue,
                                    { color: getTokensRemaining() < 100 ? '#EF4444' : '#10B981' }
                                ]}>
                                    {getTokensRemaining().toLocaleString()}
                                </Text>
                            </View>
                            <View style={styles.statusRow}>
                                <Text style={styles.statusLabel}>Estimated Interviews:</Text>
                                <Text style={styles.statusValue}>
                                    ~{getEstimatedInterviews()}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Quick Actions */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={styles.primaryAction}
                        onPress={handleStartInterview}
                    >
                        <LinearGradient
                            colors={user ? ['#00d4ff', '#0099cc'] : ['#6B7280', '#4B5563']}
                            style={styles.actionGradient}
                        >
                            {!user && <Lock size={24} color="white" />}
                            {user && <Play size={24} color="white" />}
                            <Text style={styles.actionText}>
                                {user ? 'Start New Interview' : 'Sign In to Start'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.secondaryActions}>
                        <TouchableOpacity
                            style={[styles.secondaryAction, !user && styles.disabledAction]}
                            disabled={!user}
                        >
                            <Settings size={20} color={user ? "#00d4ff" : "#6B7280"} />
                            <Text style={[styles.secondaryActionText, !user && styles.disabledText]}>
                                Interview Settings
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.secondaryAction, !user && styles.disabledAction]}
                            disabled={!user}
                        >
                            <BarChart3 size={20} color={user ? "#00d4ff" : "#6B7280"} />
                            <Text style={[styles.secondaryActionText, !user && styles.disabledText]}>
                                View Results
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recent Interviews or Sign Up Prompt */}
                <View style={styles.recentSection}>
                    {user ? (
                        <>
                            <Text style={styles.sectionTitle}>Recent Interviews</Text>
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No interviews yet</Text>
                                <Text style={styles.emptySubtext}>
                                    Start your first AI interview to see results here
                                </Text>
                            </View>
                        </>
                    ) : (
                        <View style={styles.signUpPrompt}>
                            <Text style={styles.promptTitle}>Ready to Get Started?</Text>
                            <Text style={styles.promptSubtitle}>
                                Create a free account to start practicing interviews and track your progress.
                            </Text>
                            <View style={styles.promptFeatures}>
                                <Text style={styles.promptFeature}>✨ 1,000 free AI tokens</Text>
                                <Text style={styles.promptFeature}>🎯 2-3 complete interview sessions</Text>
                                <Text style={styles.promptFeature}>📊 Detailed performance feedback</Text>
                                <Text style={styles.promptFeature}>🚀 Progress tracking</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowAuthModal(true)}
                                style={styles.signUpButton}
                            >
                                <LinearGradient
                                    colors={['#10B981', '#059669']}
                                    style={styles.signUpButtonGradient}
                                >
                                    <Text style={styles.signUpButtonText}>Create Free Account</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </LinearGradient>

            <InterviewModal
                isVisible={showInterviewModal}
                onClose={() => setShowInterviewModal(false)}
                onSubmit={handleInterviewSubmit}
            />

            <AuthModal
                isVisible={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                initialMode="signup"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        paddingTop: 60,
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginTop: 16,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        fontFamily: 'Inter-Regular',
    },
    userStatusContainer: {
        marginBottom: 24,
    },
    statusCard: {
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 255, 0.2)',
    },
    statusTitle: {
        fontSize: 16,
        fontFamily: 'Inter-Bold',
        color: '#00d4ff',
        marginBottom: 12,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        fontFamily: 'Inter-Regular',
    },
    statusValue: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        color: 'white',
    },
    actionsContainer: {
        marginBottom: 40,
    },
    primaryAction: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        shadowColor: '#00d4ff',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    actionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        paddingHorizontal: 32,
        gap: 12,
    },
    actionText: {
        color: 'white',
        fontFamily: 'Inter-Bold',
        fontSize: 18,
    },
    secondaryActions: {
        flexDirection: 'row',
        gap: 12,
    },
    secondaryAction: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    disabledAction: {
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    secondaryActionText: {
        color: '#00d4ff',
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    disabledText: {
        color: '#6B7280',
    },
    recentSection: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginBottom: 16,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.6)',
        fontFamily: 'Inter-SemiBold',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.4)',
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
    signUpPrompt: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    promptTitle: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginBottom: 12,
        textAlign: 'center',
    },
    promptSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
        fontFamily: 'Inter-Regular',
    },
    promptFeatures: {
        alignSelf: 'stretch',
        marginBottom: 32,
    },
    promptFeature: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 8,
        fontFamily: 'Inter-Regular',
    },
    signUpButton: {
        borderRadius: 12,
        overflow: 'hidden',
        width: '100%',
    },
    signUpButtonGradient: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        alignItems: 'center',
    },
    signUpButtonText: {
        color: 'white',
        fontFamily: 'Inter-Bold',
        fontSize: 16,
    },
});
