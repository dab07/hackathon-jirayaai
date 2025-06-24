import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Check, Star, Zap, Crown } from 'lucide-react-native';

interface Plan {
    id: string;
    name: string;
    price: string;
    period: string;
    tokens: string;
    interviews: string;
    description: string;
    features: string[];
    gradient: string[];
    icon: any;
    popular: boolean;
    tokensLimit: number;
}

interface PlanSelectionModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSelectPlan: (planId: string) => void;
    currentPlan: string;
    loading: boolean;
    plans: Plan[];
}

export default function PlanSelectionModal({
                                               isVisible,
                                               onClose,
                                               onSelectPlan,
                                               currentPlan,
                                               loading,
                                               plans,
                                           }: PlanSelectionModalProps) {
    const [selectedPlan, setSelectedPlan] = useState(currentPlan);

    const handleSelectPlan = () => {
        if (selectedPlan !== currentPlan) {
            onSelectPlan(selectedPlan);
        } else {
            onClose();
        }
    };

    const isUpgrade = (planId: string) => {
        const planOrder = { free: 0, pro: 1, enterprise: 2 };
        return planOrder[planId as keyof typeof planOrder] > planOrder[currentPlan as keyof typeof planOrder];
    };

    const isDowngrade = (planId: string) => {
        const planOrder = { free: 0, pro: 1, enterprise: 2 };
        return planOrder[planId as keyof typeof planOrder] < planOrder[currentPlan as keyof typeof planOrder];
    };

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <LinearGradient
                    colors={['#00d4ff', '#0099cc']}
                    style={styles.header}
                >
                    <View style={styles.headerContent}>
                        <Text style={styles.title}>Choose Your Plan</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.subtitle}>
                        Select the plan that best fits your interview preparation needs
                    </Text>
                </LinearGradient>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {plans.map((plan) => {
                        const IconComponent = plan.icon;
                        const isSelected = selectedPlan === plan.id;
                        const isCurrent = currentPlan === plan.id;

                        return (
                            <TouchableOpacity
                                key={plan.id}
                                onPress={() => setSelectedPlan(plan.id)}
                                style={[
                                    styles.planCard,
                                    isSelected && styles.planCardSelected,
                                    isCurrent && styles.planCardCurrent,
                                ]}
                            >
                                {plan.popular && (
                                    <View style={styles.popularBadge}>
                                        <Text style={styles.popularText}>Most Popular</Text>
                                    </View>
                                )}

                                {isCurrent && (
                                    <View style={styles.currentBadge}>
                                        <Text style={styles.currentText}>Current Plan</Text>
                                    </View>
                                )}

                                <LinearGradient
                                    colors={isSelected ? plan.gradient : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.1)']}
                                    style={styles.planGradient}
                                >
                                    <View style={styles.planHeader}>
                                        <View style={styles.planIconContainer}>
                                            <IconComponent size={24} color={isSelected ? 'white' : plan.gradient[0]} />
                                        </View>
                                        <View style={styles.planTitleContainer}>
                                            <Text style={[
                                                styles.planName,
                                                { color: isSelected ? 'white' : 'white' }
                                            ]}>
                                                {plan.name}
                                            </Text>
                                            <Text style={[
                                                styles.planDescription,
                                                { color: isSelected ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)' }
                                            ]}>
                                                {plan.description}
                                            </Text>
                                        </View>
                                        {isSelected && (
                                            <View style={styles.selectedIndicator}>
                                                <Check size={20} color="white" />
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.priceContainer}>
                                        <Text style={[
                                            styles.price,
                                            { color: isSelected ? 'white' : 'white' }
                                        ]}>
                                            {plan.price}
                                        </Text>
                                        {plan.period !== 'forever' && (
                                            <Text style={[
                                                styles.period,
                                                { color: isSelected ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.6)' }
                                            ]}>
                                                /{plan.period}
                                            </Text>
                                        )}
                                    </View>

                                    <View style={styles.tokenStats}>
                                        <View style={styles.statItem}>
                                            <Text style={[
                                                styles.statValue,
                                                { color: isSelected ? 'white' : plan.gradient[0] }
                                            ]}>
                                                {plan.tokens}
                                            </Text>
                                            <Text style={[
                                                styles.statLabel,
                                                { color: isSelected ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.6)' }
                                            ]}>
                                                AI Tokens
                                            </Text>
                                        </View>
                                        <View style={styles.statDivider} />
                                        <View style={styles.statItem}>
                                            <Text style={[
                                                styles.statValue,
                                                { color: isSelected ? 'white' : plan.gradient[0] }
                                            ]}>
                                                {plan.interviews}
                                            </Text>
                                            <Text style={[
                                                styles.statLabel,
                                                { color: isSelected ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.6)' }
                                            ]}>
                                                Interviews
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.featuresContainer}>
                                        {plan.features.slice(0, 4).map((feature, index) => (
                                            <View key={index} style={styles.featureItem}>
                                                <Check size={14} color={isSelected ? 'white' : '#10B981'} />
                                                <Text style={[
                                                    styles.featureText,
                                                    { color: isSelected ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.8)' }
                                                ]}>
                                                    {feature}
                                                </Text>
                                            </View>
                                        ))}
                                        {plan.features.length > 4 && (
                                            <Text style={[
                                                styles.moreFeatures,
                                                { color: isSelected ? 'white' : plan.gradient[0] }
                                            ]}>
                                                +{plan.features.length - 4} more features
                                            </Text>
                                        )}
                                    </View>

                                    {/* Plan Change Indicator */}
                                    {selectedPlan === plan.id && selectedPlan !== currentPlan && (
                                        <View style={styles.changeIndicator}>
                                            <Text style={styles.changeIndicatorText}>
                                                {isUpgrade(plan.id) ? '⬆️ Upgrade' : isDowngrade(plan.id) ? '⬇️ Downgrade' : ''}
                                            </Text>
                                        </View>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.cancelButton}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleSelectPlan}
                        disabled={loading}
                        style={[
                            styles.confirmButton,
                            loading && styles.confirmButtonDisabled,
                            selectedPlan === currentPlan && styles.confirmButtonSame,
                        ]}
                    >
                        <LinearGradient
                            colors={
                                selectedPlan === currentPlan
                                    ? ['#6B7280', '#4B5563']
                                    : loading
                                        ? ['#666', '#666']
                                        : ['#00d4ff', '#0099cc']
                            }
                            style={styles.confirmButtonGradient}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text style={styles.confirmButtonText}>
                                    {selectedPlan === currentPlan
                                        ? 'Current Plan'
                                        : isUpgrade(selectedPlan)
                                            ? 'Upgrade Plan'
                                            : isDowngrade(selectedPlan)
                                                ? 'Downgrade Plan'
                                                : 'Select Plan'
                                    }
                                </Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    header: {
        paddingVertical: 20,
        paddingHorizontal: 24,
        paddingTop: 60,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        color: 'white',
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        fontFamily: 'Inter-Regular',
        lineHeight: 22,
    },
    content: {
        flex: 1,
        padding: 24,
    },
    planCard: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.1)',
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
    planCardCurrent: {
        borderColor: '#10B981',
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
    currentBadge: {
        position: 'absolute',
        top: 16,
        left: 16,
        backgroundColor: '#10B981',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
        zIndex: 10,
    },
    currentText: {
        color: 'white',
        fontSize: 12,
        fontFamily: 'Inter-Bold',
    },
    planGradient: {
        padding: 24,
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    planIconContainer: {
        width: 48,
        height: 48,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    planTitleContainer: {
        flex: 1,
    },
    planName: {
        fontSize: 20,
        fontFamily: 'Inter-Bold',
        marginBottom: 4,
    },
    planDescription: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
    selectedIndicator: {
        width: 32,
        height: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 16,
    },
    price: {
        fontSize: 32,
        fontFamily: 'Inter-Bold',
    },
    period: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
    },
    tokenStats: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        marginHorizontal: 16,
    },
    statValue: {
        fontSize: 18,
        fontFamily: 'Inter-Bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
    },
    featuresContainer: {
        marginBottom: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    featureText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        flex: 1,
    },
    moreFeatures: {
        fontSize: 12,
        fontFamily: 'Inter-SemiBold',
        textAlign: 'center',
        marginTop: 8,
    },
    changeIndicator: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        alignSelf: 'center',
    },
    changeIndicatorText: {
        color: 'white',
        fontSize: 12,
        fontFamily: 'Inter-Bold',
    },
    footer: {
        flexDirection: 'row',
        padding: 24,
        gap: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    cancelButton: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    cancelButtonText: {
        color: 'white',
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
    },
    confirmButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    confirmButtonDisabled: {
        opacity: 0.6,
    },
    confirmButtonSame: {
        opacity: 0.7,
    },
    confirmButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButtonText: {
        color: 'white',
        fontFamily: 'Inter-Bold',
        fontSize: 16,
    },
});
