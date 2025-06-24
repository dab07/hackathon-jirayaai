import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Trophy,
    CheckCircle,
    XCircle,
    RotateCcw,
    Home,
    Eye,
    EyeOff,
    Lightbulb,
    Target
} from 'lucide-react-native';

interface InterviewResultsProps {
    score: number;
    responses: Array<{
        question: string;
        answer: string;
        score?: number;
        feedback?: string;
        expectedAnswer?: string;
    }>;
    level: number;
    onRetakeInterview: () => void;
    onGoHome: () => void;
}

export default function InterviewResults({
                                             score,
                                             responses,
                                             level,
                                             onRetakeInterview,
                                             onGoHome
                                         }: InterviewResultsProps) {
    const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
    const [showExpectedAnswers, setShowExpectedAnswers] = useState<Set<number>>(new Set());

    const getScoreColor = (score: number) => {
        if (score >= 80) return ['#10B981', '#059669'];
        if (score >= 60) return ['#F59E0B', '#D97706'];
        return ['#EF4444', '#DC2626'];
    };

    const getScoreMessage = (score: number) => {
        if (score >= 80) return 'Excellent Performance!';
        if (score >= 60) return 'Good Job!';
        return 'Keep Practicing!';
    };

    const getScoreAdvice = (score: number) => {
        if (score >= 80) return 'You\'re well-prepared for interviews. Focus on maintaining this level of performance.';
        if (score >= 60) return 'You\'re on the right track. Review the feedback and practice the areas that need improvement.';
        return 'Focus on understanding the fundamentals and practice more. Review the expected answers to learn what interviewers are looking for.';
    };

    const levelNames = {
        1: 'Basic',
        2: 'Advanced',
        3: 'Adaptive',
    };

    const toggleQuestionExpansion = (index: number) => {
        const newExpanded = new Set(expandedQuestions);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedQuestions(newExpanded);
    };

    const toggleExpectedAnswer = (index: number) => {
        const newShowExpected = new Set(showExpectedAnswers);
        if (newShowExpected.has(index)) {
            newShowExpected.delete(index);
        } else {
            newShowExpected.add(index);
        }
        setShowExpectedAnswers(newShowExpected);
    };

    const getPerformanceInsights = () => {
        const totalQuestions = responses.length;
        const excellentAnswers = responses.filter(r => (r.score || 0) >= 80).length;
        const goodAnswers = responses.filter(r => (r.score || 0) >= 60 && (r.score || 0) < 80).length;
        const needsImprovementAnswers = responses.filter(r => (r.score || 0) < 60).length;

        return {
            totalQuestions,
            excellentAnswers,
            goodAnswers,
            needsImprovementAnswers,
            excellentPercentage: Math.round((excellentAnswers / totalQuestions) * 100),
            goodPercentage: Math.round((goodAnswers / totalQuestions) * 100),
            needsImprovementPercentage: Math.round((needsImprovementAnswers / totalQuestions) * 100),
        };
    };

    const insights = getPerformanceInsights();

    return (
        <ScrollView style={styles.container}>
            {/* Header Card */}
            <View style={styles.headerSection}>
                <View style={styles.headerCard}>
                    <View style={styles.trophyContainer}>
                        <View style={styles.trophyWrapper}>
                            <LinearGradient
                                colors={getScoreColor(score) as [string, string, ...string[]]}
                                style={styles.trophyGradient}
                            >
                                <Trophy size={40} color="white" />
                            </LinearGradient>
                        </View>
                    </View>

                    <Text style={styles.scoreText}>{score}%</Text>
                    <Text style={styles.scoreMessage}>
                        {getScoreMessage(score)}
                    </Text>
                    <Text style={styles.levelText}>
                        {levelNames[level as keyof typeof levelNames]} Interview Completed
                    </Text>
                    <Text style={styles.adviceText}>
                        {getScoreAdvice(score)}
                    </Text>
                </View>
            </View>

            {/* Performance Insights */}
            <View style={styles.insightsSection}>
                <Text style={styles.sectionTitle}>Performance Breakdown</Text>
                <View style={styles.insightsCard}>
                    <View style={styles.insightRow}>
                        <View style={styles.insightItem}>
                            <View style={[styles.insightIcon, { backgroundColor: '#10B981' }]}>
                                <CheckCircle size={20} color="white" />
                            </View>
                            <Text style={styles.insightNumber}>{insights.excellentAnswers}</Text>
                            <Text style={styles.insightLabel}>Excellent</Text>
                            <Text style={styles.insightPercentage}>{insights.excellentPercentage}%</Text>
                        </View>

                        <View style={styles.insightItem}>
                            <View style={[styles.insightIcon, { backgroundColor: '#F59E0B' }]}>
                                <Target size={20} color="white" />
                            </View>
                            <Text style={styles.insightNumber}>{insights.goodAnswers}</Text>
                            <Text style={styles.insightLabel}>Good</Text>
                            <Text style={styles.insightPercentage}>{insights.goodPercentage}%</Text>
                        </View>

                        <View style={styles.insightItem}>
                            <View style={[styles.insightIcon, { backgroundColor: '#EF4444' }]}>
                                <Lightbulb size={20} color="white" />
                            </View>
                            <Text style={styles.insightNumber}>{insights.needsImprovementAnswers}</Text>
                            <Text style={styles.insightLabel}>Needs Work</Text>
                            <Text style={styles.insightPercentage}>{insights.needsImprovementPercentage}%</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Detailed Results */}
            <View style={styles.resultsSection}>
                <Text style={styles.sectionTitle}>Question Analysis</Text>

                {responses.map((response, index) => {
                    const isExpanded = expandedQuestions.has(index);
                    const showExpected = showExpectedAnswers.has(index);
                    const questionScore = response.score || 0;

                    return (
                        <View key={index} style={styles.questionCard}>
                            <TouchableOpacity
                                onPress={() => toggleQuestionExpansion(index)}
                                style={styles.questionHeader}
                            >
                                <View style={styles.questionHeaderLeft}>
                                    <Text style={styles.questionNumber}>Q{index + 1}</Text>
                                    <View style={styles.questionScoreContainer}>
                                        {questionScore >= 70 ? (
                                            <CheckCircle size={20} color="#10B981" />
                                        ) : (
                                            <XCircle size={20} color="#EF4444" />
                                        )}
                                        <Text style={[
                                            styles.questionScore,
                                            { color: questionScore >= 70 ? '#10B981' : '#EF4444' }
                                        ]}>
                                            {questionScore}%
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.expandIcon}>
                                    <Text style={styles.expandText}>
                                        {isExpanded ? '−' : '+'}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {isExpanded && (
                                <View style={styles.questionContent}>
                                    <Text style={styles.questionText}>
                                        {response.question}
                                    </Text>

                                    <View style={styles.answerSection}>
                                        <Text style={styles.sectionLabel}>Your Answer</Text>
                                        <View style={styles.answerContainer}>
                                            <Text style={styles.answerText}>
                                                {response.answer}
                                            </Text>
                                        </View>
                                    </View>

                                    {response.expectedAnswer && (
                                        <View style={styles.expectedSection}>
                                            <TouchableOpacity
                                                onPress={() => toggleExpectedAnswer(index)}
                                                style={styles.expectedToggle}
                                            >
                                                {showExpected ? (
                                                    <EyeOff size={16} color="#00d4ff" />
                                                ) : (
                                                    <Eye size={16} color="#00d4ff" />
                                                )}
                                                <Text style={styles.expectedToggleText}>
                                                    {showExpected ? 'Hide' : 'Show'} Expected Answer
                                                </Text>
                                            </TouchableOpacity>

                                            {showExpected && (
                                                <View style={styles.expectedContainer}>
                                                    <Text style={styles.sectionLabel}>Expected Answer</Text>
                                                    <Text style={styles.expectedText}>
                                                        {response.expectedAnswer}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    )}

                                    {response.feedback && (
                                        <View style={styles.feedbackSection}>
                                            <Text style={styles.sectionLabel}>AI Feedback</Text>
                                            <View style={styles.feedbackContainer}>
                                                <Text style={styles.feedbackText}>
                                                    {response.feedback}
                                                </Text>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    );
                })}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsSection}>
                <TouchableOpacity
                    onPress={onRetakeInterview}
                    style={styles.secondaryButton}
                >
                    <RotateCcw size={20} color="#00d4ff" />
                    <Text style={styles.secondaryButtonText}>Retake Interview</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={onGoHome}
                    style={styles.primaryButton}
                >
                    <LinearGradient
                        colors={['#00d4ff', '#0099cc']}
                        style={styles.primaryButtonGradient}
                    >
                        <Home size={20} color="white" />
                        <Text style={styles.primaryButtonText}>Back to Home</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    headerSection: {
        padding: 24,
    },
    headerCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    trophyContainer: {
        marginBottom: 24,
    },
    trophyWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        overflow: 'hidden',
    },
    trophyGradient: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreText: {
        fontSize: 48,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginBottom: 8,
    },
    scoreMessage: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginBottom: 8,
    },
    levelText: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: 16,
        fontFamily: 'Inter-Regular',
    },
    adviceText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        lineHeight: 20,
        fontFamily: 'Inter-Regular',
    },
    insightsSection: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginBottom: 16,
    },
    insightsCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    insightRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    insightItem: {
        alignItems: 'center',
    },
    insightIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    insightNumber: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginBottom: 4,
    },
    insightLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: 'Inter-Regular',
        marginBottom: 2,
    },
    insightPercentage: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.5)',
        fontFamily: 'Inter-Regular',
    },
    resultsSection: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    questionCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    questionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    questionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    questionNumber: {
        fontSize: 16,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginRight: 12,
    },
    questionScoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    questionScore: {
        fontSize: 16,
        fontFamily: 'Inter-Bold',
    },
    expandIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    expandText: {
        fontSize: 18,
        color: 'white',
        fontFamily: 'Inter-Bold',
    },
    questionContent: {
        padding: 16,
        paddingTop: 0,
    },
    questionText: {
        fontSize: 16,
        color: 'white',
        lineHeight: 24,
        marginBottom: 20,
        fontFamily: 'Inter-Regular',
    },
    answerSection: {
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        color: '#00d4ff',
        marginBottom: 8,
    },
    answerContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    answerText: {
        fontSize: 14,
        color: 'white',
        lineHeight: 20,
        fontFamily: 'Inter-Regular',
    },
    expectedSection: {
        marginBottom: 16,
    },
    expectedToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    expectedToggleText: {
        fontSize: 14,
        color: '#00d4ff',
        fontFamily: 'Inter-SemiBold',
    },
    expectedContainer: {
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 255, 0.2)',
    },
    expectedText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 20,
        fontFamily: 'Inter-Regular',
    },
    feedbackSection: {
        marginBottom: 16,
    },
    feedbackContainer: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    feedbackText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 20,
        fontFamily: 'Inter-Regular',
    },
    actionsSection: {
        padding: 24,
        gap: 16,
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 2,
        borderColor: '#00d4ff',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 24,
        gap: 8,
    },
    secondaryButtonText: {
        color: '#00d4ff',
        fontFamily: 'Inter-Bold',
        fontSize: 16,
    },
    primaryButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    primaryButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        gap: 8,
    },
    primaryButtonText: {
        color: 'white',
        fontFamily: 'Inter-Bold',
        fontSize: 16,
    },
});
