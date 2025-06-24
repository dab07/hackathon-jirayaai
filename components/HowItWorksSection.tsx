import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const steps = [
    { step: '01', title: 'Enter Job Details', description: 'Provide your target job title, description, and required skills' },
    { step: '02', title: 'Choose Difficulty', description: 'Select from Basic, Advanced, or Adaptive interview levels' },
    { step: '03', title: 'Practice Interview', description: 'Answer AI-generated questions tailored to your role' },
    { step: '04', title: 'Get Feedback', description: 'Receive detailed analysis and improvement suggestions' }
];

export default function HowItWorksSection() {
    return (
        <View style={styles.howItWorksSection}>
            <Text style={styles.sectionTitle}>How It Works</Text>
            <View style={styles.stepsContainer}>
                {steps.map((item, index) => (
                    <View key={index} style={styles.stepCard}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>{item.step}</Text>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>{item.title}</Text>
                            <Text style={styles.stepDescription}>{item.description}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    howItWorksSection: {
        paddingVertical: 80,
        paddingHorizontal: 24,
        backgroundColor: '#111111',
    },
    sectionTitle: {
        fontSize: 36,
        fontFamily: 'Inter-Bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 16,
    },
    stepsContainer: {
        marginTop: 40,
        gap: 32,
    },
    stepCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    stepNumber: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#00d4ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 24,
    },
    stepNumberText: {
        fontSize: 18,
        fontFamily: 'Inter-Bold',
        color: 'white',
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 20,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginBottom: 8,
    },
    stepDescription: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
        lineHeight: 24,
        fontFamily: 'Inter-Regular',
    },
});
