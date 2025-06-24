import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface InterviewProgressProps {
    currentQuestion: number;
    totalQuestions: number;
    level: number;
}

export default function InterviewProgress({ currentQuestion, totalQuestions, level }: InterviewProgressProps) {
    const progress = (currentQuestion / totalQuestions) * 100;
    const levelColors = {
        1: ['#3B82F6', '#1D4ED8'],
        2: ['#8B5CF6', '#7C3AED'],
        3: ['#10B981', '#16A34A'],
    };

    const levelNames = {
        1: 'Basic',
        2: 'Advanced',
        3: 'Adaptive',
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.levelText}>
                    {levelNames[level as keyof typeof levelNames]} Interview
                </Text>
                <Text style={styles.progressText}>
                    {currentQuestion} of {totalQuestions}
                </Text>
            </View>

            <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                    <View style={[styles.progressBarFill, { width: `${progress}%` }]}>
                        <LinearGradient
                            colors={levelColors[level as keyof typeof levelColors] as [string, string, ...string[]]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.progressGradient}
                        />
                    </View>
                </View>
            </View>

            <Text style={styles.percentageText}>
                {Math.round(progress)}% Complete
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    levelText: {
        fontSize: 16,
        fontFamily: 'Inter-Bold',
        color: 'white',
    },
    progressText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: 'Inter-Regular',
    },
    progressBarContainer: {
        marginBottom: 8,
    },
    progressBarBackground: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        height: 8,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 8,
        overflow: 'hidden',
    },
    progressGradient: {
        height: '100%',
        width: '100%',
    },
    percentageText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        fontFamily: 'Inter-Regular',
    },
});
