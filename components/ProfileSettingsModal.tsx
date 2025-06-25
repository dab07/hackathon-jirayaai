import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    Alert,
    ActivityIndicator,
    Platform,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    X,
    User,
    Mail,
    Lock,
    Camera,
    Check,
    AlertCircle,
    Eye,
    EyeOff,
    Save
} from 'lucide-react-native';
import { useAuthStore } from '../utils/stores/authStore';
import { supabase } from '../utils/supabase/client';

interface ProfileSettingsModalProps {
    isVisible: boolean;
    onClose: () => void;
}

interface FormData {
    fullName: string;
    username: string;
    email: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

interface FormErrors {
    [key: string]: string;
}

export default function ProfileSettingsModal({ isVisible, onClose }: ProfileSettingsModalProps) {
    const { user, profile, updateProfile, refreshProfile } = useAuthStore();
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        username: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [usernameChecking, setUsernameChecking] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

    // Initialize form data when modal opens
    useEffect(() => {
        if (isVisible && profile) {
            setFormData({
                fullName: profile.full_name || '',
                username: profile.username || '',
                email: profile.email || '',
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
            setAvatarPreview(profile.avatar_url || '');
            setErrors({});
            setUsernameAvailable(null);
        }
    }, [isVisible, profile]);

    // Check username availability with debouncing
    useEffect(() => {
        if (!formData.username || formData.username === profile?.username) {
            setUsernameAvailable(null);
            return;
        }

        const timeoutId = setTimeout(async () => {
            await checkUsernameAvailability(formData.username);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [formData.username, profile?.username]);

    const checkUsernameAvailability = async (username: string) => {
        if (!username || username.length < 3) {
            setUsernameAvailable(null);
            return;
        }

        setUsernameChecking(true);
        try {
            const { data, error } = await supabase.rpc('is_username_available', {
                username_input: username,
                user_id_input: user?.id,
            });

            if (error) {
                console.error('Error checking username:', error);
                setUsernameAvailable(null);
            } else {
                setUsernameAvailable(data);
            }
        } catch (error) {
            console.error('Error checking username:', error);
            setUsernameAvailable(null);
        } finally {
            setUsernameChecking(false);
        }
    };

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleAvatarUpload = (event: any) => {
        if (Platform.OS !== 'web') {
            Alert.alert('Not Supported', 'Avatar upload is only supported on web platform');
            return;
        }

        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            Alert.alert('Invalid File', 'Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            Alert.alert('File Too Large', 'Please select an image smaller than 5MB');
            return;
        }

        setAvatarFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setAvatarPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const uploadAvatar = async (): Promise<string | null> => {
        if (!avatarFile || !user) return null;

        setUploadingAvatar(true);
        try {
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, avatarFile);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading avatar:', error);
            Alert.alert('Upload Failed', 'Failed to upload avatar. Please try again.');
            return null;
        } finally {
            setUploadingAvatar(false);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        // Full name validation
        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        }

        // Username validation
        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        } else if (!/^[a-zA-Z0-9_]{3,30}$/.test(formData.username)) {
            newErrors.username = 'Username must be 3-30 characters, letters, numbers, and underscores only';
        } else if (usernameAvailable === false) {
            newErrors.username = 'Username is already taken';
        }

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        // Password validation (only if changing password)
        if (formData.newPassword || formData.confirmPassword) {
            if (!formData.currentPassword) {
                newErrors.currentPassword = 'Current password is required to change password';
            }

            if (!formData.newPassword) {
                newErrors.newPassword = 'New password is required';
            } else if (formData.newPassword.length < 6) {
                newErrors.newPassword = 'Password must be at least 6 characters';
            }

            if (formData.newPassword !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm() || !user) return;

        setLoading(true);
        try {
            let avatarUrl = profile?.avatar_url;

            // Upload avatar if changed
            if (avatarFile) {
                const uploadedUrl = await uploadAvatar();
                if (uploadedUrl) {
                    avatarUrl = uploadedUrl;
                }
            }

            // Update profile
            const profileUpdates = {
                full_name: formData.fullName.trim(),
                username: formData.username.trim(),
                avatar_url: avatarUrl,
            };

            const profileResult = await updateProfile(profileUpdates);
            if (profileResult.error) {
                throw new Error(profileResult.error);
            }

            // Update email if changed
            if (formData.email !== profile?.email) {
                const { error: emailError } = await supabase.auth.updateUser({
                    email: formData.email.trim(),
                });

                if (emailError) {
                    throw new Error(`Failed to update email: ${emailError.message}`);
                }

                Alert.alert(
                    'Email Update',
                    'A confirmation email has been sent to your new email address. Please check your email to confirm the change.'
                );
            }

            // Update password if provided
            if (formData.newPassword) {
                const { error: passwordError } = await supabase.auth.updateUser({
                    password: formData.newPassword,
                });

                if (passwordError) {
                    throw new Error(`Failed to update password: ${passwordError.message}`);
                }
            }

            // Refresh profile data
            await refreshProfile();

            Alert.alert('Success', 'Profile updated successfully!');
            onClose();
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    const getUsernameStatus = () => {
        if (!formData.username || formData.username === profile?.username) {
            return null;
        }

        if (usernameChecking) {
            return { icon: <ActivityIndicator size="small" color="#00d4ff" />, color: '#00d4ff' };
        }

        if (usernameAvailable === true) {
            return { icon: <Check size={16} color="#10B981" />, color: '#10B981' };
        }

        if (usernameAvailable === false) {
            return { icon: <AlertCircle size={16} color="#EF4444" />, color: '#EF4444' };
        }

        return null;
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
                        <Text style={styles.title}>Profile Settings</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.subtitle}>
                        Update your profile information and account settings
                    </Text>
                </LinearGradient>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Avatar Section */}
                    <View style={styles.avatarSection}>
                        <Text style={styles.sectionTitle}>Profile Picture</Text>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatarWrapper}>
                                {avatarPreview ? (
                                    <Image source={{ uri: avatarPreview }} style={styles.avatar} />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <User size={40} color="#00d4ff" />
                                    </View>
                                )}

                                {Platform.OS === 'web' && (
                                    <>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                            style={{ display: 'none' }}
                                            id="avatar-upload"
                                            disabled={loading || uploadingAvatar}
                                        />
                                        <TouchableOpacity
                                            onPress={() => {
                                                const input = document.getElementById('avatar-upload') as HTMLInputElement;
                                                input?.click();
                                            }}
                                            style={styles.avatarButton}
                                            disabled={loading || uploadingAvatar}
                                        >
                                            {uploadingAvatar ? (
                                                <ActivityIndicator size="small" color="white" />
                                            ) : (
                                                <Camera size={16} color="white" />
                                            )}
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                            <Text style={styles.avatarHint}>
                                Click to upload a new profile picture (max 5MB)
                            </Text>
                        </View>
                    </View>

                    {/* Personal Information */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Personal Information</Text>

                        {/* Full Name */}
                        <View style={styles.fieldContainer}>
                            <View style={styles.labelContainer}>
                                <User size={20} color="#00d4ff" />
                                <Text style={styles.label}>Full Name</Text>
                            </View>
                            <TextInput
                                style={[styles.input, errors.fullName && styles.inputError]}
                                placeholder="Enter your full name"
                                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                value={formData.fullName}
                                onChangeText={(value) => handleInputChange('fullName', value)}
                                editable={!loading}
                            />
                            {errors.fullName && (
                                <Text style={styles.errorText}>{errors.fullName}</Text>
                            )}
                        </View>

                        {/* Username */}
                        <View style={styles.fieldContainer}>
                            <View style={styles.labelContainer}>
                                <Text style={styles.label}>Username</Text>
                                {getUsernameStatus()?.icon}
                            </View>
                            <TextInput
                                style={[
                                    styles.input,
                                    errors.username && styles.inputError,
                                    getUsernameStatus() && { borderColor: getUsernameStatus()?.color }
                                ]}
                                placeholder="Enter a unique username"
                                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                value={formData.username}
                                onChangeText={(value) => handleInputChange('username', value.toLowerCase())}
                                editable={!loading}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {errors.username && (
                                <Text style={styles.errorText}>{errors.username}</Text>
                            )}
                            {usernameAvailable === true && (
                                <Text style={styles.successText}>Username is available!</Text>
                            )}
                        </View>
                    </View>

                    {/* Account Settings */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Account Settings</Text>

                        {/* Email */}
                        <View style={styles.fieldContainer}>
                            <View style={styles.labelContainer}>
                                <Mail size={20} color="#00d4ff" />
                                <Text style={styles.label}>Email</Text>
                            </View>
                            <TextInput
                                style={[styles.input, errors.email && styles.inputError]}
                                placeholder="Enter your email"
                                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                value={formData.email}
                                onChangeText={(value) => handleInputChange('email', value)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!loading}
                            />
                            {errors.email && (
                                <Text style={styles.errorText}>{errors.email}</Text>
                            )}
                        </View>
                    </View>

                    {/* Change Password */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Change Password</Text>
                        <Text style={styles.sectionSubtitle}>
                            Leave blank if you don't want to change your password
                        </Text>

                        {/* Current Password */}
                        <View style={styles.fieldContainer}>
                            <View style={styles.labelContainer}>
                                <Lock size={20} color="#00d4ff" />
                                <Text style={styles.label}>Current Password</Text>
                            </View>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[styles.passwordInput, errors.currentPassword && styles.inputError]}
                                    placeholder="Enter current password"
                                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                    value={formData.currentPassword}
                                    onChangeText={(value) => handleInputChange('currentPassword', value)}
                                    secureTextEntry={!showPasswords.current}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!loading}
                                />
                                <TouchableOpacity
                                    onPress={() => togglePasswordVisibility('current')}
                                    style={styles.eyeButton}
                                >
                                    {showPasswords.current ? (
                                        <EyeOff size={20} color="rgba(255, 255, 255, 0.6)" />
                                    ) : (
                                        <Eye size={20} color="rgba(255, 255, 255, 0.6)" />
                                    )}
                                </TouchableOpacity>
                            </View>
                            {errors.currentPassword && (
                                <Text style={styles.errorText}>{errors.currentPassword}</Text>
                            )}
                        </View>

                        {/* New Password */}
                        <View style={styles.fieldContainer}>
                            <View style={styles.labelContainer}>
                                <Lock size={20} color="#00d4ff" />
                                <Text style={styles.label}>New Password</Text>
                            </View>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[styles.passwordInput, errors.newPassword && styles.inputError]}
                                    placeholder="Enter new password (min. 6 characters)"
                                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                    value={formData.newPassword}
                                    onChangeText={(value) => handleInputChange('newPassword', value)}
                                    secureTextEntry={!showPasswords.new}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!loading}
                                />
                                <TouchableOpacity
                                    onPress={() => togglePasswordVisibility('new')}
                                    style={styles.eyeButton}
                                >
                                    {showPasswords.new ? (
                                        <EyeOff size={20} color="rgba(255, 255, 255, 0.6)" />
                                    ) : (
                                        <Eye size={20} color="rgba(255, 255, 255, 0.6)" />
                                    )}
                                </TouchableOpacity>
                            </View>
                            {errors.newPassword && (
                                <Text style={styles.errorText}>{errors.newPassword}</Text>
                            )}
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.fieldContainer}>
                            <View style={styles.labelContainer}>
                                <Lock size={20} color="#00d4ff" />
                                <Text style={styles.label}>Confirm New Password</Text>
                            </View>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[styles.passwordInput, errors.confirmPassword && styles.inputError]}
                                    placeholder="Confirm new password"
                                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                    value={formData.confirmPassword}
                                    onChangeText={(value) => handleInputChange('confirmPassword', value)}
                                    secureTextEntry={!showPasswords.confirm}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!loading}
                                />
                                <TouchableOpacity
                                    onPress={() => togglePasswordVisibility('confirm')}
                                    style={styles.eyeButton}
                                >
                                    {showPasswords.confirm ? (
                                        <EyeOff size={20} color="rgba(255, 255, 255, 0.6)" />
                                    ) : (
                                        <Eye size={20} color="rgba(255, 255, 255, 0.6)" />
                                    )}
                                </TouchableOpacity>
                            </View>
                            {errors.confirmPassword && (
                                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                            )}
                        </View>
                    </View>
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.cancelButton}
                        disabled={loading}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={loading || usernameChecking || usernameAvailable === false}
                        style={[
                            styles.saveButton,
                            (loading || usernameChecking || usernameAvailable === false) && styles.saveButtonDisabled
                        ]}
                    >
                        <LinearGradient
                            colors={
                                loading || usernameChecking || usernameAvailable === false
                                    ? ['#666', '#666']
                                    : ['#00d4ff', '#0099cc']
                            }
                            style={styles.saveButtonGradient}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Save size={20} color="white" />
                            )}
                            <Text style={styles.saveButtonText}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Text>
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
    avatarSection: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginBottom: 16,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.6)',
        fontFamily: 'Inter-Regular',
        marginBottom: 16,
    },
    avatarContainer: {
        alignItems: 'center',
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 12,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(0, 212, 255, 0.3)',
    },
    avatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#00d4ff',
        borderRadius: 16,
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#1a1a1a',
    },
    avatarHint: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        fontFamily: 'Inter-Regular',
    },
    section: {
        marginBottom: 32,
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
    successText: {
        color: '#10B981',
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        marginTop: 4,
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
    saveButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    saveButtonText: {
        color: 'white',
        fontFamily: 'Inter-Bold',
        fontSize: 16,
    },
});
