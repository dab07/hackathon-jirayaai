import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, Zap, Brain, Globe, ChevronRight, Play } from 'lucide-react-native';
import VoiceAgentSelector from './VoiceAgentSelector';
import { VOICE_AGENTS } from '@/utils/GeminiAi/elevenlabs';

interface InterviewLevelSelectorProps {
    onSelectLevel: (level: number, selectedLanguage: string, selectedVoiceAgent: keyof typeof VOICE_AGENTS) => void;
}

const levels = [
    {
        level: 1,
        title: 'Basic',
        description: '5-8 fundamental questions',
        subtitle: 'Perfect for entry-level positions',
        icon: Star,
        gradient: ['#00d4ff', '#0099cc'],
        questions: '5-8 Questions',
        difficulty: 'Entry Level',
    },
    {
        level: 2,
        title: 'Advanced',
        description: '10-15 complex questions',
        subtitle: 'For experienced professionals',
        icon: Zap,
        gradient: ['#8B5CF6', '#7C3AED'],
        questions: '10-15 Questions',
        difficulty: 'Intermediate-Hard',
    },
    {
        level: 3,
        title: 'Adaptive',
        description: 'AI-powered dynamic difficulty',
        subtitle: 'Questions adapt to your responses',
        icon: Brain,
        gradient: ['#10B981', '#16A34A'],
        questions: '10-15 Questions',
        difficulty: 'Adaptive',
    },
];

const languages = [
    {
        code: 'english',
        name: 'English',
        flag: '🇺🇸',
        description: 'Conduct your interview in English',
        availableVoices: ['JESSICA', 'BLONDIE'] as (keyof typeof VOICE_AGENTS)[],
    },
    {
        code: 'french',
        name: 'French',
        flag: '🇫🇷',
        description: 'Menez votre entretien en français',
        availableVoices: ['FRANCO'] as (keyof typeof VOICE_AGENTS)[],
    },
    {
        code: 'japanese-english',
        name: 'Japanese-English',
        flag: '🇯🇵',
        description: 'Bilingual interview support',
        availableVoices: ['SAYURI'] as (keyof typeof VOICE_AGENTS)[],
    },
];

