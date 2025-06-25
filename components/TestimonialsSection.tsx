import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, Plus, Send, Heart } from 'lucide-react-native';

const testimonials = [
    {
        id: 1,
        name: 'Sarah Chen',
        role: 'Software Engineer at Google',
        content: 'This AI interview assistant helped me land my dream job. The questions were spot-on and the feedback was incredibly valuable. The voice feature made it feel like a real interview!',
        avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
        rating: 5,
        verified: true,
    },
    {
        id: 2,
        name: 'Michael Rodriguez',
        role: 'Product Manager at Meta',
        content: 'The adaptive difficulty feature is brilliant. It challenged me just enough to prepare for real interviews. The pricing based on tokens is fair and transparent.',
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
        rating: 5,
        verified: true,
    },
    {
        id: 3,
        name: 'Emily Johnson',
        role: 'Data Scientist at Netflix',
        content: 'I practiced with this tool for weeks before my interviews. The AI feedback helped me improve significantly. The webcam feature helped me practice my body language too.',
        avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
        rating: 5,
        verified: true,
    },
    {
        id: 4,
        name: 'David Kim',
        role: 'Frontend Developer at Spotify',
        content: 'The technical questions were challenging and realistic. Great preparation tool that actually helped me get my current position. Highly recommend the Pro plan!',
        avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
        rating: 5,
        verified: true,
    },
    {
        id: 5,
        name: 'Lisa Wang',
        role: 'UX Designer at Adobe',
        content: 'The behavioral questions helped me articulate my experiences better. The feedback was constructive and helped me improve my storytelling skills.',
        avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
        rating: 4,
        verified: true,
    },
];

export default function TestimonialsSection() {
    const [showFeedbackForm, setShowFeedbackForm] = useState(false);
    const [feedbackData, setFeedbackData] = useState({
        name: '',
        role: '',
        feedback: '',
        rating: 5,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFeedbackSubmit = async () => {
        if (!feedbackData.name || !feedbackData.role || !feedbackData.feedback) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setIsSubmitting(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            Alert.alert(
                'Thank You!',
                'Your feedback has been submitted and will be reviewed before publishing.',
                [{ text: 'OK', onPress: () => {
                        setShowFeedbackForm(false);
                        setFeedbackData({ name: '', role: '', feedback: '', rating: 5 });
                    }}]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to submit feedback. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStars = (rating: number, size: number = 16) => {
        return Array.from({ length: 5 }, (_, index) => (
            <Star
                key={index}
                size={size}
                color={index < rating ? '#FFD700' : '#374151'}
                fill={index < rating ? '#FFD700' : 'transparent'}
            />
        ));
    };

    const renderFeedbackForm = () => (
        <View style={styles.feedbackForm}>
            <View style={styles.feedbackHeader}>
                <Text style={styles.feedbackTitle}>Share Your Experience</Text>
                <Text style={styles.feedbackSubtitle}>
                    Help others by sharing your interview preparation journey
                </Text>
            </View>

            <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Your Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={feedbackData.name}
                    onChangeText={(value) => setFeedbackData(prev => ({ ...prev, name: value }))}
                />
            </View>

            <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Your Role</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g., Software Engineer at Google"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={feedbackData.role}
                    onChangeText={(value) => setFeedbackData(prev => ({ ...prev, role: value }))}
                />
            </View>

            <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Rating</Text>
                <View style={styles.ratingContainer}>
                    {Array.from({ length: 5 }, (_, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => setFeedbackData(prev => ({ ...prev, rating: index + 1 }))}
                        >
                            <Star
                                size={32}
                                color={index < feedbackData.rating ? '#FFD700' : '#374151'}
                                fill={index < feedbackData.rating ? '#FFD700' : 'transparent'}
                            />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Your Feedback</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Share your experience with our AI interview assistant..."
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    multiline
                    textAlignVertical="top"
                    value={feedbackData.feedback}
                    onChangeText={(value) => setFeedbackData(prev => ({ ...prev, feedback: value }))}
                />
            </View>

            <View style={styles.formActions}>
                <TouchableOpacity
                    onPress={() => setShowFeedbackForm(false)}
                    style={styles.cancelButton}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleFeedbackSubmit}
                    disabled={isSubmitting}
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                >
                    <LinearGradient
                        colors={isSubmitting ? ['#666', '#666'] : ['#00d4ff', '#0099cc']}
                        style={styles.submitButtonGradient}
                    >
                        <Send size={16} color="white" />
                        <Text style={styles.submitButtonText}>
                            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.testimonialsSection}>
            <View style={styles.header}>
                <Text style={styles.sectionTitle}>Success Stories</Text>
                <Text style={styles.sectionSubtitle}>
                    Join thousands of professionals who&apos;ve improved their interview skills
                </Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.testimonialsContainer}
            >
                {testimonials.map((testimonial) => (
                    <View key={testimonial.id} style={styles.testimonialCard}>
                        <View style={styles.testimonialHeader}>
                            <Image
                                source={{ uri: testimonial.avatar }}
                                style={styles.testimonialAvatar}
                            />
                            <View style={styles.testimonialInfo}>
                                <View style={styles.nameContainer}>
                                    <Text style={styles.testimonialName}>{testimonial.name}</Text>
                                    {testimonial.verified && (
                                        <View style={styles.verifiedBadge}>
                                            <Text style={styles.verifiedText}>✓</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.testimonialRole}>{testimonial.role}</Text>
                                <View style={styles.ratingRow}>
                                    {renderStars(testimonial.rating)}
                                </View>
                            </View>
                        </View>

                        <Text style={styles.testimonialContent}>{testimonial.content}</Text>

                        <View style={styles.testimonialFooter}>
                            <TouchableOpacity style={styles.likeButton}>
                                <Heart size={16} color="#FF6B6B" />
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

            {/* Feedback Form Modal */}
            {showFeedbackForm && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {renderFeedbackForm()}
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    testimonialsSection: {
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
    },
    testimonialsContainer: {
        paddingHorizontal: 24,
        gap: 24,
    },
    testimonialCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 24,
        width: 350,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    testimonialHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
        gap: 12,
    },
    testimonialAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    testimonialInfo: {
        flex: 1,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    testimonialName: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: 'white',
    },
    verifiedBadge: {
        backgroundColor: '#10B981',
        borderRadius: 10,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    verifiedText: {
        color: 'white',
        fontSize: 12,
        fontFamily: 'Inter-Bold',
    },
    testimonialRole: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: 'Inter-Regular',
        marginBottom: 8,
    },
    ratingRow: {
        flexDirection: 'row',
        gap: 2,
    },
    testimonialContent: {
        fontSize: 16,
        color: 'white',
        lineHeight: 24,
        marginBottom: 16,
        fontFamily: 'Inter-Regular',
    },
    testimonialFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    likeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    likeText: {
        color: '#FF6B6B',
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 32,
        width: '90%',
        maxWidth: 500,
        maxHeight: '80%',
    },
    feedbackForm: {
        // Form styles
    },
    feedbackHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    feedbackTitle: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginBottom: 8,
    },
    feedbackSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
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
    textArea: {
        height: 100,
    },
    ratingContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    formActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
        marginTop: 24,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
    },
    submitButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
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
});
