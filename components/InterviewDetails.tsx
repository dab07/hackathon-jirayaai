import React from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Pressable} from 'react-native';
import { X } from 'lucide-react-native';

import { colors } from '@/constant/colors';

interface InterviewDetailsProps {
    onClose: () => void;
    jobTitle: string;
    setJobTitle: (value: string) => void;
    yearsOfExp: string;
    setYearsOfExp: (value: string) => void;
    jobDescription: string;
    setJobDescription: (value: string) => void;
    skills: string;
    setSkills: (value: string) => void;
    onSubmit: () => void;
}

const InterviewDetails = ({
                              onClose,
                              jobTitle,
                              setJobTitle,
                              yearsOfExp,
                              setYearsOfExp,
                              jobDescription,
                              setJobDescription,
                              skills,
                              setSkills,
                              onSubmit,
                          }: InterviewDetailsProps) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Interview Details</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <X color="white" size={24} />
                </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Job Title</Text>
                <TextInput
                    style={styles.input}
                    value={jobTitle}
                    onChangeText={setJobTitle}
                    placeholder="Enter job title"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Years of Experience</Text>
                <TextInput
                    style={styles.input}
                    value={yearsOfExp}
                    onChangeText={setYearsOfExp}
                    placeholder="Enter years of experience"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Job Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={jobDescription}
                    onChangeText={setJobDescription}
                    placeholder="Enter job description"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Skills</Text>
                <TextInput
                    style={styles.input}
                    value={skills}
                    onChangeText={setSkills}
                    placeholder="Enter skills (comma separated)"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                />
            </View>
            <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
                <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
        </View>
    );
};

export default InterviewDetails;

const styles = StyleSheet.create({
    container: {
        width: '100%',
        maxWidth: 1000,
        backgroundColor: 'rgba(20, 20, 40, 0.6)',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        ...Platform.select({
            web: {
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.2,
                shadowRadius: 32,
                elevation: 8,
            },
        }),
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        fontFamily: 'Inter-Bold',
    },
    closeButton: {
        padding: 8,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: 'white',
        fontFamily: 'Inter-SemiBold',
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 8,
        padding: 12,
        color: 'white',
        fontFamily: 'Inter-Regular',
    },
    textArea: {
        minHeight: 100,
    },
    submitButton: {
        backgroundColor: colors.purple,
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 24,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Inter-Bold',
    },
});
