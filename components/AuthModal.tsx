import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Mail, Lock, User, Eye, EyeOff, CheckCircle } from 'lucide-react-native';
import { useAuthStore } from '../utils/stores/authStore';

interface AuthModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialMode?: 'signin' | 'signup';
}

export default function AuthModal({ isVisible, onClose, onSuccess, initialMode = 'signin' }: AuthModalProps) {
    const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [showEmailVerification, setShowEmailVerification] = useState(false);

    const { signIn, signUp, loading } = useAuthStore();

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setFullName('');
        setShowPassword(false);
        setErrors({});
        setShowEmailVerification(false);
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        // Email validation
        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email';
        }

        // Password validation
        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        // Full name validation for signup
        if (mode === 'signup' && !fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            let result;

            if (mode === 'signin') {
                result = await signIn(email, password);
            } else {
                result = await signUp(email, password, fullName);
            }

            if (result.error) {
                // Check if it's an email confirmation message
                if (result.error.includes('check your email') || result.error.includes('confirm')) {
                    setShowEmailVerification(true);
                    return;
                } else {
                    Alert.alert('Error', result.error);
                }
            } else {
                resetForm();
                onClose();
                onSuccess?.();

                if (mode === 'signup') {
                    // Show email verification message for successful signup
                    setShowEmailVerification(true);
                    setTimeout(() => {
                        setShowEmailVerification(false);
                        Alert.alert(
                            'Account Created! 🎉',
                            'Welcome to Jiraya! Your account has been created successfully. You can now start practicing interviews with 1,000 free AI tokens!'
                        );
                    }, 3000);
                }
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        }
    };

    const switchMode = () => {
        setMode(mode === 'signin' ? 'signup' : 'signin');
        setErrors({});
        setShowEmailVerification(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // Email Verification Success Component
    const EmailVerificationMessage = () => (
        <View style={styles.emailVerificationContainer}>
            <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.emailVerificationGradient}
            >
                <CheckCircle size={64} color="white" />
                <Text style={styles.emailVerificationTitle}>Check Your Email!</Text>
                <Text style={styles.emailVerificationMessage}>
                    We&apos;ve sent a verification link to:
                </Text>
                <Text style={styles.emailVerificationEmail}>{email}</Text>
                <Text style={styles.emailVerificationInstructions}>
                    Please click the link in your email to verify your account. Once verified, you can sign in and start practicing interviews!
                </Text>

                <TouchableOpacity
                    onPress={() => {
                        setShowEmailVerification(false);
                        setMode('signin');
                    }}
                    style={styles.emailVerificationButton}
                >
                    <Text style={styles.emailVerificationButtonText}>
                        Continue to Sign In
                    </Text>
                </TouchableOpacity>
            </LinearGradient>
        </View>
    );

    if (showEmailVerification) {
        return (
            <Modal
                visible={isVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={handleClose}
            >
                <View style={styles.container}>
                    <EmailVerificationMessage />
                </View>
            </Modal>
        );
    }

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
                <LinearGradient
                    colors={['#00d4ff', '#0099cc']}
                    style={styles.header}
                >
                    <View style={styles.headerContent}>
                        <Text style={styles.title}>
                            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
                        </Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <X size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.subtitle}>
                        {mode === 'signin'
                            ? 'Sign in to continue your interview practice'
                            : 'Join thousands of professionals improving their interview skills'
                        }
                    </Text>
                </LinearGradient>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Sign Up Form */}
                    {mode === 'signup' && (
                        <View style={styles.fieldContainer}>
                            <View style={styles.labelContainer}>
                                <User size={20} color="#00d4ff" />
                                <Text style={styles.label}>Full Name</Text>
                            </View>
                            <TextInput
                                style={[styles.input, errors.fullName && styles.inputError]}
                                placeholder="Enter your full name"
                                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                value={fullName}
                                onChangeText={(text) => {
                                    setFullName(text);
                                    if (errors.fullName) {
                                        setErrors(prev => ({ ...prev, fullName: '' }));
                                    }
                                }}
                                autoCapitalize="words"
                                editable={!loading}
                            />
                            {errors.fullName && (
                                <Text style={styles.errorText}>{errors.fullName}</Text>
                            )}
                        </View>
                    )}

                    {/* Email Field */}
                    <View style={styles.fieldContainer}>
                        <View style={styles.labelContainer}>
                            <Mail size={20} color="#00d4ff" />
                            <Text style={styles.label}>Email</Text>
                        </View>
                        <TextInput
                            style={[styles.input, errors.email && styles.inputError]}
                            placeholder="Enter your email"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (errors.email) {
                                    setErrors(prev => ({ ...prev, email: '' }));
                                }
                            }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!loading}
                        />
                        {errors.email && (
                            <Text style={styles.errorText}>{errors.email}</Text>
                        )}
                    </View>

                    {/* Password Field */}
                    <View style={styles.fieldContainer}>
                        <View style={styles.labelContainer}>
                            <Lock size={20} color="#00d4ff" />
                            <Text style={styles.label}>Password</Text>
                        </View>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={[styles.passwordInput, errors.password && styles.inputError]}
                                placeholder={mode === 'signin' ? 'Enter your password' : 'Create a password (min. 6 characters)'}
                                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                value={password}
                                onChangeText={(text) => {
                                    setPassword(text);
                                    if (errors.password) {
                                        setErrors(prev => ({ ...prev, password: '' }));
                                    }
                                }}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!loading}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeButton}
                            >
                                {showPassword ? (
                                    <EyeOff size={20} color="rgba(255, 255, 255, 0.6)" />
                                ) : (
                                    <Eye size={20} color="rgba(255, 255, 255, 0.6)" />
                                )}
                            </TouchableOpacity>
                        </View>
                        {errors.password && (
                            <Text style={styles.errorText}>{errors.password}</Text>
                        )}
                    </View>

                    {/* Benefits for Sign Up */}
                    {mode === 'signup' && (
                        <View style={styles.benefitsContainer}>
                            <Text style={styles.benefitsTitle}>What you&apos;ll get:</Text>
                            <View style={styles.benefitsList}>
                                <Text style={styles.benefitItem}>✨ 1,000 free AI tokens</Text>
                                <Text style={styles.benefitItem}>🎯 2-3 complete interview sessions</Text>
                                <Text style={styles.benefitItem}>📊 Detailed performance feedback</Text>
                                <Text style={styles.benefitItem}>🚀 Progress tracking</Text>
                            </View>
                        </View>
                    )}

                    {/* Submit Button */}
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={loading}
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    >
                        <LinearGradient
                            colors={loading ? ['#666', '#666'] : ['#00d4ff', '#0099cc']}
                            style={styles.submitButtonGradient}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                                </Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Switch Mode */}
                    <View style={styles.switchContainer}>
                        <Text style={styles.switchText}>
                            {mode === 'signin'
                                ? "Don't have an account? "
                                : "Already have an account? "
                            }
                        </Text>
                        <TouchableOpacity onPress={switchMode} disabled={loading}>
                            <Text style={styles.switchLink}>
                                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Terms for Sign Up */}
                    {mode === 'signup' && (
                        <Text style={styles.termsText}>
                            By creating an account, you agree to our Terms of Service and Privacy Policy.
                        </Text>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
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
    fieldContainer: {
        marginBottom: 20,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    label: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: 'white',
    },
    input: {
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: 'white',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    inputError: {
        borderColor: '#EF4444',
    },
    passwordContainer: {
        position: 'relative',
    },
    passwordInput: {
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        padding: 16,
        paddingRight: 50,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: 'white',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    eyeButton: {
        position: 'absolute',
        right: 16,
        top: 16,
        padding: 4,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        marginTop: 4,
    },
    benefitsContainer: {
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 255, 0.2)',
    },
    benefitsTitle: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: '#00d4ff',
        marginBottom: 12,
    },
    benefitsList: {
        gap: 8,
    },
    benefitItem: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        fontFamily: 'Inter-Regular',
    },
    submitButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    submitButtonText: {
        color: 'white',
        fontFamily: 'Inter-Bold',
        fontSize: 16,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    switchText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
    switchLink: {
        color: '#00d4ff',
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
    },
    termsText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        lineHeight: 18,
        fontFamily: 'Inter-Regular',
    },
    emailVerificationContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emailVerificationGradient: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        borderRadius: 24,
        maxWidth: 400,
        width: '100%',
    },
    emailVerificationTitle: {
        fontSize: 28,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginTop: 24,
        marginBottom: 16,
        textAlign: 'center',
    },
    emailVerificationMessage: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        marginBottom: 8,
        fontFamily: 'Inter-Regular',
    },
    emailVerificationEmail: {
        fontSize: 16,
        color: 'white',
        fontFamily: 'Inter-Bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    emailVerificationInstructions: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 32,
        fontFamily: 'Inter-Regular',
    },
    emailVerificationButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    emailVerificationButtonText: {
        color: 'white',
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
    },
});
