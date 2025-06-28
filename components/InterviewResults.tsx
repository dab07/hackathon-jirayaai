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
    Award
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

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
                            <Trophy size={28} color="white" />
                            <Text style={styles.scoreText}>{score}%</Text>
                            <Text style={styles.scoreMessage}>{getScoreMessage(score)}</Text>
                        </View>

                        <View style={styles.levelSection}>
                            <Text style={styles.levelText}>{levelNames[level as keyof typeof levelNames]} Interview</Text>
                            <Text style={styles.questionsText}>{responses.length} Questions</Text>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            {/* Minimal Performance Stats - Single Row */}
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{insights.excellentAnswers}</Text>
                    <Text style={styles.statLabel}>Excellent</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{insights.goodAnswers}</Text>
                    <Text style={styles.statLabel}>Good</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{insights.needsImprovementAnswers}</Text>
                    <Text style={styles.statLabel}>Improve</Text>
                </View>
            </View>

            {/* Compact Action Buttons */}
            <View style={styles.actionButtons}>
                <TouchableOpacity onPress={onRetakeInterview} style={styles.secondaryButton}>
                    <RotateCcw size={16} color="#00d4ff" />
                    <Text style={styles.secondaryButtonText}>Retake</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={onGoHome} style={styles.primaryButton}>
                    <LinearGradient colors={['#00d4ff', '#0099cc']} style={styles.primaryButtonGradient}>
                        <Home size={16} color="white" />
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
                                                <CheckCircle size={12} color="#10B981" />
                                            ) : (
                                                <XCircle size={12} color="#EF4444" />
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
                                    <ChevronUp size={18} color="rgba(255, 255, 255, 0.6)" />
                                ) : (
                                    <ChevronDown size={18} color="rgba(255, 255, 255, 0.6)" />
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
                                                    <EyeOff size={12} color="#00d4ff" />
                                                ) : (
                                                    <Eye size={12} color="#00d4ff" />
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
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 12,
        borderRadius: 12,
        overflow: 'hidden',
    },
    headerGradient: {
        padding: 16,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    scoreSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    scoreText: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        color: 'white',
    },
    scoreMessage: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        color: 'white',
    },
    levelSection: {
        alignItems: 'flex-end',
    },
    levelText: {
        fontSize: 12,
        fontFamily: 'Inter-SemiBold',
        color: 'rgba(255, 255, 255, 0.9)',
    },
    questionsText: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: 'Inter-Regular',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statDivider: {
        width: 1,
        height: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    statNumber: {
        fontSize: 16,
        fontFamily: 'Inter-Bold',
        color: 'white',
    },
    statLabel: {
        fontSize: 9,
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: 'Inter-Regular',
    },
    actionButtons: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 16,
        gap: 8,
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: '#00d4ff',
        borderRadius: 8,
        paddingVertical: 10,
        gap: 6,
    },
    secondaryButtonText: {
        color: '#00d4ff',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
    },
    primaryButton: {
        flex: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
    primaryButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        gap: 6,
    },
    primaryButtonText: {
        color: 'white',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
    },
    resultsContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    resultsTitle: {
        fontSize: 16,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginBottom: 12,
    },
    questionCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    questionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
    },
    questionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 8,
    },
    questionNumber: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(0, 212, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    questionNumberText: {
        fontSize: 10,
        fontFamily: 'Inter-Bold',
        color: '#00d4ff',
    },
    questionInfo: {
        flex: 1,
    },
    questionPreview: {
        fontSize: 12,
        color: 'white',
        fontFamily: 'Inter-Regular',
        marginBottom: 2,
    },
    questionMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    questionScore: {
        fontSize: 10,
        fontFamily: 'Inter-SemiBold',
    },
    expandedContent: {
        paddingHorizontal: 12,
        paddingBottom: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    fullQuestion: {
        fontSize: 12,
        color: 'white',
        lineHeight: 16,
        marginBottom: 12,
        fontFamily: 'Inter-Regular',
    },
    answerSection: {
        marginBottom: 8,
    },
    sectionLabel: {
        fontSize: 10,
        fontFamily: 'Inter-SemiBold',
        color: '#00d4ff',
        marginBottom: 4,
    },
    answerText: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 14,
        fontFamily: 'Inter-Regular',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 6,
        padding: 8,
    },
    feedbackSection: {
        marginBottom: 8,
    },
    feedbackText: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 14,
        fontFamily: 'Inter-Regular',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 6,
        padding: 8,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    expectedSection: {
        marginBottom: 4,
    },
    expectedToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
    },
    expectedToggleText: {
        fontSize: 10,
        color: '#00d4ff',
        fontFamily: 'Inter-SemiBold',
    },
    expectedContent: {
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        borderRadius: 6,
        padding: 8,
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 255, 0.2)',
    },
    expectedText: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 14,
        fontFamily: 'Inter-Regular',
    },
});
