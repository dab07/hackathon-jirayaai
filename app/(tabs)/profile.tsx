import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    User,
    Award,
    TrendingUp,
    Calendar,
    Settings,
    LogOut,
    Crown,
    Zap,
    Star,
    Check,
    ArrowRight,
    Edit3,
    Image as ImageIcon
} from 'lucide-react-native';
import { useAuthStore } from '../../utils/stores/authStore';
import { supabase } from '../../utils/supabase/client';
import AuthModal from '../../components/AuthModal';
import PlanSelectionModal from '../../components/PlanSelectionModal';
import ProfileSettingsModal from '../../components/ProfileSettingsModal';

interface UserStats {
    totalInterviews: number;
    averageScore: number;
    tokensUsed: number;
    tokensLimit: number;
    recentInterviews: Array<{
        id: string;
        score: number;
        completed_at: string;
        job_title: string;
    }>;
}

const pricingPlans = [
    {
        id: 'free',
        name: 'Free Tier',
        price: '$0',
        period: 'forever',
        tokens: '1,000',
        interviews: '2-3',
        description: 'Perfect for getting started',
        features: [
            '1,000 AI tokens included',
            '2-3 complete interviews',
            'Basic question types',
            'Text-based responses only',
            'Basic feedback',
            'Email support'
        ],
        gradient: ['#6B7280', '#4B5563'],
        icon: Star,
        popular: false,
        tokensLimit: 1000,
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$9.99',
        period: 'month',
        tokens: '10,000',
        interviews: '20-25',
        description: 'Most popular for serious preparation',
        features: [
            '10,000 AI tokens per month',
            '20-25 complete interviews',
            'All question types & difficulties',
            'Voice + text responses',
            'Advanced AI feedback',
            'Performance analytics',
            'Priority support',
            'Custom interview scenarios'
        ],
        gradient: ['#3B82F6', '#1D4ED8'],
        icon: Zap,
        popular: true,
        tokensLimit: 10000,
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: '$29.99',
        period: 'month',
        tokens: 'Unlimited',
        interviews: 'Unlimited',
        description: 'For teams and heavy users',
        features: [
            'Unlimited AI tokens',
            'Unlimited interviews',
            'Team collaboration features',
            'Custom AI training',
            'Advanced analytics dashboard',
            'White-label options',
            'Dedicated account manager',
            'API access',
            'Custom integrations'
        ],
        gradient: ['#7C3AED', '#5B21B6'],
        icon: Crown,
        popular: false,
        tokensLimit: 999999,
    },
];

