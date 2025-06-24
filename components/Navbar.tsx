import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useAnimatedStyle,
    interpolate,
    SharedValue
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Home,
    BarChart3,
    Sparkles,
    HelpCircle,
    MessageSquare,
    Award,
    Mail,
    Play
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface FloatingNavigationProps {
    scrollY: SharedValue<number>;
    onNavigateToSection: (sectionIndex: number) => void;
    onStartInterview: () => void;
    currentSection: number;
}

const navigationItems = [
    { icon: Home, label: 'Home', sectionIndex: 0 },
    { icon: BarChart3, label: 'Stats', sectionIndex: 1 },
    { icon: Sparkles, label: 'Features', sectionIndex: 2 },
    { icon: HelpCircle, label: 'How It Works', sectionIndex: 3 },
    { icon: MessageSquare, label: 'Reviews', sectionIndex: 4 },
    { icon: Award, label: 'Get Started', sectionIndex: 5 },
    { icon: Mail, label: 'Contact', sectionIndex: 6 },
];

export default function FloatingNavigation({
                                               scrollY,
                                               onNavigateToSection,
                                               onStartInterview,
                                               currentSection
                                           }: FloatingNavigationProps) {

    const containerAnimatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [0, 10],
            [0, 1],
        );

        const translateY = interpolate(
            scrollY.value,
            [100, 200],
            [0, 0],
        );

        return {
            opacity,
            transform: [{ translateY }],
        };
    });

    return (
        <Animated.View style={[styles.container, containerAnimatedStyle]}>
            <View style={styles.navigationWrapper}>
                <LinearGradient
                    colors={['rgba(10, 10, 10, 0.95)', 'rgba(26, 26, 46, 0.95)']}
                    style={styles.navigationContainer}
                >
                    <View style={styles.navigationContent}>
                        {/* Logo/Brand */}
                        <View style={styles.brandSection}>
                            <Text style={styles.brandText}>Jiraya Ai</Text>
                        </View>

                        {/* Navigation Items */}
                        <View style={styles.navItems}>
                            {navigationItems.map((item, index) => {
                                const IconComponent = item.icon;
                                const isActive = currentSection === item.sectionIndex;

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => onNavigateToSection(item.sectionIndex)}
                                        style={[
                                            styles.navigationItem,
                                            isActive && styles.navigationItemActive
                                        ]}
                                    >
                                        {isActive && (
                                            <LinearGradient
                                                colors={['#00d4ff', '#0099cc']}
                                                style={styles.activeBackground}
                                            />
                                        )}
                                        <IconComponent
                                            size={16}
                                            color={isActive ? 'white' : 'rgba(255, 255, 255, 0.6)'}
                                        />
                                        <Text style={[
                                            styles.navItemText,
                                            { color: isActive ? 'white' : 'rgba(255, 255, 255, 0.6)' }
                                        ]}>
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                onPress={() => {/* Navigate to pricing tab */}}
                                style={styles.pricingButton}
                            >
                                <Text style={styles.pricingButtonText}>Pricing</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={onStartInterview}
                                style={styles.startButton}
                            >
                                <LinearGradient
                                    colors={['#00d4ff', '#0099cc']}
                                    style={styles.startButtonGradient}
                                >
                                    <Play size={14} color="white" />
                                    <Text style={styles.startButtonText}>Start</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </LinearGradient>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 20,
        left: 0,
        right: 0,
        zIndex: 100,
        alignItems: 'center',
    },
    navigationWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 16,
        maxWidth: width - 48,
        width: '100%',
    },
    navigationContainer: {
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 255, 0.3)',
        backdropFilter: 'blur(20px)',
    },
    navigationContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 16,
    },
    brandSection: {
        paddingRight: 8,
        borderRightWidth: 1,
        borderRightColor: 'rgba(255, 255, 255, 0.2)',
    },
    brandText: {
        fontSize: 18,
        fontFamily: 'Inter-Bold',
        color: '#00d4ff',
    },
    navItems: {
        flexDirection: 'row',
        flex: 1,
        gap: 4,
    },
    navigationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        position: 'relative',
        gap: 6,
    },
    navigationItemActive: {
        // Active styles handled by gradient background
    },
    activeBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 12,
    },
    navItemText: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingLeft: 8,
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255, 255, 255, 0.2)',
    },
    pricingButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    pricingButtonText: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
    },
    startButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    startButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 4,
    },
    startButtonText: {
        color: 'white',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
    },
});
