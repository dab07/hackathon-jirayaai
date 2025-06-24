import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, Globe, User, ChevronLeft, ChevronRight } from 'lucide-react-native';
import {
    VOICE_AGENTS,
    getAllVoiceAgents,
    testVoiceAgent,
    cleanupAudioUrl,
    TextToSpeechResponse
} from '@/utils/GeminiAi/elevenlabs';

const { width } = Dimensions.get('window');

interface VoiceAgentSelectorProps {
    selectedAgent: keyof typeof VOICE_AGENTS;
    onAgentSelect: (agent: keyof typeof VOICE_AGENTS) => void;
    availableAgents?: (keyof typeof VOICE_AGENTS)[];
    disabled?: boolean;
}

export default function VoiceAgentSelector({
                                               selectedAgent,
                                               onAgentSelect,
                                               availableAgents,
                                               disabled = false,
                                           }: VoiceAgentSelectorProps) {
    const [testingAgent, setTestingAgent] = useState<keyof typeof VOICE_AGENTS | null>(null);
    const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);

    // Filter voice agents based on available agents prop
    const allVoiceAgents = getAllVoiceAgents();
    const voiceAgents = availableAgents
        ? allVoiceAgents.filter(agent => availableAgents.includes(agent.key))
        : allVoiceAgents;

    const cardWidth = 280;
    const cardSpacing = 16;
    const visibleCards = Math.floor((width - 48) / (cardWidth + cardSpacing));

    const handleTestVoice = async (agentKey: keyof typeof VOICE_AGENTS) => {
        if (testingAgent || disabled) return;

        try {
            setTestingAgent(agentKey);

            // Stop any currently playing audio
            if (playingAudio) {
                playingAudio.pause();
                setPlayingAudio(null);
            }

            const result: TextToSpeechResponse = await testVoiceAgent(agentKey);

            const audio = new Audio(result.audioUrl);
            setPlayingAudio(audio);

            audio.onended = () => {
                setTestingAgent(null);
                setPlayingAudio(null);
                cleanupAudioUrl(result.audioUrl);
            };

            audio.onerror = () => {
                setTestingAgent(null);
                setPlayingAudio(null);
                cleanupAudioUrl(result.audioUrl);
                Alert.alert('Error', 'Failed to play voice sample');
            };

            await audio.play();
        } catch (error) {
            setTestingAgent(null);
            console.error('Voice test error:', error);
            Alert.alert('Error', 'Failed to test voice. Please try again.');
        }
    };

    const stopAudio = () => {
        if (playingAudio) {
            playingAudio.pause();
            setPlayingAudio(null);
            setTestingAgent(null);
        }
    };

    const scrollToNext = () => {
        const maxIndex = Math.max(0, voiceAgents.length - visibleCards);
        const nextIndex = Math.min(currentIndex + 1, maxIndex);
        setCurrentIndex(nextIndex);

        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({
                x: nextIndex * (cardWidth + cardSpacing),
                animated: true,
            });
        }
    };

    const scrollToPrevious = () => {
        const prevIndex = Math.max(currentIndex - 1, 0);
        setCurrentIndex(prevIndex);

        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({
                x: prevIndex * (cardWidth + cardSpacing),
                animated: true,
            });
        }
    };

    const getLanguageFlag = (language: string) => {
        switch (language.toLowerCase()) {
            case 'english':
                return '🇺🇸';
            case 'french':
                return '🇫🇷';
            case 'japanese-english':
                return '🇯🇵🇺🇸';
            default:
                return '🌐';
        }
    };

    const getAccentColor = (accent: string) => {
        switch (accent.toLowerCase()) {
            case 'american':
                return '#3B82F6';
            case 'british':
                return '#10B981';
            case 'american-japanese':
                return '#8B5CF6';
            case 'parisian':
                return '#EF4444';
            default:
                return '#6B7280';
        }
    };

    const canScrollLeft = currentIndex > 0;
    const canScrollRight = currentIndex < voiceAgents.length - visibleCards;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Globe size={20} color="#00d4ff" />
                <Text style={styles.title}>Choose Voice Assistant</Text>
            </View>

            <View style={styles.carouselContainer}>
                {/* Left Arrow */}
                {canScrollLeft && voiceAgents.length > visibleCards && (
                    <TouchableOpacity
                        onPress={scrollToPrevious}
                        style={[styles.arrowButton, styles.leftArrow]}
                    >
                        <ChevronLeft size={24} color="#00d4ff" />
                    </TouchableOpacity>
                )}

                {/* Voice Agents Carousel */}
                <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.agentsContainer}
                    scrollEventThrottle={16}
                    onMomentumScrollEnd={(event) => {
                        const scrollX = event.nativeEvent.contentOffset.x;
                        const newIndex = Math.round(scrollX / (cardWidth + cardSpacing));
                        setCurrentIndex(newIndex);
                    }}
                    style={styles.scrollView}
                >
                    {voiceAgents.map((agent, index) => {
                        const isSelected = selectedAgent === agent.key;
                        const isTesting = testingAgent === agent.key;

                        return (
                            <TouchableOpacity
                                key={agent.key}
                                onPress={() => !disabled && onAgentSelect(agent.key)}
                                disabled={disabled}
                                style={[
                                    styles.agentCard,
                                    isSelected && styles.selectedCard,
                                    disabled && styles.disabledCard,
                                    index === voiceAgents.length - 1 && styles.lastCard,
                                ]}
                            >
                                <LinearGradient
                                    colors={isSelected
                                        ? ['#00d4ff', '#0099cc']
                                        : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.1)']
                                    }
                                    style={styles.cardGradient}
                                >
                                    {/* Agent Info */}
                                    <View style={styles.agentInfo}>
                                        <View style={styles.agentHeader}>
                                            <User size={24} color={isSelected ? 'white' : '#00d4ff'} />
                                            <Text style={styles.agentFlag}>
                                                {getLanguageFlag(agent.language)}
                                            </Text>
                                        </View>

                                        <Text style={[
                                            styles.agentName,
                                            { color: isSelected ? 'white' : '#00d4ff' }
                                        ]}>
                                            {agent.name}
                                        </Text>

                                        <View style={styles.languageInfo}>
                                            <Text style={[
                                                styles.agentLanguage,
                                                { color: isSelected ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)' }
                                            ]}>
                                                {agent.language}
                                            </Text>
                                            <View style={[
                                                styles.accentBadge,
                                                { backgroundColor: getAccentColor(agent.accent) + '20' }
                                            ]}>
                                                <Text style={[
                                                    styles.accentText,
                                                    { color: getAccentColor(agent.accent) }
                                                ]}>
                                                    {agent.accent}
                                                </Text>
                                            </View>
                                        </View>

                                        <Text style={[
                                            styles.agentDescription,
                                            { color: isSelected ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.6)' }
                                        ]}>
                                            {agent.description}
                                        </Text>

                                        {/* Supported Languages */}
                                        <View style={styles.supportedLanguages}>
                                            <Text style={[
                                                styles.supportedLabel,
                                                { color: isSelected ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.5)' }
                                            ]}>
                                                Supports:
                                            </Text>
                                            <Text style={[
                                                styles.supportedText,
                                                { color: isSelected ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)' }
                                            ]}>
                                                {agent.supportedLanguages.join(', ')}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Test Voice Button */}
                                    <TouchableOpacity
                                        onPress={() => isTesting ? stopAudio() : handleTestVoice(agent.key)}
                                        disabled={disabled || (testingAgent !== null && testingAgent !== agent.key)}
                                        style={[
                                            styles.testButton,
                                            isTesting && styles.testingButton,
                                        ]}
                                    >
                                        {isTesting ? (
                                            <Pause size={16} color="white" />
                                        ) : (
                                            <Play size={16} color={isSelected ? 'white' : '#00d4ff'} />
                                        )}
                                        <Text style={[
                                            styles.testButtonText,
                                            { color: isTesting ? 'white' : isSelected ? 'white' : '#00d4ff' }
                                        ]}>
                                            {isTesting ? 'Stop' : 'Test Voice'}
                                        </Text>
                                    </TouchableOpacity>
                                </LinearGradient>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Right Arrow */}
                {canScrollRight && voiceAgents.length > visibleCards && (
                    <TouchableOpacity
                        onPress={scrollToNext}
                        style={[styles.arrowButton, styles.rightArrow]}
                    >
                        <ChevronRight size={24} color="#00d4ff" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Pagination Dots */}
            {voiceAgents.length > visibleCards && (
                <View style={styles.pagination}>
                    {Array.from({ length: Math.ceil(voiceAgents.length / visibleCards) }).map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.paginationDot,
                                Math.floor(currentIndex / visibleCards) === index && styles.activeDot,
                            ]}
                        />
                    ))}
                </View>
            )}

            <Text style={styles.helpText}>
                Select a voice assistant for your interview. Each voice has different language capabilities and accents.
                {voiceAgents.length > visibleCards && ' Swipe or use arrows to see more options.'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    title: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: 'white',
    },
    carouselContainer: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    agentsContainer: {
        paddingHorizontal: 4,
        gap: 16,
    },
    arrowButton: {
        position: 'absolute',
        top: '50%',
        zIndex: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 20,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 255, 0.3)',
    },
    leftArrow: {
        left: -20,
        transform: [{ translateY: -20 }],
    },
    rightArrow: {
        right: -20,
        transform: [{ translateY: -20 }],
    },
    agentCard: {
        width: 280,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginRight: 16,
    },
    lastCard: {
        marginRight: 0,
    },
    selectedCard: {
        borderColor: '#00d4ff',
        shadowColor: '#00d4ff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    disabledCard: {
        opacity: 0.6,
    },
    cardGradient: {
        padding: 16,
        minHeight: 240,
    },
    agentInfo: {
        flex: 1,
    },
    agentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    agentFlag: {
        fontSize: 20,
    },
    agentName: {
        fontSize: 18,
        fontFamily: 'Inter-Bold',
        marginBottom: 8,
    },
    languageInfo: {
        marginBottom: 8,
    },
    agentLanguage: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        marginBottom: 4,
    },
    accentBadge: {
        alignSelf: 'flex-start',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    accentText: {
        fontSize: 10,
        fontFamily: 'Inter-SemiBold',
        textTransform: 'uppercase',
    },
    agentDescription: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        lineHeight: 16,
        marginBottom: 8,
    },
    supportedLanguages: {
        marginBottom: 12,
    },
    supportedLabel: {
        fontSize: 10,
        fontFamily: 'Inter-SemiBold',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    supportedText: {
        fontSize: 11,
        fontFamily: 'Inter-Medium',
        textTransform: 'capitalize',
    },
    testButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        gap: 6,
    },
    testingButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
    },
    testButtonText: {
        fontSize: 12,
        fontFamily: 'Inter-SemiBold',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        gap: 8,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    activeDot: {
        backgroundColor: '#00d4ff',
        width: 12,
        height: 8,
        borderRadius: 4,
    },
    helpText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        marginTop: 12,
        paddingHorizontal: 16,
        fontFamily: 'Inter-Regular',
    },
});
