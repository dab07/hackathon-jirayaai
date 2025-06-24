import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, MessageSquare, Phone, MapPin, Send, CheckCircle } from 'lucide-react-native';

export default function ContactSection() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.email || !formData.message) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            setIsSubmitted(true);
            setFormData({ name: '', email: '', subject: '', message: '' });

            setTimeout(() => {
                setIsSubmitted(false);
            }, 3000);
        } catch (error) {
            Alert.alert('Error', 'Failed to send message. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <View style={styles.contactSection}>
                <View style={styles.successContainer}>
                    <LinearGradient
                        colors={['#10B981', '#059669']}
                        style={styles.successGradient}
                    >
                        <CheckCircle size={64} color="white" />
                        <Text style={styles.successTitle}>Message Sent!</Text>
                        <Text style={styles.successMessage}>
                            Thank you for reaching out. We'll get back to you within 24 hours.
                        </Text>
                    </LinearGradient>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.contactSection}>
            <View style={styles.header}>
                <Text style={styles.sectionTitle}>Get in Touch</Text>
                <Text style={styles.sectionSubtitle}>
                    Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                </Text>
            </View>

            <View style={styles.contentContainer}>
                {/* Contact Info */}
                <View style={styles.contactInfo}>
                    <Text style={styles.contactTitle}>Contact Information</Text>

                    <View style={styles.contactItem}>
                        <View style={styles.contactIconContainer}>
                            <Mail size={20} color="#00d4ff" />
                        </View>
                        <View>
                            <Text style={styles.contactLabel}>Email</Text>
                            <Text style={styles.contactValue}>support@jiraya.ai</Text>
                        </View>
                    </View>

                    <View style={styles.contactItem}>
                        <View style={styles.contactIconContainer}>
                            <Phone size={20} color="#00d4ff" />
                        </View>
                        <View>
                            <Text style={styles.contactLabel}>Phone</Text>
                            <Text style={styles.contactValue}>+91-12345 67890</Text>
                        </View>
                    </View>

                    {/*<View style={styles.contactItem}>*/}
                    {/*    <View style={styles.contactIconContainer}>*/}
                    {/*        <MapPin size={20} color="#00d4ff" />*/}
                    {/*    </View>*/}
                    {/*    <View>*/}
                    {/*        <Text style={styles.contactLabel}>Office</Text>*/}
                    {/*        <Text style={styles.contactValue}>*/}
                    {/*            123 AI Street{'\n'}*/}
                    {/*            San Francisco, CA 94105*/}
                    {/*        </Text>*/}
                    {/*    </View>*/}
                    {/*</View>*/}

                    <View style={styles.contactItem}>
                        <View style={styles.contactIconContainer}>
                            <MessageSquare size={20} color="#00d4ff" />
                        </View>
                        <View>
                            <Text style={styles.contactLabel}>Response Time</Text>
                            <Text style={styles.contactValue}>Within 48 hours</Text>
                        </View>
                    </View>
                </View>

                {/* Contact Form */}
                <View style={styles.contactForm}>
                    <Text style={styles.formTitle}>Send us a Message</Text>

                    <View style={styles.formRow}>
                        <View style={styles.formField}>
                            <Text style={styles.fieldLabel}>Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Your full name"
                                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                value={formData.name}
                                onChangeText={(value) => handleInputChange('name', value)}
                            />
                        </View>

                        <View style={styles.formField}>
                            <Text style={styles.fieldLabel}>Email *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="your.email@example.com"
                                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={formData.email}
                                onChangeText={(value) => handleInputChange('email', value)}
                            />
                        </View>
                    </View>

                    <View style={styles.formField}>
                        <Text style={styles.fieldLabel}>Subject</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="What's this about?"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            value={formData.subject}
                            onChangeText={(value) => handleInputChange('subject', value)}
                        />
                    </View>

                    <View style={styles.formField}>
                        <Text style={styles.fieldLabel}>Message *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Tell us how we can help you..."
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            multiline
                            textAlignVertical="top"
                            value={formData.message}
                            onChangeText={(value) => handleInputChange('message', value)}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                    >
                        <LinearGradient
                            colors={isSubmitting ? ['#666', '#666'] : ['#00d4ff', '#0099cc']}
                            style={styles.submitButtonGradient}
                        >
                            <Send size={20} color="white" />
                            <Text style={styles.submitButtonText}>
                                {isSubmitting ? 'Sending...' : 'Send Message'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    contactSection: {
        paddingVertical: 80,
        paddingHorizontal: 24,
        backgroundColor: '#111111',
    },
    header: {
        alignItems: 'center',
        marginBottom: 60,
    },
    sectionTitle: {
        fontSize: 36,
        fontFamily: 'Inter-Bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 16,
    },
    sectionSubtitle: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        maxWidth: 600,
        lineHeight: 28,
        fontFamily: 'Inter-Regular',
    },
    contentContainer: {
        flexDirection: 'row',
        gap: 60,
        flexWrap: 'wrap',
    },
    contactInfo: {
        flex: 1,
        minWidth: 300,
    },
    contactTitle: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginBottom: 32,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 32,
        gap: 16,
    },
    contactIconContainer: {
        width: 48,
        height: 48,
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 255, 0.2)',
    },
    contactLabel: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        color: '#00d4ff',
        marginBottom: 4,
    },
    contactValue: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        fontFamily: 'Inter-Regular',
        lineHeight: 22,
    },
    contactForm: {
        flex: 1,
        minWidth: 400,
    },
    formTitle: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginBottom: 32,
    },
    formRow: {
        flexDirection: 'row',
        gap: 16,
    },
    formField: {
        flex: 1,
        marginBottom: 24,
    },
    fieldLabel: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        color: 'white',
        marginBottom: 8,
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
    textArea: {
        height: 120,
    },
    submitButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
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
        gap: 8,
    },
    submitButtonText: {
        color: 'white',
        fontFamily: 'Inter-Bold',
        fontSize: 16,
    },
    successContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
    },
    successGradient: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
        borderRadius: 24,
        maxWidth: 500,
    },
    successTitle: {
        fontSize: 32,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginTop: 24,
        marginBottom: 16,
    },
    successMessage: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        lineHeight: 26,
        fontFamily: 'Inter-Regular',
    },
});