export default function ProfileTab() {
    const { user, profile, signOut, refreshProfile, updateProfile } = useAuthStore();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [userStats, setUserStats] = useState<UserStats>({
        totalInterviews: 0,
        averageScore: 0,
        tokensUsed: 0,
        tokensLimit: 1000,
        recentInterviews: [],
    });
    const [loading, setLoading] = useState(false);
    const [updatingPlan, setUpdatingPlan] = useState(false);

    useEffect(() => {
        if (user && profile) {
            fetchUserStats();
        }
    }, [user, profile]);

    const fetchUserStats = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // Get user's interviews with job details
            const { data: interviews } = await supabase
                .from('interviews')
                .select(`
          id,
          score,
          completed_at,
          status,
          job_detail_id (
            job_title
          )
        `)
                .eq('user_id', user.id)
                .eq('status', 'completed')
                .order('completed_at', { ascending: false });

            if (interviews) {
                const completedInterviews = interviews.filter(i => i.score !== null);
                const averageScore = completedInterviews.length > 0
                    ? Math.round(completedInterviews.reduce((sum, i) => sum + (i.score || 0), 0) / completedInterviews.length)
                    : 0;

                const recentInterviews = interviews.slice(0, 5).map(interview => ({
                    id: interview.id,
                    score: interview.score || 0,
                    completed_at: interview.completed_at || '',
                    job_title: (interview.job_detail_id as any)?.job_title || 'Unknown Position',
                }));

                setUserStats({
                    totalInterviews: completedInterviews.length,
                    averageScore,
                    tokensUsed: profile?.tokens_used || 0,
                    tokensLimit: profile?.tokens_limit || 1000,
                    recentInterviews,
                });
            }
        } catch (error) {
            console.error('Error fetching user stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                    },
                },
            ]
        );
    };

    const handlePlanSelection = async (planId: string) => {
        if (!user || !profile) return;

        setUpdatingPlan(true);
        try {
            const selectedPlan = pricingPlans.find(p => p.id === planId);
            if (!selectedPlan) {
                throw new Error('Invalid plan selected');
            }

            // Update profile with new plan
            const result = await updateProfile({
                subscription_plan: planId as 'free' | 'pro' | 'enterprise',
                tokens_limit: selectedPlan.tokensLimit,
                // Reset tokens used if upgrading to a higher plan
                tokens_used: planId !== 'free' && profile.subscription_plan === 'free' ? 0 : profile.tokens_used,
            });

            if (result.error) {
                throw new Error(result.error);
            }

            // Refresh profile to get updated data
            await refreshProfile();

            setShowPlanModal(false);

            Alert.alert(
                'Plan Updated!',
                `You have successfully ${planId === 'free' ? 'downgraded to' : 'upgraded to'} the ${selectedPlan.name} plan.`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Error updating plan:', error);
            Alert.alert(
                'Update Failed',
                error instanceof Error ? error.message : 'Failed to update plan. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setUpdatingPlan(false);
        }
    };

    const getCurrentPlan = () => {
        return pricingPlans.find(plan => plan.id === (profile?.subscription_plan || 'free'));
    };

    const getPlanIcon = (plan: string) => {
        switch (plan) {
            case 'pro':
                return <Zap size={16} color="#3B82F6" />;
            case 'enterprise':
                return <Crown size={16} color="#7C3AED" />;
            default:
                return <Star size={16} color="#6B7280" />;
        }
    };

    const getPlanColor = (plan: string) => {
        switch (plan) {
            case 'pro':
                return '#3B82F6';
            case 'enterprise':
                return '#7C3AED';
            default:
                return '#6B7280';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getTokensUsagePercentage = () => {
        return Math.round((userStats.tokensUsed / userStats.tokensLimit) * 100);
    };

    if (!user) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={['#0a0a0a', '#1a1a2e']}
                    style={styles.gradient}
                >
                    <View style={styles.unauthenticatedContainer}>
                        <View style={styles.unauthenticatedContent}>
                            <User size={64} color="#00d4ff" />
                            <Text style={styles.unauthenticatedTitle}>Sign In Required</Text>
                            <Text style={styles.unauthenticatedSubtitle}>
                                Sign in to view your profile, track your progress, and access your interview history.
                            </Text>

                            <TouchableOpacity
                                onPress={() => setShowAuthModal(true)}
                                style={styles.signInButton}
                            >
                                <LinearGradient
                                    colors={['#00d4ff', '#0099cc']}
                                    style={styles.signInButtonGradient}
                                >
                                    <Text style={styles.signInButtonText}>Sign In</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </LinearGradient>

                <AuthModal
                    isVisible={showAuthModal}
                    onClose={() => setShowAuthModal(false)}
                    initialMode="signin"
                />
            </View>
        );
    }

    const currentPlan = getCurrentPlan();

    return (
        <ScrollView style={styles.container}>
            <LinearGradient
                colors={['#0a0a0a', '#1a1a2e']}
                style={styles.gradient}
            >
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <LinearGradient
                            colors={['#00d4ff', '#0099cc']}
                            style={styles.avatar}
                        >
                            {profile?.avatar_url ? (
                                <ImageIcon size={40} color="white" />
                            ) : (
                                <User size={40} color="white" />
                            )}
                        </LinearGradient>
                    </View>
                    <Text style={styles.name}>{profile?.full_name || 'User'}</Text>
                    {profile?.username && (
                        <Text style={styles.username}>@{profile.username}</Text>
                    )}
                    <Text style={styles.email}>{user.email}</Text>

                    {/* Current Plan Badge */}
                    <View style={[styles.planBadge, { borderColor: getPlanColor(profile?.subscription_plan || 'free') }]}>
                        {getPlanIcon(profile?.subscription_plan || 'free')}
                        <Text style={[styles.planText, { color: getPlanColor(profile?.subscription_plan || 'free') }]}>
                            {(profile?.subscription_plan || 'free').toUpperCase()} PLAN
                        </Text>
                    </View>

                    {/* Edit Profile Button */}
                    <TouchableOpacity
                        onPress={() => setShowSettingsModal(true)}
                        style={styles.editProfileButton}
                    >
                        <Edit3 size={16} color="#00d4ff" />
                        <Text style={styles.editProfileText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                {/* Current Plan Details */}
                {currentPlan && (
                    <View style={styles.currentPlanContainer}>
                        <Text style={styles.sectionTitle}>Current Plan</Text>
                        <View style={styles.currentPlanCard}>
                            <LinearGradient
                                colors={currentPlan.gradient}
                                style={styles.currentPlanGradient}
                            >
                                <View style={styles.currentPlanHeader}>
                                    <View style={styles.currentPlanInfo}>
                                        <Text style={styles.currentPlanName}>{currentPlan.name}</Text>
                                        <Text style={styles.currentPlanPrice}>
                                            {currentPlan.price}
                                            {currentPlan.period !== 'forever' && `/${currentPlan.period}`}
                                        </Text>
                                    </View>
                                    <View style={styles.currentPlanIcon}>
                                        <currentPlan.icon size={24} color="white" />
                                    </View>
                                </View>

                                <Text style={styles.currentPlanDescription}>
                                    {currentPlan.description}
                                </Text>

                                <View style={styles.currentPlanStats}>
                                    <View style={styles.currentPlanStat}>
                                        <Text style={styles.currentPlanStatValue}>{currentPlan.tokens}</Text>
                                        <Text style={styles.currentPlanStatLabel}>AI Tokens</Text>
                                    </View>
                                    <View style={styles.currentPlanStat}>
                                        <Text style={styles.currentPlanStatValue}>{currentPlan.interviews}</Text>
                                        <Text style={styles.currentPlanStatLabel}>Interviews</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={() => setShowPlanModal(true)}
                                    style={styles.changePlanButton}
                                >
                                    <Text style={styles.changePlanButtonText}>Change Plan</Text>
                                    <ArrowRight size={16} color="white" />
                                </TouchableOpacity>
                            </LinearGradient>
                        </View>
                    </View>
                )}

                {/* Token Usage */}
                <View style={styles.tokenUsageContainer}>
                    <Text style={styles.sectionTitle}>Token Usage</Text>
                    <View style={styles.tokenUsageCard}>
                        <View style={styles.tokenUsageHeader}>
                            <Text style={styles.tokenUsageText}>
                                {userStats.tokensUsed.toLocaleString()} / {userStats.tokensLimit.toLocaleString()} tokens
                            </Text>
                            <Text style={styles.tokenUsagePercentage}>
                                {getTokensUsagePercentage()}%
                            </Text>
                        </View>
                        <View style={styles.tokenProgressBar}>
                            <View
                                style={[
                                    styles.tokenProgressFill,
                                    {
                                        width: `${Math.min(getTokensUsagePercentage(), 100)}%`,
                                        backgroundColor: getTokensUsagePercentage() > 80 ? '#EF4444' : '#00d4ff'
                                    }
                                ]}
                            />
                        </View>
                        <Text style={styles.tokenUsageSubtext}>
                            {userStats.tokensLimit - userStats.tokensUsed} tokens remaining
                        </Text>
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsContainer}>
                    <Text style={styles.sectionTitle}>Your Progress</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Calendar size={24} color="#00d4ff" />
                            <Text style={styles.statValue}>{userStats.totalInterviews}</Text>
                            <Text style={styles.statLabel}>Interviews Completed</Text>
                        </View>
                        <View style={styles.statCard}>
                            <TrendingUp size={24} color="#00d4ff" />
                            <Text style={styles.statValue}>
                                {userStats.averageScore > 0 ? `${userStats.averageScore}%` : 'N/A'}
                            </Text>
                            <Text style={styles.statLabel}>Average Score</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Award size={24} color="#00d4ff" />
                            <Text style={styles.statValue}>
                                {userStats.totalInterviews >= 5 ? '🏆' : userStats.totalInterviews >= 1 ? '🥉' : '0'}
                            </Text>
                            <Text style={styles.statLabel}>Achievements</Text>
                        </View>
                    </View>
                </View>

                {/* Recent Interviews */}
                {userStats.recentInterviews.length > 0 && (
                    <View style={styles.recentInterviewsContainer}>
                        <Text style={styles.sectionTitle}>Recent Interviews</Text>
                        {userStats.recentInterviews.map((interview) => (
                            <View key={interview.id} style={styles.interviewCard}>
                                <View style={styles.interviewHeader}>
                                    <Text style={styles.interviewJobTitle}>{interview.job_title}</Text>
                                    <View style={[
                                        styles.scoreChip,
                                        { backgroundColor: interview.score >= 70 ? '#10B98120' : '#EF444420' }
                                    ]}>
                                        <Text style={[
                                            styles.scoreText,
                                            { color: interview.score >= 70 ? '#10B981' : '#EF4444' }
                                        ]}>
                                            {interview.score}%
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.interviewDate}>
                                    {formatDate(interview.completed_at)}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Quick Actions */}
                <View style={styles.actionsContainer}>
                    <Text style={styles.sectionTitle}>Account</Text>

                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => setShowSettingsModal(true)}
                    >
                        <Settings size={20} color="#00d4ff" />
                        <Text style={styles.actionText}>Account Settings</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionItem}>
                        <Award size={20} color="#00d4ff" />
                        <Text style={styles.actionText}>View Achievements</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionItem}>
                        <TrendingUp size={20} color="#00d4ff" />
                        <Text style={styles.actionText}>Performance Analytics</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionItem, styles.logoutAction]}
                        onPress={handleSignOut}
                    >
                        <LogOut size={20} color="#ff4444" />
                        <Text style={[styles.actionText, styles.logoutText]}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Plan Selection Modal */}
            <PlanSelectionModal
                isVisible={showPlanModal}
                onClose={() => setShowPlanModal(false)}
                onSelectPlan={handlePlanSelection}
                currentPlan={profile?.subscription_plan || 'free'}
                loading={updatingPlan}
                plans={pricingPlans}
            />

            {/* Profile Settings Modal */}
            <ProfileSettingsModal
                isVisible={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    gradient: {
        flex: 1,
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    unauthenticatedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unauthenticatedContent: {
        alignItems: 'center',
        maxWidth: 300,
    },
    unauthenticatedTitle: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginTop: 24,
        marginBottom: 12,
        textAlign: 'center',
    },
    unauthenticatedSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        fontFamily: 'Inter-Regular',
    },
    signInButton: {
        borderRadius: 12,
        overflow: 'hidden',
        width: '100%',
    },
    signInButtonGradient: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        alignItems: 'center',
    },
    signInButtonText: {
        color: 'white',
        fontFamily: 'Inter-Bold',
        fontSize: 16,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        marginBottom: 16,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    name: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginBottom: 4,
    },
    username: {
        fontSize: 16,
        color: '#00d4ff',
        fontFamily: 'Inter-Medium',
        marginBottom: 4,
    },
    email: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: 'Inter-Regular',
        marginBottom: 16,
    },
    planBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 6,
        marginBottom: 16,
    },
    planText: {
        fontSize: 12,
        fontFamily: 'Inter-Bold',
    },
    editProfileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 255, 0.3)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
    },
    editProfileText: {
        color: '#00d4ff',
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
    },
    currentPlanContainer: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginBottom: 16,
    },
    currentPlanCard: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    currentPlanGradient: {
        padding: 24,
    },
    currentPlanHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    currentPlanInfo: {
        flex: 1,
    },
    currentPlanName: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginBottom: 4,
    },
    currentPlanPrice: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        color: 'rgba(255, 255, 255, 0.9)',
    },
    currentPlanIcon: {
        width: 48,
        height: 48,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    currentPlanDescription: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 20,
        fontFamily: 'Inter-Regular',
    },
    currentPlanStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: 16,
    },
    currentPlanStat: {
        alignItems: 'center',
    },
    currentPlanStatValue: {
        fontSize: 20,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginBottom: 4,
    },
    currentPlanStatLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: 'Inter-Regular',
    },
    changePlanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 20,
        gap: 8,
    },
    changePlanButtonText: {
        color: 'white',
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
    },
    tokenUsageContainer: {
        marginBottom: 32,
    },
    tokenUsageCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    tokenUsageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    tokenUsageText: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: 'white',
    },
    tokenUsagePercentage: {
        fontSize: 14,
        fontFamily: 'Inter-Bold',
        color: '#00d4ff',
    },
    tokenProgressBar: {
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 4,
        marginBottom: 8,
        overflow: 'hidden',
    },
    tokenProgressFill: {
        height: '100%',
        borderRadius: 4,
    },
    tokenUsageSubtext: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
        fontFamily: 'Inter-Regular',
    },
    statsContainer: {
        marginBottom: 32,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    statValue: {
        fontSize: 20,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginTop: 8,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
    recentInterviewsContainer: {
        marginBottom: 32,
    },
    interviewCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    interviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    interviewJobTitle: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: 'white',
        flex: 1,
    },
    scoreChip: {
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    scoreText: {
        fontSize: 12,
        fontFamily: 'Inter-Bold',
    },
    interviewDate: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
        fontFamily: 'Inter-Regular',
    },
    actionsContainer: {
        flex: 1,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    actionText: {
        color: 'white',
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        marginLeft: 12,
    },
    logoutAction: {
        borderColor: 'rgba(255, 68, 68, 0.2)',
        backgroundColor: 'rgba(255, 68, 68, 0.05)',
    },
    logoutText: {
        color: '#ff4444',
    },
});
