import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, Plus, Send, Heart, MessageSquare, Users, CheckCircle, X } from 'lucide-react-native';
import { useAuthStore } from '../utils/stores/authStore';
import { supabase } from '../utils/supabase/client';

interface Feedback {
    id: string;
    name: string;
    role: string;
    content: string;
    rating: number;
    is_featured: boolean;
    created_at: string;
}

interface FeedbackFormData {
    name: string;
    role: string;
    content: string;
    rating: number;
}

export default function FeedbackSection() {
    const { user, profile } = useAuthStore();
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFeedbackForm, setShowFeedbackForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState<FeedbackFormData>({
        name: '',
        role: '',
        content: '',
        rating: 5,
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        fetchFeedback();
    }, []);

    useEffect(() => {
        // Pre-fill form with user data if available
        if (user && profile && showFeedbackForm) {
            setFormData(prev => ({
                ...prev,
                name: profile.full_name || prev.name,
            }));
        }
    }, [user, profile, showFeedbackForm]);

    const fetchFeedback = async () => {
        try {
            const { data, error } = await supabase
                .from('feedback')
                .select('*')
                .eq('is_approved', true)
                .order('is_featured', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) {
                console.error('Error fetching feedback:', error);
                return;
            }

            setFeedback(data || []);
        } catch (error) {
            console.error('Error fetching feedback:', error);
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.role.trim()) {
            newErrors.role = 'Role/Position is required';
        }

        if (!formData.content.trim()) {
            newErrors.content = 'Feedback content is required';
        } else if (formData.content.trim().length < 20) {
            newErrors.content = 'Feedback must be at least 20 characters long';
        }

        if (formData.rating < 1 || formData.rating > 5) {
            newErrors.rating = 'Rating must be between 1 and 5 stars';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: keyof FeedbackFormData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleSubmitFeedback = async () => {
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            const feedbackData = {
                user_id: user?.id || null,
                name: formData.name.trim(),
                role: formData.role.trim(),
                content: formData.content.trim(),
                rating: formData.rating,
                is_approved: false, // Will be reviewed by admin
                is_featured: false,
            };

            const { error } = await supabase
                .from('feedback')
                .insert(feedbackData);

            if (error) {
                throw error;
            }

            setSubmitted(true);
            setShowFeedbackForm(false);

            // Reset form
            setFormData({
                name: profile?.full_name || '',
                role: '',
                content: '',
                rating: 5,
            });

            // Show success message
            setTimeout(() => {
                setSubmitted(false);
            }, 5000);

        } catch (error) {
            console.error('Error submitting feedback:', error);
            Alert.alert(
                'Submission Failed',
                'Failed to submit your feedback. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = (rating: number, size: number = 16, interactive: boolean = false, onPress?: (rating: number) => void) => {
        return Array.from({ length: 5 }, (_, index) => (
            <TouchableOpacity
                key={index}
                onPress={() => interactive && onPress?.(index + 1)}
                disabled={!interactive}
                style={interactive ? styles.interactiveStar : undefined}
            >
                <Star
                    size={size}
                    color={index < rating ? '#FFD700' : '#374151'}
                    fill={index < rating ? '#FFD700' : 'transparent'}
                />
            </TouchableOpacity>
        ));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const renderFeedbackForm = () => (
        <View style={styles.feedbackFormContainer}>
            <View style={styles.feedbackFormCard}>
                <View style={styles.formHeader}>
                    <View style={styles.formHeaderLeft}>
                        <MessageSquare size={24} color="#00d4ff" />
                        <Text style={styles.formTitle}>Share Your Experience</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setShowFeedbackForm(false)}
                        style={styles.closeButton}
                    >
                        <X size={20} color="rgba(255, 255, 255, 0.7)" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.formSubtitle}>
                    Help others by sharing your interview preparation journey with our AI assistant
                </Text>

                {/* Name Field */}
                <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Your Name *</Text>
                    <TextInput
                        style={[styles.input, errors.name && styles.inputError]}
                        placeholder="Enter your full name"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={formData.name}
                        onChangeText={(value) => handleInputChange('name', value)}
                        editable={!submitting}
                    />
                    {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>

                {/* Role Field */}
                <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Your Role/Position *</Text>
                    <TextInput
                        style={[styles.input, errors.role && styles.inputError]}
                        placeholder="e.g., Software Engineer at Google"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={formData.role}
                        onChangeText={(value) => handleInputChange('role', value)}
                        editable={!submitting}
                    />
                    {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}
                </View>

                {/* Rating Field */}
                <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Rating *</Text>
                    <View style={styles.ratingContainer}>
                        {renderStars(formData.rating, 32, true, (rating) => handleInputChange('rating', rating))}
                        <Text style={styles.ratingText}>({formData.rating}/5)</Text>
                    </View>
                    {errors.rating && <Text style={styles.errorText}>{errors.rating}</Text>}
                </View>

                {/* Content Field */}
                <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Your Feedback *</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, errors.content && styles.inputError]}
                        placeholder="Share your experience with our AI interview assistant. How did it help you? What features did you find most valuable?"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        multiline
                        textAlignVertical="top"
                        value={formData.content}
                        onChangeText={(value) => handleInputChange('content', value)}
                        editable={!submitting}
                        maxLength={1000}
                    />
                    <Text style={styles.characterCount}>
                        {formData.content.length}/1000 characters
                    </Text>
                    {errors.content && <Text style={styles.errorText}>{errors.content}</Text>}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    onPress={handleSubmitFeedback}
                    disabled={submitting}
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                >
                    <LinearGradient
                        colors={submitting ? ['#666', '#666'] : ['#00d4ff', '#0099cc']}
                        style={styles.submitButtonGradient}
                    >
                        {submitting ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Send size={16} color="white" />
                        )}
                        <Text style={styles.submitButtonText}>
                            {submitting ? 'Submitting...' : 'Submit Feedback'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.reviewNote}>
                    Your feedback will be reviewed before being published. Thank you for helping others!
                </Text>
            </View>
        </View>
    );

    const renderSuccessMessage = () => (
        <View style={styles.successContainer}>
            <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.successGradient}
            >
                <CheckCircle size={48} color="white" />
                <Text style={styles.successTitle}>Thank You!</Text>
                <Text style={styles.successMessage}>
                    Your feedback has been submitted successfully. It will be reviewed and published soon.
                </Text>
            </LinearGradient>
        </View>
    );

    return (
        <View style={styles.feedbackSection}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.sectionTitle}>Success Stories & Feedback</Text>
                <Text style={styles.sectionSubtitle}>
                    See how our AI interview assistant has helped professionals like you land their dream jobs
                </Text>
            </View>

            {/* Success Message */}
            {submitted && renderSuccessMessage()}

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Users size={24} color="#00d4ff" />
                    <Text style={styles.statNumber}>{feedback.length}+</Text>
                    <Text style={styles.statLabel}>Happy Users</Text>
                </View>
                <View style={styles.statCard}>
                    <Star size={24} color="#FFD700" />
                    <Text style={styles.statNumber}>
                        {feedback.length > 0
                            ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
                            : '5.0'
                        }
                    </Text>
                    <Text style={styles.statLabel}>Average Rating</Text>
                </View>
                <View style={styles.statCard}>
                    <Heart size={24} color="#EF4444" />
                    <Text style={styles.statNumber}>98%</Text>
                    <Text style={styles.statLabel}>Success Rate</Text>
                </View>
            </View>

            {/* Feedback Cards */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00d4ff" />
                    <Text style={styles.loadingText}>Loading feedback...</Text>
                </View>
            ) : (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.feedbackContainer}
                >
                    {feedback.map((item) => (
                        <View key={item.id} style={styles.feedbackCard}>
                            <View style={styles.feedbackHeader}>
                                <View style={styles.feedbackInfo}>
                                    <View style={styles.nameContainer}>
                                        <Text style={styles.feedbackName}>{item.name}</Text>
                                        {item.is_featured && (
                                            <View style={styles.featuredBadge}>
                                                <Star size={12} color="white" fill="white" />
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.feedbackRole}>{item.role}</Text>
                                    <View style={styles.ratingRow}>
                                        {renderStars(item.rating)}
                                    </View>
                                </View>
                            </View>

                            <Text style={styles.feedbackContent}>{item.content}</Text>

                            <View style={styles.feedbackFooter}>
                                <Text style={styles.feedbackDate}>
                                    {formatDate(item.created_at)}
                                </Text>
                                <TouchableOpacity style={styles.likeButton}>
                                    <Heart size={14} color="#EF4444" />
                                    <Text style={styles.likeText}>Helpful</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}

                    {/* Add Feedback Card */}
                    <TouchableOpacity
                        onPress={() => setShowFeedbackForm(true)}
                        style={styles.addFeedbackCard}
                    >
                        <LinearGradient
                            colors={['#667eea', '#764ba2']}
                            style={styles.addFeedbackGradient}
                        >
                            <Plus size={48} color="white" />
                            <Text style={styles.addFeedbackTitle}>Share Your Story</Text>
                            <Text style={styles.addFeedbackSubtitle}>
                                Help others by sharing your experience
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            )}

            {/* Feedback Form Modal */}
            {showFeedbackForm && (
                <View style={styles.modalOverlay}>
                    <ScrollView
                        contentContainerStyle={styles.modalScrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {renderFeedbackForm()}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    feedbackSection: {
        paddingVertical: 80,
        backgroundColor: '#0a0a0a',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
        paddingHorizontal: 24,
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
        fontFamily: 'Inter-Regular',
        maxWidth: 600,
        lineHeight: 26,
    },
    successContainer: {
        alignItems: 'center',
        marginBottom: 40,
        paddingHorizontal: 24,
    },
    successGradient: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        borderRadius: 20,
        maxWidth: 400,
        width: '100%',
    },
    successTitle: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginTop: 16,
        marginBottom: 8,
    },
    successMessage: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        lineHeight: 22,
        fontFamily: 'Inter-Regular',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 24,
        marginBottom: 40,
        gap: 24,
    },
    statCard: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        minWidth: 100,
    },
    statNumber: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginTop: 8,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: 'Inter-Regular',
        marginTop: 16,
    },
    feedbackContainer: {
        paddingHorizontal: 24,
        gap: 24,
    },
    feedbackCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 24,
        width: 350,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    feedbackHeader: {
        marginBottom: 16,
    },
    feedbackInfo: {
        // No avatar needed for feedback
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    feedbackName: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: 'white',
    },
    featuredBadge: {
        backgroundColor: '#FFD700',
        borderRadius: 10,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    feedbackRole: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: 'Inter-Regular',
        marginBottom: 8,
    },
    ratingRow: {
        flexDirection: 'row',
        gap: 2,
    },
    feedbackContent: {
        fontSize: 16,
        color: 'white',
        lineHeight: 24,
        marginBottom: 16,
        fontFamily: 'Inter-Regular',
    },
    feedbackFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    feedbackDate: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.5)',
        fontFamily: 'Inter-Regular',
    },
    likeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    likeText: {
        color: '#EF4444',
        fontSize: 12,
        fontFamily: 'Inter-Medium',
    },
    addFeedbackCard: {
        width: 320,
        borderRadius: 20,
        overflow: 'hidden',
    },
    addFeedbackGradient: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 280,
    },
    addFeedbackTitle: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    addFeedbackSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        fontFamily: 'Inter-Regular',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        zIndex: 1000,
    },
    modalScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    feedbackFormContainer: {
        alignItems: 'center',
    },
    feedbackFormCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 32,
        width: '100%',
        maxWidth: 500,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    formHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    formHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    formTitle: {
        fontSize: 20,
        fontFamily: 'Inter-Bold',
        color: 'white',
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    formSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: 24,
        lineHeight: 20,
        fontFamily: 'Inter-Regular',
    },
    formField: {
        marginBottom: 20,
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
    inputError: {
        borderColor: '#EF4444',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    characterCount: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'right',
        marginTop: 4,
        fontFamily: 'Inter-Regular',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        marginTop: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    interactiveStar: {
        padding: 4,
    },
    ratingText: {
        fontSize: 16,
        color: 'white',
        fontFamily: 'Inter-SemiBold',
        marginLeft: 8,
    },
    submitButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    submitButtonText: {
        color: 'white',
        fontFamily: 'Inter-Bold',
        fontSize: 16,
    },
    reviewNote: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        fontStyle: 'italic',
        fontFamily: 'Inter-Regular',
    },
});
