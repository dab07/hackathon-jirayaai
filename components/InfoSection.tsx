import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { Play, ArrowRight, CheckCircle, Brain } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface HeroSectionProps {
    heroAnimatedStyle: any;
    onStartInterview?: () => void;
}

export default function InfoSection({ heroAnimatedStyle, onStartInterview }: HeroSectionProps) {
    const router = useRouter();

    const handleStartInterview = () => {
        if (onStartInterview) {
            onStartInterview();
        } else {
            router.push('/(tabs)/interview');
        }
    };

    return (
        <View style={styles.heroSection}>
            <LinearGradient
                colors={['#0a0a0a', '#1a1a2e', '#16213e']}
                style={styles.heroGradient}
            >
                <Animated.View style={[styles.heroContent, heroAnimatedStyle]}>
                    <View style={styles.heroTextContainer}>
                        <Text style={styles.heroTitle}>
                            Ace your interview with{'\n'}
                            <Text style={styles.heroTitleGradient}>Jiraya Ai</Text>
                        </Text>
                        <Text style={styles.heroSubtitle}>
                            Practice with AI-powered interviews tailored to your dream job.
                            Get instant feedback and boost your confidence.
                        </Text>

                        <View style={styles.heroButtons}>
                            <TouchableOpacity
                                onPress={handleStartInterview}
                                style={styles.primaryButton}
                            >
                                <LinearGradient
                                    colors={['#00d4ff', '#0099cc']}
                                    style={styles.buttonGradient}
                                >
                                    <Play size={20} color="white" />
                                    <Text style={styles.primaryButtonText}>Start Interview</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            {/*<TouchableOpacity style={styles.secondaryButton}>*/}
                            {/*    <Text style={styles.secondaryButtonText}>Watch Demo</Text>*/}
                            {/*    <ArrowRight size={16} color="#00d4ff" />*/}
                            {/*</TouchableOpacity>*/}
                        </View>

                        <View style={styles.trustIndicators}>
                            <View style={styles.trustItem}>
                                <CheckCircle size={16} color="#00d4ff" />
                                <Text style={styles.trustText}>Free to start</Text>
                            </View>
                            <View style={styles.trustItem}>
                                <CheckCircle size={16} color="#00d4ff" />
                                <Text style={styles.trustText}>No credit card required</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.heroImageContainer}>
                        <Image
                            source={{ uri: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&fit=crop' }}
                            style={styles.heroImage}
                        />
                    </View>
                </Animated.View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    heroSection: {
        flex: 1,
    },
    heroGradient: {
        flex: 1,
        paddingTop: 100, // Reduced padding since no animated header
    },
    heroContent: {
        flex: 1,
        flexDirection: width > 768 ? 'row' : 'column',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    heroTextContainer: {
        flex: 1,
        maxWidth: width > 768 ? '50%' : '100%',
        marginBottom: width > 768 ? 0 : 40,
    },
    heroTitle: {
        fontSize: width > 768 ? 56 : 42,
        fontFamily: 'Inter-Bold',
        color: 'white',
        lineHeight: width > 768 ? 64 : 48,
        marginBottom: 16,
    },
    heroTitleGradient: {
        color: '#00d4ff',
    },
    heroSubtitle: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.8)',
        lineHeight: 28,
        marginBottom: 32,
        fontFamily: 'Inter-Regular',
    },
    heroButtons: {
        flexDirection: width > 768 ? 'row' : 'column',
        gap: 16,
        marginBottom: 32,
    },
    primaryButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#00d4ff',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        gap: 8,
    },
    primaryButtonText: {
        color: 'white',
        fontFamily: 'Inter-Bold',
        fontSize: 16,
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderWidth: 1,
        borderColor: '#00d4ff',
        borderRadius: 12,
        gap: 8,
    },
    secondaryButtonText: {
        color: '#00d4ff',
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
    },
    trustIndicators: {
        flexDirection: 'row',
        gap: 24,
    },
    trustItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    trustText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
    heroImageContainer: {
        flex: 1,
        maxWidth: width > 768 ? '50%' : '100%',
        alignItems: 'center',
        position: 'relative',
    },
    heroImage: {
        width: width > 768 ? 400 : 300,
        height: width > 768 ? 500 : 375,
        borderRadius: 20,
    },
    floatingCard: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 255, 0.3)',
    },
    floatingCardText: {
        color: 'white',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
    },
});
