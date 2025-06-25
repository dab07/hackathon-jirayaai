import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Brain, Play, Settings, BarChart3, Lock, Calendar, TrendingUp, Award } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../utils/stores/authStore';
import { supabase } from '../../utils/supabase/client';
import InterviewModal from '../../components/InterviewModal';
import AuthModal from '../../components/AuthModal';

interface InterviewResult {
    id: string;
    score: number;
    level: number;
    completed_at: string;
    job_title: string;
    responses: any[];
    tokens_used: number;
}

export default function InterviewTab() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user, profile } = useAuthStore();
    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [interviewResults, setInterviewResults] = useState<InterviewResult[]>([]);
    const [loading, setLoading] = useState(false);

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

    // Fetch interview results when component mounts
    useEffect(() => {
        if (user) {
            fetchInterviewResults();
        }
    }, [user]);

    const fetchInterviewResults = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const { data: interviews, error } = await supabase
                .from('interviews')
                .select(`
          id,
          score,
          level,
          completed_at,
          responses,
          tokens_used,
          job_detail_id (
            job_title
          )
        `)
                .eq('user_id', user.id)
                .eq('status', 'completed')
                .order('completed_at', { ascending: false })
                .limit(10);

            if (error) {
                console.error('Error fetching interview results:', error);
                return;
            }

            const formattedResults: InterviewResult[] = interviews?.map(interview => ({
                id: interview.id,
                score: interview.score || 0,
                level: interview.level,
                completed_at: interview.completed_at || '',
                job_title: (interview.job_detail_id as any)?.job_title || 'Unknown Position',
                responses: interview.responses || [],
                tokens_used: interview.tokens_used || 0,
            })) || [];

            setInterviewResults(formattedResults);
        } catch (error) {
            console.error('Error fetching interview results:', error);
        } finally {
            setLoading(false);
        }
    };

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
            setShowInterviewModal(false);
        }
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

    const getLevelName = (level: number) => {
        switch (level) {
            case 1: return 'Basic';
            case 2: return 'Advanced';
            case 3: return 'Adaptive';
            default: return 'Unknown';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return '#10B981';
        if (score >= 60) return '#F59E0B';
        return '#EF4444';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getAverageScore = () => {
        if (interviewResults.length === 0) return 0;
        const total = interviewResults.reduce((sum, result) => sum + result.score, 0);
        return Math.round(total / interviewResults.length);
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

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                                    View Analytics
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Interview Results */}
                    {user ? (
                        <View style={styles.resultsSection}>
                            <Text style={styles.sectionTitle}>Interview Results</Text>

                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <Text style={styles.loadingText}>Loading results...</Text>
                                </View>
                            ) : interviewResults.length > 0 ? (
                                <>
                                    {/* Summary Stats */}
                                    <View style={styles.summaryStats}>
                                        <View style={styles.summaryCard}>
                                            <Calendar size={20} color="#00d4ff" />
                                            <Text style={styles.summaryValue}>{interviewResults.length}</Text>
                                            <Text style={styles.summaryLabel}>Completed</Text>
                                        </View>
                                        <View style={styles.summaryCard}>
                                            <TrendingUp size={20} color="#00d4ff" />
                                            <Text style={styles.summaryValue}>{getAverageScore()}%</Text>
                                            <Text style={styles.summaryLabel}>Avg Score</Text>
                                        </View>
                                        <View style={styles.summaryCard}>
                                            <Award size={20} color="#00d4ff" />
                                            <Text style={styles.summaryValue}>
                                                {interviewResults.filter(r => r.score >= 80).length}
                                            </Text>
                                            <Text style={styles.summaryLabel}>Excellent</Text>
                                        </View>
                                    </View>

                                    {/* Results List */}
                                    {interviewResults.map((result) => (
                                        <View key={result.id} style={styles.resultCard}>
                                            <View style={styles.resultHeader}>
                                                <View style={styles.resultInfo}>
                                                    <Text style={styles.resultJobTitle}>{result.job_title}</Text>
                                                    <Text style={styles.resultDetails}>
                                                        {getLevelName(result.level)} • {formatDate(result.completed_at)}
                                                    </Text>
                                                </View>
                                                <View style={[
                                                    styles.scoreContainer,
                                                    { backgroundColor: getScoreColor(result.score) + '20' }
                                                ]}>
                                                    <Text style={[
                                                        styles.scoreText,
                                                        { color: getScoreColor(result.score) }
                                                    ]}>
                                                        {result.score}%
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={styles.resultStats}>
                                                <Text style={styles.resultStat}>
                                                    {result.responses.length} questions answered
                                                </Text>
                                                <Text style={styles.resultStat}>
                                                    {result.tokens_used} tokens used
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </>
                            ) : (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>No interviews yet</Text>
                                    <Text style={styles.emptySubtext}>
                                        Start your first AI interview to see results here
                                    </Text>
                                </View>
                            )}
                        </View>
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
                </ScrollView>
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
    content: {
        flex: 1,
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
        marginBottom: 32,
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
    resultsSection: {
        marginBottom: 40,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginBottom: 16,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    loadingText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontFamily: 'Inter-Regular',
    },
    summaryStats: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    summaryValue: {
        fontSize: 20,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginTop: 8,
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: 'Inter-Regular',
    },
    resultCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    resultInfo: {
        flex: 1,
    },
    resultJobTitle: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: 'white',
        marginBottom: 4,
    },
    resultDetails: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.6)',
        fontFamily: 'Inter-Regular',
    },
    scoreContainer: {
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    scoreText: {
        fontSize: 16,
        fontFamily: 'Inter-Bold',
    },
    resultStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    resultStat: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.5)',
        fontFamily: 'Inter-Regular',
    },
    emptyState: {
        padding: 40,
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
        marginBottom: 40,
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
