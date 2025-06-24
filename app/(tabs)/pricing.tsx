import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Zap, Crown, Star, ArrowRight, DollarSign } from 'lucide-react-native';

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
    },
];

export default function PricingTab() {
    const [selectedPlan, setSelectedPlan] = useState('pro');

    const handleSelectPlan = (planId: string) => {
        setSelectedPlan(planId);
        // Here you would integrate with RevenueCat for subscription handling
        console.log('Selected plan:', planId);
    };

    return (
        <ScrollView style={styles.container}>
            <LinearGradient
                colors={['#0a0a0a', '#1a1a2e']}
                style={styles.gradient}
            >
                {/* Header */}
                <View style={styles.header}>
                    <DollarSign size={32} color="#00d4ff" />
                    <Text style={styles.title}>Choose Your Plan</Text>
                    <Text style={styles.subtitle}>
                        Pricing based on AI token consumption. Start free, upgrade as you grow.
                    </Text>

                    {/* Token Usage Info */}
                    <View style={styles.tokenInfo}>
                        <View style={styles.tokenCard}>
                            <Text style={styles.tokenTitle}>💡 How tokens work</Text>
                            <Text style={styles.tokenDescription}>
                                • 1 interview question ≈ 50-100 tokens{'\n'}
                                • 1 answer evaluation ≈ 100-200 tokens{'\n'}
                                • Advanced features use more tokens
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Pricing Plans */}
                <View style={styles.plansContainer}>
                    {pricingPlans.map((plan) => {
                        const IconComponent = plan.icon;
                        const isSelected = selectedPlan === plan.id;

                        return (
                            <TouchableOpacity
                                key={plan.id}
                                onPress={() => handleSelectPlan(plan.id)}
                                style={[
                                    styles.planCard,
                                    isSelected && styles.planCardSelected,
                                    plan.popular && styles.planCardPopular
                                ]}
                            >
                                {plan.popular && (
                                    <View style={styles.popularBadge}>
                                        <Text style={styles.popularText}>Most Popular</Text>
                                    </View>
                                )}

                                <LinearGradient
                                    colors={plan.gradient}
                                    style={styles.planHeader}
                                >
                                    <IconComponent size={32} color="white" />
                                    <Text style={styles.planName}>{plan.name}</Text>
                                    <Text style={styles.planDescription}>{plan.description}</Text>
                                </LinearGradient>

                                <View style={styles.planContent}>
                                    <View style={styles.priceContainer}>
                                        <Text style={styles.price}>{plan.price}</Text>
                                        {plan.period !== 'forever' && (
                                            <Text style={styles.period}>/{plan.period}</Text>
                                        )}
                                    </View>

                                    <View style={styles.tokenStats}>
                                        <View style={styles.statItem}>
                                            <Text style={styles.statValue}>{plan.tokens}</Text>
                                            <Text style={styles.statLabel}>AI Tokens</Text>
                                        </View>
                                        <View style={styles.statItem}>
                                            <Text style={styles.statValue}>{plan.interviews}</Text>
                                            <Text style={styles.statLabel}>Interviews</Text>
                                        </View>
                                    </View>

                                    <View style={styles.featuresContainer}>
                                        {plan.features.map((feature, index) => (
                                            <View key={index} style={styles.featureItem}>
                                                <Check size={16} color="#10B981" />
                                                <Text style={styles.featureText}>{feature}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => handleSelectPlan(plan.id)}
                                        style={[
                                            styles.selectButton,
                                            isSelected && styles.selectButtonSelected
                                        ]}
                                    >
                                        <LinearGradient
                                            colors={isSelected ? plan.gradient : ['#F3F4F6', '#E5E7EB']}
                                            style={styles.selectButtonGradient}
                                        >
                                            <Text style={[
                                                styles.selectButtonText,
                                                isSelected && styles.selectButtonTextSelected
                                            ]}>
                                                {plan.id === 'free' ? 'Get Started' : 'Subscribe Now'}
                                            </Text>
                                            <ArrowRight
                                                size={16}
                                                color={isSelected ? 'white' : '#6B7280'}
                                            />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Additional Info */}
                <View style={styles.additionalInfo}>
                    <Text style={styles.infoTitle}>✨ All plans include:</Text>
                    <Text style={styles.infoText}>
                        • AI-powered interview questions{'\n'}
                        • Real-time feedback and scoring{'\n'}
                        • Progress tracking{'\n'}
                        • Mobile and web access{'\n'}
                        • Secure data encryption
                    </Text>
                </View>
            </LinearGradient>
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
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
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
        maxWidth: 600,
        lineHeight: 24,
        fontFamily: 'Inter-Regular',
        marginBottom: 32,
    },
    tokenInfo: {
        width: '100%',
        maxWidth: 500,
    },
    tokenCard: {
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 255, 0.2)',
    },
    tokenTitle: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: '#00d4ff',
        marginBottom: 8,
    },
    tokenDescription: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        lineHeight: 20,
        fontFamily: 'Inter-Regular',
    },
    plansContainer: {
        gap: 24,
        marginBottom: 40,
        flexDirection: 'row',
        justifyContent: "center"
    },
    planCard: {
        width : 400,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        position: 'relative',
    },
    planCardSelected: {
        borderColor: '#00d4ff',
        shadowColor: '#00d4ff',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    planCardPopular: {
        transform: [{ scale: 1.02 }],
    },
    popularBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: '#FF6B6B',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
        zIndex: 10,
    },
    popularText: {
        color: 'white',
        fontSize: 12,
        fontFamily: 'Inter-Bold',
    },
    planHeader: {
        padding: 24,
        alignItems: 'center',
    },
    planName: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginTop: 12,
        marginBottom: 4,
    },
    planDescription: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        fontFamily: 'Inter-Regular',
    },
    planContent: {
        padding: 24,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
        marginBottom: 24,
    },
    price: {
        fontSize: 48,
        fontFamily: 'Inter-Bold',
        color: 'white',
    },
    period: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: 'Inter-Regular',
    },
    tokenStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontFamily: 'Inter-Bold',
        color: '#00d4ff',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: 'Inter-Regular',
    },
    featuresContainer: {
        marginBottom: 32,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    featureText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontFamily: 'Inter-Regular',
        flex: 1,
    },
    selectButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    selectButtonSelected: {
        shadowColor: '#00d4ff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    selectButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        gap: 8,
    },
    selectButtonText: {
        fontSize: 16,
        fontFamily: 'Inter-Bold',
        color: '#6B7280',
    },
    selectButtonTextSelected: {
        color: 'white',
    },
    additionalInfo: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 40,
    },
    infoTitle: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        color: '#00d4ff',
        marginBottom: 12,
    },
    infoText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        lineHeight: 22,
        fontFamily: 'Inter-Regular',
    },
});
