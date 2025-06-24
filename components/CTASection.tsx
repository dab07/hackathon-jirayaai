import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Award, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface CTASectionProps {
    onStartInterview?: () => void;
}

export default function CTASection({ onStartInterview }: CTASectionProps) {
    const router = useRouter();

    const handleStartInterview = () => {
        if (onStartInterview) {
            onStartInterview();
        } else {
            router.push('/(tabs)/interview');
        }
    };

    return (
        <View style={styles.ctaSection}>
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.ctaGradient}
            >
                <Award size={48} color="white" />
                <Text style={styles.ctaTitle}>Ready to Ace Your Interview?</Text>
                <Text style={styles.ctaSubtitle}>
                    Join thousands of professionals who have improved their interview skills
                </Text>
                <TouchableOpacity
                    onPress={handleStartInterview}
                    style={styles.ctaButton}
                >
                    <Text style={styles.ctaButtonText}>Start Your Journey</Text>
                    <ArrowRight size={20} color="#667eea" />
                </TouchableOpacity>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    ctaSection: {
        margin: 24,
        borderRadius: 24,
        overflow: 'hidden',
    },
    ctaGradient: {
        paddingVertical: 60,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    ctaTitle: {
        fontSize: 32,
        fontFamily: 'Inter-Bold',
        color: 'white',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 8,
    },
    ctaSubtitle: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        marginBottom: 32,
        fontFamily: 'Inter-Regular',
    },
    ctaButton: {
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        gap: 8,
    },
    ctaButtonText: {
        color: '#667eea',
        fontFamily: 'Inter-Bold',
        fontSize: 16,
    },
});