export default function InterviewLevelSelector({ onSelectLevel }: InterviewLevelSelectorProps) {
    const [step, setStep] = useState<'language' | 'voice' | 'level'>('language');
    const [selectedLanguage, setSelectedLanguage] = useState<string>('');
    const [selectedVoiceAgent, setSelectedVoiceAgent] = useState<keyof typeof VOICE_AGENTS>('JESSICA');
    const [selectedLevel, setSelectedLevel] = useState<number>(0);

    const handleLanguageSelect = (languageCode: string) => {
        setSelectedLanguage(languageCode);

        // Auto-select the first available voice for the language
        const language = languages.find(lang => lang.code === languageCode);
        if (language && language.availableVoices.length > 0) {
            setSelectedVoiceAgent(language.availableVoices[0]);
        }

        setStep('voice');
    };

    const handleVoiceSelect = (voiceAgent: keyof typeof VOICE_AGENTS) => {
        setSelectedVoiceAgent(voiceAgent);
        setStep('level');
    };

    const handleLevelSelect = (level: number) => {
        setSelectedLevel(level);
        onSelectLevel(level, selectedLanguage, selectedVoiceAgent);
    };

    const handleBackToLanguage = () => {
        setStep('language');
        setSelectedLanguage('');
    };

    const handleBackToVoice = () => {
        setStep('voice');
    };

    const getFilteredVoiceAgents = () => {
        const language = languages.find(lang => lang.code === selectedLanguage);
        if (!language) return [];

        return language.availableVoices;
    };

    const renderLanguageSelection = () => (
        <View style={styles.container}>
            <View style={styles.header}>
                <Globe size={32} color="#00d4ff" />
                <Text style={styles.title}>Select Interview Language</Text>
                <Text style={styles.subtitle}>
                    Choose your preferred language for the interview
                </Text>
            </View>

            <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
                {languages.map((language) => (
                    <TouchableOpacity
                        key={language.code}
                        onPress={() => handleLanguageSelect(language.code)}
                        style={styles.languageCard}
                    >
                        <LinearGradient
                            colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.1)']}
                            style={styles.languageGradient}
                        >
                            <View style={styles.languageHeader}>
                                <Text style={styles.languageFlag}>{language.flag}</Text>
                                <View style={styles.languageInfo}>
                                    <Text style={styles.languageName}>{language.name}</Text>
                                    <Text style={styles.languageDescription}>{language.description}</Text>
                                </View>
                                <ChevronRight size={24} color="#00d4ff" />
                            </View>

                            <View style={styles.voicePreview}>
                                <Text style={styles.voicePreviewLabel}>Available Voice Agents:</Text>
                                <View style={styles.voicePreviewList}>
                                    {language.availableVoices.map((voiceKey) => {
                                        const voice = VOICE_AGENTS[voiceKey];
                                        return (
                                            <View key={voiceKey} style={styles.voicePreviewItem}>
                                                <Text style={styles.voicePreviewName}>{voice.name}</Text>
                                                <Text style={styles.voicePreviewAccent}>({voice.accent})</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderVoiceSelection = () => {
        const selectedLang = languages.find(lang => lang.code === selectedLanguage);

        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerWithBack}>
                        <TouchableOpacity onPress={handleBackToLanguage} style={styles.backButton}>
                            <Text style={styles.backButtonText}>← Back</Text>
                        </TouchableOpacity>
                        <View style={styles.headerContent}>
                            <Text style={styles.selectedLanguageFlag}>{selectedLang?.flag}</Text>
                            <Text style={styles.title}>Select Voice Agent</Text>
                            <Text style={styles.subtitle}>
                                Choose your AI interviewer for {selectedLang?.name}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.voiceSelectorContainer}>
                    <VoiceAgentSelector
                        selectedAgent={selectedVoiceAgent}
                        onAgentSelect={setSelectedVoiceAgent}
                        availableAgents={getFilteredVoiceAgents()}
                    />
                </View>

                <View style={styles.continueButtonContainer}>
                    <TouchableOpacity
                        onPress={() => handleVoiceSelect(selectedVoiceAgent)}
                        style={styles.continueButton}
                    >
                        <LinearGradient
                            colors={['#00d4ff', '#0099cc']}
                            style={styles.continueButtonGradient}
                        >
                            <Play size={20} color="white" />
                            <Text style={styles.continueButtonText}>Continue to Level Selection</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderLevelSelection = () => {
        const selectedLang = languages.find(lang => lang.code === selectedLanguage);
        const selectedVoice = VOICE_AGENTS[selectedVoiceAgent];

        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerWithBack}>
                        <TouchableOpacity onPress={handleBackToVoice} style={styles.backButton}>
                            <Text style={styles.backButtonText}>← Back</Text>
                        </TouchableOpacity>
                        <View style={styles.headerContent}>
                            <Text style={styles.title}>Choose Interview Level</Text>
                            <Text style={styles.subtitle}>
                                Select the difficulty level that matches your experience
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Selection Summary */}
                <View style={styles.selectionSummary}>
                    <Text style={styles.summaryTitle}>Your Selections:</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Language:</Text>
                        <Text style={styles.summaryValue}>
                            {selectedLang?.flag} {selectedLang?.name}
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Voice Agent:</Text>
                        <Text style={styles.summaryValue}>
                            {selectedVoice.name} ({selectedVoice.accent})
                        </Text>
                    </View>
                </View>

                <ScrollView style={styles.levelsContainer} showsVerticalScrollIndicator={false}>
                    {levels.map((level) => {
                        const IconComponent = level.icon;
                        return (
                            <TouchableOpacity
                                key={level.level}
                                onPress={() => handleLevelSelect(level.level)}
                                style={styles.levelCard}
                            >
                                <LinearGradient
                                    colors={level.gradient as [string, string, ...string[]]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.levelGradient}
                                >
                                    <View style={styles.levelHeader}>
                                        <View style={styles.levelIconContainer}>
                                            <IconComponent size={24} color="white" />
                                        </View>
                                        <View style={styles.levelTitleContainer}>
                                            <Text style={styles.levelTitle}>{level.title}</Text>
                                            <Text style={styles.levelSubtitle}>{level.subtitle}</Text>
                                        </View>
                                    </View>

                                    <Text style={styles.levelDescription}>{level.description}</Text>

                                    <View style={styles.levelFooter}>
                                        <View style={styles.levelBadge}>
                                            <Text style={styles.levelBadgeText}>{level.questions}</Text>
                                        </View>
                                        <View style={styles.levelBadge}>
                                            <Text style={styles.levelBadgeText}>{level.difficulty}</Text>
                                        </View>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        );
    };

    switch (step) {
        case 'language':
            return renderLanguageSelection();
        case 'voice':
            return renderVoiceSelection();
        case 'level':
            return renderLevelSelection();
        default:
            return renderLanguageSelection();
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        paddingTop: 60,
    },
    header: {
        paddingHorizontal: 24,
        marginBottom: 40,
        alignItems: 'center',
    },
    headerWithBack: {
        width: '100%',
        alignItems: 'center',
    },
    backButton: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 20,
    },
    backButtonText: {
        color: '#00d4ff',
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
    },
    headerContent: {
        alignItems: 'center',
    },
    selectedLanguageFlag: {
        fontSize: 32,
        marginBottom: 8,
    },
    title: {
        fontSize: 28,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        fontFamily: 'Inter-Regular',
    },
    optionsContainer: {
        paddingHorizontal: 24,
        flex: 1,
    },
    languageCard: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    languageGradient: {
        padding: 24,
    },
    languageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    languageFlag: {
        fontSize: 32,
        marginRight: 16,
    },
    languageInfo: {
        flex: 1,
    },
    languageName: {
        fontSize: 20,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginBottom: 4,
    },
    languageDescription: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        fontFamily: 'Inter-Regular',
    },
    voicePreview: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
    },
    voicePreviewLabel: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        color: '#00d4ff',
        marginBottom: 8,
    },
    voicePreviewList: {
        gap: 4,
    },
    voicePreviewItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    voicePreviewName: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: 'white',
    },
    voicePreviewAccent: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
        fontFamily: 'Inter-Regular',
    },
    voiceSelectorContainer: {
        flex: 1,
        paddingHorizontal: 24,
    },
    continueButtonContainer: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    continueButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#00d4ff',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    continueButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        gap: 8,
    },
    continueButtonText: {
        color: 'white',
        fontFamily: 'Inter-Bold',
        fontSize: 16,
    },
    selectionSummary: {
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 255, 0.2)',
    },
    summaryTitle: {
        fontSize: 16,
        fontFamily: 'Inter-Bold',
        color: '#00d4ff',
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        color: 'rgba(255, 255, 255, 0.8)',
    },
    summaryValue: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        color: 'white',
    },
    levelsContainer: {
        paddingHorizontal: 24,
        flex: 1,
    },
    levelCard: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    levelGradient: {
        padding: 24,
    },
    levelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    levelIconContainer: {
        width: 48,
        height: 48,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    levelTitleContainer: {
        flex: 1,
    },
    levelTitle: {
        fontSize: 20,
        fontFamily: 'Inter-Bold',
        color: 'white',
    },
    levelSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        fontFamily: 'Inter-Regular',
    },
    levelDescription: {
        fontSize: 16,
        color: 'white',
        marginBottom: 20,
        fontFamily: 'Inter-Regular',
    },
    levelFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    levelBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    levelBadgeText: {
        color: 'white',
        fontSize: 12,
        fontFamily: 'Inter-SemiBold',
    },
});
