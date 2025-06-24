import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageCircle, Send, Clock, Volume2, VolumeX, Loader2 } from 'lucide-react-native';
import { Question } from '@/utils/GeminiAi/genai';
import { textToSpeech} from '@/utils/GeminiAi/elevenlabs';
import VoiceRecorder from './VoiceRecorder';

interface InterviewQuestionCardProps {
    question: Question;
    questionNumber: number;
    onSubmitAnswer: (answer: string) => void;
    onSpeechToText: (audioBlob: Blob) => Promise<string>;
    isLoading?: boolean;
}

export default function InterviewQuestionCard({
                                                  question,
                                                  questionNumber,
                                                  onSubmitAnswer,
                                                  onSpeechToText,
                                                  isLoading = false
                                              }: InterviewQuestionCardProps) {
    const [answer, setAnswer] = useState('');
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [isPlayingQuestion, setIsPlayingQuestion] = useState(false);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
    // const [hasUserInteracted, setHasUserInteracted] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const mountedRef = useRef(true);

    // Timer effect
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setTimeElapsed(prev => prev + 1);
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    // Auto-play question when component mounts or question changes
    useEffect(() => {
        if (Platform.OS === 'web') {
            // Small delay to ensure component is fully mounted
            const timer = setTimeout(() => {
                if (mountedRef.current) {
                    playQuestion(true); // true indicates auto-play
                }
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [question.question]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            mountedRef.current = false;
            if (audioElement) {
                audioElement.pause();
                audioElement.currentTime = 0;
            }
        };
    }, [audioElement]);

    // Track user interaction for autoplay policy
    useEffect(() => {
        const handleUserInteraction = () => {
            // setHasUserInteracted(true);
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('touchstart', handleUserInteraction);
        };

        // if (Platform.OS === 'web' && !hasUserInteracted) {
        if (Platform.OS === 'web') {
            document.addEventListener('click', handleUserInteraction);
            document.addEventListener('touchstart', handleUserInteraction);
        }

        return () => {
            if (Platform.OS === 'web') {
                document.removeEventListener('click', handleUserInteraction);
                document.removeEventListener('touchstart', handleUserInteraction);
            }
        };
        // }, [hasUserInteracted]);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const playQuestion = async (isAutoPlay = false) => {
        if (Platform.OS !== 'web' || isPlayingQuestion || isLoadingAudio) return;

        // Handle browser autoplay restrictions
        // if (isAutoPlay && !hasUserInteracted) {
        //     console.log('Cannot autoplay audio - user has not interacted with the page yet');
        //     return;
        // }

        try {
            setIsLoadingAudio(true);
            setIsPlayingQuestion(true);

            const { audioUrl } = await textToSpeech(question.question);

            if (!mountedRef.current) return;

            const audio = new Audio(audioUrl);
            setAudioElement(audio);

            // Preload the audio
            audio.preload = 'auto';

            audio.onloadeddata = () => {
                setIsLoadingAudio(false);
            };

            audio.onended = () => {
                if (mountedRef.current) {
                    setIsPlayingQuestion(false);
                    setAudioElement(null);
                }
            };

            audio.onerror = (error) => {
                console.error('Audio playback error:', error);
                if (mountedRef.current) {
                    setIsPlayingQuestion(false);
                    setIsLoadingAudio(false);
                    setAudioElement(null);

                    // Show error only for manual plays, not auto-plays
                    if (!isAutoPlay) {
                        Alert.alert('Audio Error', 'Failed to play the question audio. Please try again.');
                    }
                }
            };

            // Set volume to a reasonable level
            audio.volume = 0.8;

            await audio.play();

        } catch (error) {
            console.error('Error playing question:', error);

            if (mountedRef.current) {
                setIsPlayingQuestion(false);
                setIsLoadingAudio(false);
                setAudioElement(null);

                // Show error only for manual plays, not auto-plays
                if (!isAutoPlay) {
                    Alert.alert(
                        'Text-to-Speech Error',
                        'Unable to play the question audio. This might be due to browser restrictions or network issues.'
                    );
                }
            }
        }
    };

    const stopQuestion = () => {
        if (audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
        }
        setIsPlayingQuestion(false);
        setIsLoadingAudio(false);
        setAudioElement(null);
    };

    const handlePlayButtonPress = () => {
        if (isPlayingQuestion || isLoadingAudio) {
            stopQuestion();
        } else {
            playQuestion(false); // false indicates manual play
        }
    };

    const handleVoiceRecordingComplete = async (text: string, audioBlob: Blob) => {
        try {
            console.log('Voice recording completed with text:', text);
            setAnswer(prev => prev + ' ' + text);
        } catch (error) {
            console.error('Error handling voice recording:', error);
        }
    };
    const handleRecordingStart = () => {
        // Stop question audio when starting to record
        if (isPlayingQuestion) {
            stopQuestion();
        }
    };

    const handleRecordingStop = () => {
        // Handle any cleanup when recording stops
        console.log('Recording stopped');
    };

    const handleRecordingError = (error: string) => {
        console.error('Recording error:', error);
        // You might want to show an error message to the user
        alert(error);
    };

    const handleSubmit = () => {
        if (!answer.trim()) return;

        // Stop any playing audio before submitting
        if (isPlayingQuestion) {
            stopQuestion();
        }

        onSubmitAnswer(answer.trim());
        setAnswer('');
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'technical':
                return '#00d4ff';
            case 'behavioral':
                return '#10B981';
            case 'scenario':
                return '#8B5CF6';
            default:
                return '#6B7280';
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy':
                return '#10B981';
            case 'medium':
                return '#F59E0B';
            case 'hard':
                return '#EF4444';
            default:
                return '#6B7280';
        }
    };

    const getAudioButtonIcon = () => {
        if (isLoadingAudio) {
            return <Loader2 size={18} color="#00d4ff" className="animate-spin" />;
        }
        if (isPlayingQuestion) {
            return <VolumeX size={18} color="#00d4ff" />;
        }
        return <Volume2 size={18} color="#00d4ff" />;
    };

    const getAudioButtonText = () => {
        if (isLoadingAudio) return 'Loading...';
        if (isPlayingQuestion) return 'Stop';
        return 'Play Question';
    };

    return (
        <View style={styles.container}>
            {/* Question Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.questionNumber}>
                        Question {questionNumber}
                    </Text>
                    <View style={styles.timerContainer}>
                        <Clock size={16} color="rgba(255, 255, 255, 0.7)" />
                        <Text style={styles.timerText}>{formatTime(timeElapsed)}</Text>
                    </View>
                </View>

                <View style={styles.badges}>
                    <View style={[styles.badge, { backgroundColor: getTypeColor(question.type) + '20', borderColor: getTypeColor(question.type) + '40' }]}>
                        <Text style={[styles.badgeText, { color: getTypeColor(question.type) }]}>
                            {question.type}
                        </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: getDifficultyColor(question.difficulty) + '20', borderColor: getDifficultyColor(question.difficulty) + '40' }]}>
                        <Text style={[styles.badgeText, { color: getDifficultyColor(question.difficulty) }]}>
                            {question.difficulty}
                        </Text>
                    </View>
                </View>

                <View style={styles.questionContainer}>
                    <View style={styles.questionHeader}>
                        <MessageCircle size={20} color="#00d4ff" />
                        <Text style={styles.questionLabel}>Question</Text>
                        {Platform.OS === 'web' && (
                            <TouchableOpacity
                                onPress={handlePlayButtonPress}
                                style={[
                                    styles.playButton,
                                    isPlayingQuestion && styles.playButtonActive,
                                    isLoadingAudio && styles.playButtonLoading
                                ]}
                                disabled={isLoadingAudio}
                            >
                                {getAudioButtonIcon()}
                                <Text style={styles.playButtonText}>
                                    {getAudioButtonText()}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={styles.questionText}>
                        {question.question}
                    </Text>

                    {/* Audio Status Indicator */}
                    {Platform.OS === 'web' && (isPlayingQuestion || isLoadingAudio) && (
                        <View style={styles.audioStatus}>
                            <View style={[styles.audioStatusDot, isPlayingQuestion && styles.audioStatusDotActive]} />
                            <Text style={styles.audioStatusText}>
                                {isLoadingAudio ? 'Loading audio...' : 'Playing question...'}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Answer Section */}
            <View style={styles.answerSection}>
                <Text style={styles.answerLabel}>Your Answer</Text>

                {/* Voice Recorder */}
                {Platform.OS === 'web' && (
                    <VoiceRecorder
                        onRecordingComplete={handleVoiceRecordingComplete}
                        onRecordingStart={handleRecordingStart}
                        onRecordingStop={handleRecordingStop}
                        onError={handleRecordingError}
                        maxDuration={300} // Optional: 5 minutes max
                        disabled={false}
                    />
                )}

                <TextInput
                    style={styles.answerInput}
                    placeholder="Type your answer here or use voice recording..."
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    multiline
                    textAlignVertical="top"
                    value={answer}
                    onChangeText={setAnswer}
                    editable={!isLoading && !isRecording}
                />

                {/* Submit Button */}
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isLoading || !answer.trim() || isRecording}
                    style={[styles.submitButton, (isLoading || !answer.trim() || isRecording) && styles.submitButtonDisabled]}
                >
                    <LinearGradient
                        colors={isLoading || !answer.trim() || isRecording ? ['#666', '#666'] : ['#00d4ff', '#0099cc']}
                        style={styles.submitButtonGradient}
                    >
                        <Send size={20} color="white" />
                        <Text style={styles.submitButtonText}>
                            {isLoading ? 'Processing...' : 'Submit Answer'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    header: {
        marginBottom: 24,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    questionNumber: {
        fontSize: 20,
        fontFamily: 'Inter-Bold',
        color: 'white',
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 6,
    },
    timerText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: 'Inter-Regular',
        fontSize: 14,
    },
    badges: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    badge: {
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
    },
    badgeText: {
        fontSize: 12,
        fontFamily: 'Inter-SemiBold',
        textTransform: 'capitalize',
    },
    questionContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    questionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    questionLabel: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: '#00d4ff',
        flex: 1,
    },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 255, 0.3)',
    },
    playButtonActive: {
        backgroundColor: 'rgba(0, 212, 255, 0.2)',
        borderColor: 'rgba(0, 212, 255, 0.5)',
    },
    playButtonLoading: {
        backgroundColor: 'rgba(0, 212, 255, 0.05)',
        borderColor: 'rgba(0, 212, 255, 0.2)',
    },
    playButtonText: {
        color: '#00d4ff',
        fontSize: 12,
        fontFamily: 'Inter-Medium',
    },
    questionText: {
        fontSize: 16,
        color: 'white',
        lineHeight: 24,
        fontFamily: 'Inter-Regular',
    },
    audioStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    audioStatusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(0, 212, 255, 0.5)',
    },
    audioStatusDotActive: {
        backgroundColor: '#00d4ff',
    },
    audioStatusText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
        fontFamily: 'Inter-Regular',
    },
    answerSection: {
        flex: 1,
    },
    answerLabel: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: 'white',
        marginBottom: 16,
    },
    answerInput: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        color: 'white',
        fontFamily: 'Inter-Regular',
        minHeight: 120,
        marginBottom: 16,
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
