import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    StyleSheet,
    Dimensions,
    Modal,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Plus, Minus, Briefcase, Clock, Code, FileText, Upload, File, CheckCircle, AlertCircle } from 'lucide-react-native';
import { parseResumeFile, isValidResumeFile, ParsedResume } from '../utils/resumeParser';

const { width } = Dimensions.get('window');

interface InterviewModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    loading?: boolean;
}

export default function InterviewModal({ isVisible, onClose, onSubmit, loading = false }: InterviewModalProps) {
    const [jobTitle, setJobTitle] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [yearsExperience, setYearsExperience] = useState('0');
    const [skillInput, setSkillInput] = useState('');
    const [skills, setSkills] = useState<string[]>([]);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Resume upload states
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [resumeText, setResumeText] = useState<string>('');
    const [resumeUploading, setResumeUploading] = useState(false);
    const [resumeError, setResumeError] = useState<string>('');
    const [resumeParsed, setResumeParsed] = useState<ParsedResume | null>(null);

    const addSkill = () => {
        if (skillInput.trim() && !skills.includes(skillInput.trim())) {
            setSkills([...skills, skillInput.trim()]);
            setSkillInput('');
            // Clear skill error if it exists
            if (errors.skills) {
                setErrors(prev => ({ ...prev, skills: '' }));
            }
        }
    };

    const removeSkill = (index: number) => {
        const newSkills = skills.filter((_, i) => i !== index);
        setSkills(newSkills);
    };

    const handleResumeUpload = async (event: any) => {
        if (Platform.OS !== 'web') {
            Alert.alert('Not Supported', 'Resume upload is only supported on web platform');
            return;
        }

        const file = event.target.files?.[0];
        if (!file) return;

        // Reset previous states
        setResumeError('');
        setResumeFile(null);
        setResumeParsed(null);

        // Validate file
        if (!isValidResumeFile(file)) {
            setResumeError('Please upload a valid PDF, TXT, DOC, or DOCX file (max 10MB)');
            return;
        }

        setResumeUploading(true);

        try {
            // Parse the resume file
            const parsedResume = await parseResumeFile(file);

            setResumeFile(file);
            setResumeParsed(parsedResume);
            setResumeText(parsedResume.text);

            // Auto-fill some fields if they're empty
            if (!jobTitle && parsedResume.text) {
                // Try to extract job title from resume (basic implementation)
                const titleMatch = parsedResume.text.match(/(?:seeking|looking for|applying for|interested in)\s+([^.\n]+)/i);
                if (titleMatch) {
                    setJobTitle(titleMatch[1].trim());
                }
            }

            Alert.alert(
                'Resume Uploaded Successfully!',
                `Your resume has been processed. ${parsedResume.text.length} characters extracted. This will help generate more personalized interview questions.`
            );

        } catch (error) {
            console.error('Resume upload error:', error);
            setResumeError(error instanceof Error ? error.message : 'Failed to process resume');
        } finally {
            setResumeUploading(false);
        }
    };

    const removeResume = () => {
        setResumeFile(null);
        setResumeParsed(null);
        setResumeText('');
        setResumeError('');

        // Reset file input
        const fileInput = document.getElementById('resume-upload') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const resetForm = () => {
        setJobTitle('');
        setJobDescription('');
        setYearsExperience('0');
        setSkills([]);
        setSkillInput('');
        setErrors({});
        removeResume();
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!jobTitle.trim()) {
            newErrors.jobTitle = 'Job title is required';
        }

        if (!jobDescription.trim()) {
            newErrors.jobDescription = 'Job description is required';
        } else if (jobDescription.trim().length < 0) {
            newErrors.jobDescription = 'Job description should be at least 1 characters';
        }

        if (skills.length === 0) {
            newErrors.skills = 'At least one skill is required';
        }

        const experience = parseInt(yearsExperience);
        if (isNaN(experience) || experience < 0) {
            newErrors.yearsExperience = 'Please enter a valid number of years';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        const data = {
            jobTitle: jobTitle.trim(),
            jobDescription: jobDescription.trim(),
            skills,
            yearsExperience: parseInt(yearsExperience) || 0,
            resumeText: resumeText || null,
            resumeFilename: resumeParsed?.filename || null,
        };

        try {
            await onSubmit(data);
            resetForm();
        } catch (error) {
            console.error('Error submitting interview:', error);
            Alert.alert('Error', 'Failed to start interview. Please try again.');
        }
    };

    const handleClose = () => {
        if (!loading) {
            resetForm();
            onClose();
        }
    };

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <LinearGradient
                    colors={['#00d4ff', '#0099cc']}
                    style={styles.header}
                >
                    <View style={styles.headerContent}>
                        <View style={styles.headerLeft}>
                            <Briefcase size={24} color="white" />
                            <Text style={styles.title}>Start Your AI Interview</Text>
                        </View>
                        {!loading && (
                            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                                <X size={24} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={styles.subtitle}>
                        Tell us about the position you're preparing for
                    </Text>
                </LinearGradient>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Resume Upload Section */}
                    {Platform.OS === 'web' && (
                        <View style={styles.fieldContainer}>
                            <View style={styles.labelContainer}>
                                <Upload size={20} color="#00d4ff" />
                                <Text style={styles.label}>Upload Resume (Optional)</Text>
                            </View>

                            {!resumeParsed ? (
                                <View style={styles.uploadContainer}>
                                    <input
                                        id="resume-upload"
                                        type="file"
                                        accept=".pdf,.txt,.doc,.docx"
                                        onChange={handleResumeUpload}
                                        style={{ display: 'none' }}
                                        disabled={loading || resumeUploading}
                                    />

                                    <TouchableOpacity
                                        onPress={() => {
                                            const input = document.getElementById('resume-upload') as HTMLInputElement;
                                            input?.click();
                                        }}
                                        disabled={loading || resumeUploading}
                                        style={[
                                            styles.uploadButton,
                                            (loading || resumeUploading) && styles.uploadButtonDisabled
                                        ]}
                                    >
                                        <LinearGradient
                                            colors={
                                                loading || resumeUploading
                                                    ? ['#666', '#666']
                                                    : ['rgba(0, 212, 255, 0.1)', 'rgba(0, 212, 255, 0.2)']
                                            }
                                            style={styles.uploadButtonGradient}
                                        >
                                            {resumeUploading ? (
                                                <>
                                                    <ActivityIndicator color="#00d4ff" size="small" />
                                                    <Text style={styles.uploadButtonText}>Processing Resume...</Text>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload size={24} color="#00d4ff" />
                                                    <Text style={styles.uploadButtonText}>Upload Resume</Text>
                                                    <Text style={styles.uploadButtonSubtext}>
                                                        PDF, TXT, DOC, DOCX (max 3MB)
                                                    </Text>
                                                </>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.resumePreview}>
                                    <View style={styles.resumeInfo}>
                                        <CheckCircle size={20} color="#10B981" />
                                        <View style={styles.resumeDetails}>
                                            <Text style={styles.resumeFilename}>{resumeParsed.filename}</Text>
                                            <Text style={styles.resumeStats}>
                                                {Math.round(resumeParsed.fileSize / 1024)}KB • {resumeParsed.text.length} characters extracted
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={removeResume}
                                            style={styles.removeResumeButton}
                                            disabled={loading}
                                        >
                                            <X size={16} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {resumeError && (
                                <View style={styles.errorContainer}>
                                    <AlertCircle size={16} color="#EF4444" />
                                    <Text style={styles.errorText}>{resumeError}</Text>
                                </View>
                            )}

                            <Text style={styles.helpText}>
                                💡 Uploading your resume will help generate 2-3 personalized questions based on your experience
                            </Text>
                        </View>
                    )}

                    {/* Job Title */}
                    <View style={styles.fieldContainer}>
                        <View style={styles.labelContainer}>
                            <Briefcase size={20} color="#00d4ff" />
                            <Text style={styles.label}>Job Title *</Text>
                        </View>
                        <TextInput
                            style={[styles.input, errors.jobTitle && styles.inputError]}
                            placeholder="e.g. Senior Frontend Developer"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            value={jobTitle}
                            onChangeText={(text) => {
                                setJobTitle(text);
                                if (errors.jobTitle) {
                                    setErrors(prev => ({ ...prev, jobTitle: '' }));
                                }
                            }}
                            editable={!loading}
                        />
                        {errors.jobTitle && (
                            <Text style={styles.errorText}>{errors.jobTitle}</Text>
                        )}
                    </View>

                    {/* Years of Experience */}
                    <View style={styles.fieldContainer}>
                        <View style={styles.labelContainer}>
                            <Clock size={20} color="#00d4ff" />
                            <Text style={styles.label}>Years of Experience *</Text>
                        </View>
                        <TextInput
                            style={[styles.input, errors.yearsExperience && styles.inputError]}
                            placeholder="0"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            keyboardType="numeric"
                            value={yearsExperience}
                            onChangeText={(text) => {
                                setYearsExperience(text);
                                if (errors.yearsExperience) {
                                    setErrors(prev => ({ ...prev, yearsExperience: '' }));
                                }
                            }}
                            editable={!loading}
                        />
                        {errors.yearsExperience && (
                            <Text style={styles.errorText}>{errors.yearsExperience}</Text>
                        )}
                    </View>

                    {/* Skills */}
                    <View style={styles.fieldContainer}>
                        <View style={styles.labelContainer}>
                            <Code size={20} color="#00d4ff" />
                            <Text style={styles.label}>Required Skills *</Text>
                        </View>
                        <View style={styles.skillInputContainer}>
                            <TextInput
                                style={[styles.input, styles.skillInput, errors.skills && styles.inputError]}
                                placeholder="Add a skill (e.g. React, Python, AWS)"
                                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                value={skillInput}
                                onChangeText={setSkillInput}
                                onSubmitEditing={addSkill}
                                editable={!loading}
                            />
                            <TouchableOpacity
                                onPress={addSkill}
                                style={[styles.addButton, loading && styles.disabledButton]}
                                disabled={loading}
                            >
                                <Plus size={20} color="white" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.skillsContainer}>
                            {skills.map((skill, index) => (
                                <View key={index} style={styles.skillTag}>
                                    <Text style={styles.skillText}>{skill}</Text>
                                    {!loading && (
                                        <TouchableOpacity onPress={() => removeSkill(index)}>
                                            <Minus size={16} color="#00d4ff" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </View>
                        {errors.skills && (
                            <Text style={styles.errorText}>{errors.skills}</Text>
                        )}
                    </View>

                    {/* Job Description */}
                    <View style={styles.fieldContainer}>
                        <View style={styles.labelContainer}>
                            <FileText size={20} color="#00d4ff" />
                            <Text style={styles.label}>Job Description *</Text>
                        </View>
                        <TextInput
                            style={[styles.input, styles.textArea, errors.jobDescription && styles.inputError]}
                            placeholder="Describe the role, responsibilities, and requirements..."
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            multiline
                            textAlignVertical="top"
                            value={jobDescription}
                            onChangeText={(text) => {
                                setJobDescription(text);
                                if (errors.jobDescription) {
                                    setErrors(prev => ({ ...prev, jobDescription: '' }));
                                }
                            }}
                            editable={!loading}
                        />
                        {errors.jobDescription && (
                            <Text style={styles.errorText}>{errors.jobDescription}</Text>
                        )}
                    </View>

                    {/* Info Card */}
                    <View style={styles.infoCard}>
                        <Text style={styles.infoTitle}>💡 Pro Tips</Text>
                        <Text style={styles.infoText}>
                            • Upload your resume for personalized questions based on your experience{'\n'}
                            • The more detailed your job description, the better our AI can tailor questions{'\n'}
                            • Include specific technologies and frameworks in your skills list
                        </Text>
                    </View>
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
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
                                <>
                                    <ActivityIndicator color="white" size="small" />
                                    <Text style={styles.submitButtonText}>Creating Interview...</Text>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.submitButtonText}>Start Interview</Text>
                                    <Briefcase size={20} color="white" />
                                </>
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
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontFamily: 'Inter-Bold',
        color: 'white',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        fontFamily: 'Inter-Regular',
        lineHeight: 22,
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    content: {
        flex: 1,
        padding: 24,
    },
    fieldContainer: {
        marginBottom: 24,
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
    errorText: {
        color: '#EF4444',
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        marginTop: 4,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    textArea: {
        height: 120,
    },
    skillInputContainer: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 8,
    },
    skillInput: {
        flex: 1,
    },
    addButton: {
        backgroundColor: '#00d4ff',
        borderRadius: 12,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.6,
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    skillTag: {
        backgroundColor: 'rgba(0, 212, 255, 0.2)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 255, 0.3)',
    },
    skillText: {
        color: '#00d4ff',
        fontFamily: 'Inter-Medium',
        fontSize: 14,
    },
    uploadContainer: {
        marginBottom: 12,
    },
    uploadButton: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(0, 212, 255, 0.3)',
        borderStyle: 'dashed',
    },
    uploadButtonDisabled: {
        opacity: 0.6,
    },
    uploadButtonGradient: {
        paddingVertical: 32,
        paddingHorizontal: 24,
        alignItems: 'center',
        gap: 8,
    },
    uploadButtonText: {
        color: '#00d4ff',
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
    },
    uploadButtonSubtext: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontFamily: 'Inter-Regular',
        fontSize: 12,
    },
    resumePreview: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
        marginBottom: 12,
    },
    resumeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    resumeDetails: {
        flex: 1,
    },
    resumeFilename: {
        color: '#10B981',
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        marginBottom: 2,
    },
    resumeStats: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: 'Inter-Regular',
        fontSize: 12,
    },
    removeResumeButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    helpText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
        fontFamily: 'Inter-Regular',
        fontStyle: 'italic',
    },
    infoCard: {
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 255, 0.2)',
        marginBottom: 24,
    },
    infoTitle: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: '#00d4ff',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        lineHeight: 20,
        fontFamily: 'Inter-Regular',
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    submitButton: {
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
        paddingHorizontal: 24,
        gap: 8,
    },
    submitButtonText: {
        color: 'white',
        fontFamily: 'Inter-Bold',
        fontSize: 16,
    },
});
