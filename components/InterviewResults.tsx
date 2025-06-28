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
    ChevronDown,
    ChevronUp,
    Target,
    TrendingUp,
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
        if (score >= 80) return '#10B981';
        if (score >= 60) return '#F59E0B';
        return '#EF4444';
    };

    const getScoreMessage = (score: number) => {
        if (score >= 80) return 'Excellent!';
        if (score >= 60) return 'Good Job!';
        return 'Keep Practicing!';
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
        };
    };

    const insights = getPerformanceInsights();

    return (
        <View style={styles.container}>
            {/* Compact Header */}
            <View style={styles.header}>
                <LinearGradient
                    colors={[getScoreColor(score), getScoreColor(score) + '80']}
                    style={styles.headerGradient}
                >
                    <View style={styles.headerContent}>
                        <View style={styles.scoreSection}>
                            <Trophy size={32} color="white" />
                            <Text style={styles.scoreText}>{score}%</Text>
                            <Text style={styles.scoreMessage}>{getScoreMessage(score)}</Text>
                        </View>

                        <View style={styles.levelSection}>
                            <Text style={styles.levelText}>{levelNames[level as keyof typeof levelNames]} Interview</Text>
                            <Text style={styles.questionsText}>{responses.length} Questions Completed</Text>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            {/* Compact Performance Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <CheckCircle size={16} color="#10B981" />
                    <Text style={styles.statNumber}>{insights.excellentAnswers}</Text>
                    <Text style={styles.statLabel}>Excellent</Text>
                </View>
                <View style={styles.statItem}>
                    <Target size={16} color="#F59E0B" />
                    <Text style={styles.statNumber}>{insights.goodAnswers}</Text>
                    <Text style={styles.statLabel}>Good</Text>
                </View>
                <View style={styles.statItem}>
                    <TrendingUp size={16} color="#EF4444" />
                    <Text style={styles.statNumber}>{insights.needsImprovementAnswers}</Text>
                    <Text style={styles.statLabel}>Improve</Text>
                </View>
            </View>

            {/* Compact Action Buttons */}
            <View style={styles.actionButtons}>
                <TouchableOpacity onPress={onRetakeInterview} style={styles.secondaryButton}>
                    <RotateCcw size={18} color="#00d4ff" />
                    <Text style={styles.secondaryButtonText}>Retake</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={onGoHome} style={styles.primaryButton}>
                    <LinearGradient colors={['#00d4ff', '#0099cc']} style={styles.primaryButtonGradient}>
                        <Home size={18} color="white" />
                        <Text style={styles.primaryButtonText}>Home</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Compact Question Results */}
            <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
                <Text style={styles.resultsTitle}>Question Analysis</Text>

                {responses.map((response, index) => {
                    const isExpanded = expandedQuestions.has(index);
                    const showExpected = showExpectedAnswers.has(index);
                    const questionScore = response.score || 0;

                    return (
                        <View key={index} style={styles.questionCard}>
                            {/* Compact Question Header */}
                            <TouchableOpacity
                                onPress={() => toggleQuestionExpansion(index)}
                                style={styles.questionHeader}
                            >
                                <View style={styles.questionHeaderLeft}>
                                    <View style={styles.questionNumber}>
                                        <Text style={styles.questionNumberText}>{index + 1}</Text>
                                    </View>
                                    <View style={styles.questionInfo}>
                                        <Text style={styles.questionPreview} numberOfLines={1}>
                                            {response.question}
                                        </Text>
                                        <View style={styles.questionMeta}>
                                            {questionScore >= 70 ? (
                                                <CheckCircle size={14} color="#10B981" />
                                            ) : (
                                                <XCircle size={14} color="#EF4444" />
                                            )}
                                            <Text style={[
                                                styles.questionScore,
                                                { color: questionScore >= 70 ? '#10B981' : '#EF4444' }
                                            ]}>
                                                {questionScore}%
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                {isExpanded ? (
                                    <ChevronUp size={20} color="rgba(255, 255, 255, 0.6)" />
                                ) : (
                                    <ChevronDown size={20} color="rgba(255, 255, 255, 0.6)" />
                                )}
                            </TouchableOpacity>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <View style={styles.expandedContent}>
                                    <Text style={styles.fullQuestion}>{response.question}</Text>

                                    <View style={styles.answerSection}>
                                        <Text style={styles.sectionLabel}>Your Answer</Text>
                                        <Text style={styles.answerText}>{response.answer}</Text>
                                    </View>

                                    {response.feedback && (
                                        <View style={styles.feedbackSection}>
                                            <Text style={styles.sectionLabel}>AI Feedback</Text>
                                            <Text style={styles.feedbackText}>{response.feedback}</Text>
                                        </View>
                                    )}

                                    {response.expectedAnswer && (
                                        <View style={styles.expectedSection}>
                                            <TouchableOpacity
                                                onPress={() => toggleExpectedAnswer(index)}
                                                style={styles.expectedToggle}
                                            >
                                                {showExpected ? (
                                                    <EyeOff size={14} color="#00d4ff" />
                                                ) : (
                                                    <Eye size={14} color="#00d4ff" />
                                                )}
                                                <Text style={styles.expectedToggleText}>
                                                    {showExpected ? 'Hide' : 'Show'} Expected Answer
                                                </Text>
                                            </TouchableOpacity>

                                            {showExpected && (
                                                <View style={styles.expectedContent}>
                                                    <Text style={styles.expectedText}>{response.expectedAnswer}</Text>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    header: {
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
    },
    headerGradient: {
        padding: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    scoreSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    scoreText: {
        fontSize: 28,
        fontFamily: 'Inter-Bold',
        color: 'white',
    },
    scoreMessage: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: 'white',
    },
    levelSection: {
        alignItems: 'flex-end',
    },
    levelText: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        color: 'rgba(255, 255, 255, 0.9)',
    },
    questionsText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: 'Inter-Regular',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginHorizontal: 20,
        marginBottom: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    statItem: {
        alignItems: 'center',
        gap: 4,
    },
    statNumber: {
        fontSize: 18,
        fontFamily: 'Inter-Bold',
        color: 'white',
    },
    statLabel: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: 'Inter-Regular',
    },
    actionButtons: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 20,
        gap: 12,
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: '#00d4ff',
        borderRadius: 12,
        paddingVertical: 12,
        gap: 8,
    },
    secondaryButtonText: {
        color: '#00d4ff',
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
    },
    primaryButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    primaryButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    primaryButtonText: {
        color: 'white',
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
    },
    resultsContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    resultsTitle: {
        fontSize: 18,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginBottom: 16,
    },
    questionCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        marginBottom: 12,
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
        gap: 12,
    },
    questionNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0, 212, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    questionNumberText: {
        fontSize: 12,
        fontFamily: 'Inter-Bold',
        color: '#00d4ff',
    },
    questionInfo: {
        flex: 1,
    },
    questionPreview: {
        fontSize: 14,
        color: 'white',
        fontFamily: 'Inter-Regular',
        marginBottom: 4,
    },
    questionMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    questionScore: {
        fontSize: 12,
        fontFamily: 'Inter-SemiBold',
    },
    expandedContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    fullQuestion: {
        fontSize: 14,
        color: 'white',
        lineHeight: 20,
        marginBottom: 16,
        fontFamily: 'Inter-Regular',
    },
    answerSection: {
        marginBottom: 12,
    },
    sectionLabel: {
        fontSize: 12,
        fontFamily: 'Inter-SemiBold',
        color: '#00d4ff',
        marginBottom: 6,
    },
    answerText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 18,
        fontFamily: 'Inter-Regular',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        padding: 12,
    },
    feedbackSection: {
        marginBottom: 12,
    },
    feedbackText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 18,
        fontFamily: 'Inter-Regular',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    expectedSection: {
        marginBottom: 8,
    },
    expectedToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    expectedToggleText: {
        fontSize: 12,
        color: '#00d4ff',
        fontFamily: 'Inter-SemiBold',
    },
    expectedContent: {
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 255, 0.2)',
    },
    expectedText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 18,
        fontFamily: 'Inter-Regular',
    },
});
