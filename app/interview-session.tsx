import React, { useState, useEffect, useRef } from 'react';
import { View, Alert, ActivityIndicator, StyleSheet, Dimensions, TouchableOpacity, Text, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { X, StopCircle, Mic, MicOff, Play, Pause, Send, Volume2, VolumeX } from 'lucide-react-native';
import { generateQuestions, evaluateAnswer } from '@/utils/GeminiAi/genai';
import { speechToText, textToSpeech, cleanupAudioUrl, VOICE_AGENTS } from '../utils/GeminiAi/elevenlabs';
import { useAuthStore } from '../utils/stores/authStore';
import { supabase } from '../utils/supabase/client';
import InterviewLevelSelector from '../components/InterviewLevelSelector';
import InterviewProgress from '../components/InterviewProgress';
import InterviewResults from '../components/InterviewResults';
import WebcamView from '../components/WebcamView';

const { width } = Dimensions.get('window');

interface JobDetail {
    id: string;
    job_title: string;
    job_description: string;
    skills: string[];
    years_experience: number;
}

export default function InterviewSessionScreen() {
    const router = useRouter();
    const { jobDetailId } = useLocalSearchParams<{
        jobDetailId: string;
    }>();

    const { user, profile, refreshProfile } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [jobDetail, setJobDetail] = useState<JobDetail | null>(null);
    const [phase, setPhase] = useState<'loading' | 'level-selection' | 'interview' | 'results'>('loading');
    const [currentLevel, setCurrentLevel] = useState(1);
    const [selectedLanguage, setSelectedLanguage] = useState('english');
    const [selectedVoiceAgent, setSelectedVoiceAgent] = useState<keyof typeof VOICE_AGENTS>('JESSICA');
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [responses, setResponses] = useState<any[]>([]);
    const [totalScore, setTotalScore] = useState(0);
    const [showEndConfirmation, setShowEndConfirmation] = useState(false);
    const [interviewId, setInterviewId] = useState<string | null>(null);

    // Speech-to-text states
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessingSpeech, setIsProcessingSpeech] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
    const [isPlayingRecording, setIsPlayingRecording] = useState(false);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [recordingTime, setRecordingTime] = useState(0);

    // Text-to-speech states for question reading
    const [isPlayingQuestion, setIsPlayingQuestion] = useState(false);
    const [questionAudioElement, setQuestionAudioElement] = useState<HTMLAudioElement | null>(null);
    const [autoPlayQuestions, setAutoPlayQuestions] = useState(true);

    // Refs for cleanup
    const webcamCleanupRef = useRef<(() => void) | null>(null);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Load job details on mount
    useEffect(() => {
        if (!user) {
            Alert.alert('Authentication Required', 'Please sign in to continue.');
            router.replace('/(tabs)');
            return;
        }

        if (jobDetailId) {
            loadJobDetails();
        } else {
            Alert.alert('Error', 'No job details found. Please try again.');
            router.replace('/(tabs)');
        }
    }, [jobDetailId, user]);

    const loadJobDetails = async () => {
        if (!jobDetailId || !user) return;

        try {
            setIsLoading(true);

            const { data, error } = await supabase
                .from('job_details')
                .select('*')
                .eq('id', jobDetailId)
                .eq('user_id', user.id)
                .single();

            if (error) {
                console.error('Error loading job details:', error);
                throw new Error('Failed to load job details');
            }

            if (!data) {
                throw new Error('Job details not found');
            }

            setJobDetail(data);
            setPhase('level-selection');
        } catch (error) {
            console.error('Error loading job details:', error);
            Alert.alert(
                'Error',
                'Failed to load job details. Please try again.',
                [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Cleanup function for media resources (excluding webcam)
    const cleanupAudioResources = () => {
        console.log('Cleaning up audio resources...');

        // Stop recording if active
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
        }

        // Stop recording timer
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }

        // Stop any ongoing audio
        if (audioElementRef.current) {
            audioElementRef.current.pause();
            audioElementRef.current = null;
        }

        // Stop question audio
        if (questionAudioElement) {
            questionAudioElement.pause();
            setQuestionAudioElement(null);
        }

        // Clean up audio URLs
        if (recordedAudio) {
            URL.revokeObjectURL(URL.createObjectURL(recordedAudio));
        }
    };

    // Complete cleanup function for all media resources including webcam
    const cleanupAllMediaResources = () => {
        console.log('Cleaning up all media resources including webcam...');

        // Clean up audio resources
        cleanupAudioResources();

        // Stop webcam
        if (webcamCleanupRef.current) {
            webcamCleanupRef.current();
            webcamCleanupRef.current = null;
        }
    };

    // Cleanup on component unmount or navigation away
    useEffect(() => {
        return () => {
            cleanupAllMediaResources();
        };
    }, []);

    // Cleanup when phase changes to results (interview completed)
    useEffect(() => {
        if (phase === 'results') {
            cleanupAllMediaResources();
        }
    }, [phase]);

    // Auto-play question when question changes
    useEffect(() => {
        if (phase === 'interview' && questions.length > 0 && autoPlayQuestions) {
            const currentQuestion = questions[currentQuestionIndex];
            if (currentQuestion) {
                playQuestion(currentQuestion.question);
            }
        }
    }, [currentQuestionIndex, phase, questions, autoPlayQuestions, selectedVoiceAgent, selectedLanguage]);

    const handleLevelSelect = async (level: number, language: string, voiceAgent: keyof typeof VOICE_AGENTS) => {
        if (!jobDetail || !user) return;

        // Check token availability
        if (profile && profile.tokens_used >= profile.tokens_limit) {
            Alert.alert(
                'Token Limit Reached',
                'You have reached your token limit. Please upgrade your plan to continue practicing interviews.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'View Plans', onPress: () => router.push('/(tabs)/pricing') },
                ]
            );
            return;
        }

        setIsLoading(true);
        setCurrentLevel(level);
        setSelectedLanguage(language);
        setSelectedVoiceAgent(voiceAgent);

        try {
            // Create interview record
            const { data: interview, error: interviewError } = await supabase
                .from('interviews')
                .insert({
                    user_id: user.id,
                    job_detail_id: jobDetail.id,
                    level,
                    status: 'in_progress',
                })
                .select()
                .single();

            if (interviewError) {
                console.error('Error creating interview:', interviewError);
                throw new Error('Failed to create interview record');
            }

            setInterviewId(interview.id);

            // Generate questions using AI
            const generatedQuestions = await generateQuestions(
                jobDetail.job_title,
                jobDetail.job_description,
                jobDetail.skills,
                level,
                jobDetail.years_experience
            );

            if (generatedQuestions.length === 0) {
                throw new Error('No questions generated');
            }

            setQuestions(generatedQuestions);
            setPhase('interview');
        } catch (error) {
            console.error('Error starting interview:', error);
            Alert.alert('Error', 'Failed to start interview. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const playQuestion = async (questionText: string) => {
        try {
            setIsPlayingQuestion(true);

            // Stop any currently playing question
            if (questionAudioElement) {
                questionAudioElement.pause();
                setQuestionAudioElement(null);
            }

            console.log(`Playing question with ${selectedVoiceAgent} in ${selectedLanguage}`);

            const result = await textToSpeech(questionText, {
                voiceAgent: selectedVoiceAgent,
                language: selectedLanguage as 'english' | 'french' | 'japanese',
            });

            const audio = new Audio(result.audioUrl);
            setQuestionAudioElement(audio);

            audio.onended = () => {
                setIsPlayingQuestion(false);
                setQuestionAudioElement(null);
                cleanupAudioUrl(result.audioUrl);
            };

            audio.onerror = () => {
                setIsPlayingQuestion(false);
                setQuestionAudioElement(null);
                cleanupAudioUrl(result.audioUrl);
                console.error('Error playing question audio');
            };

            await audio.play();
        } catch (error) {
            console.error('Error playing question:', error);
            setIsPlayingQuestion(false);
            // Don't show alert for TTS errors, just log them
        }
    };

    const stopQuestion = () => {
        if (questionAudioElement) {
            questionAudioElement.pause();
            questionAudioElement.currentTime = 0;
            setIsPlayingQuestion(false);
            setQuestionAudioElement(null);
        }
    };

    const toggleQuestionAudio = () => {
        if (isPlayingQuestion) {
            stopQuestion();
        } else {
            const currentQuestion = questions[currentQuestionIndex];
            if (currentQuestion) {
                playQuestion(currentQuestion.question);
            }
        }
    };

    const handleSubmitAnswer = async (answer: string) => {
        if (!questions.length || !jobDetail || !answer.trim() || !interviewId || !user) return;

        setIsLoading(true);
        try {
            const currentQuestion = questions[currentQuestionIndex];

            const evaluation = await evaluateAnswer(
                currentQuestion.question,
                answer,
                currentQuestion.expectedAnswer || '',
                jobDetail.job_title
            );

            const newResponse = {
                question: currentQuestion.question,
                answer,
                score: evaluation.score,
                feedback: evaluation.feedback,
                expectedAnswer: currentQuestion.expectedAnswer,
            };

            const updatedResponses = [...responses, newResponse];
            setResponses(updatedResponses);

            // Estimate tokens used (rough calculation)
            const tokensUsed = Math.ceil((currentQuestion.question.length + answer.length) / 4);

            // Update user's token usage
            if (profile) {
                await supabase
                    .from('profiles')
                    .update({
                        tokens_used: profile.tokens_used + tokensUsed,
                    })
                    .eq('id', user.id);

                // Refresh profile to get updated token count
                refreshProfile();
            }

            // Reset current answer and recording
            setCurrentAnswer('');
            setRecordedAudio(null);
            setRecordingTime(0);

            // Check if interview is complete
            if (currentQuestionIndex + 1 >= questions.length) {
                const avgScore = updatedResponses.reduce((sum, response) =>
                    sum + (response.score || 0), 0) / updatedResponses.length;

                const finalScore = Math.round(avgScore);
                setTotalScore(finalScore);

                // Update interview record with final results
                await supabase
                    .from('interviews')
                    .update({
                        status: 'completed',
                        score: finalScore,
                        tokens_used: tokensUsed * updatedResponses.length,
                        completed_at: new Date().toISOString(),
                        responses: updatedResponses,
                    })
                    .eq('id', interviewId);

                // Update user's interview count
                if (profile) {
                    await supabase
                        .from('profiles')
                        .update({
                            interviews_completed: profile.interviews_completed + 1,
                        })
                        .eq('id', user.id);
                }

                setPhase('results');
            } else {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
            Alert.alert('Error', 'Failed to submit answer. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEndInterview = () => {
        setShowEndConfirmation(true);
    };

    const confirmEndInterview = async () => {
        if (!interviewId || !user) return;

        try {
            if (responses.length === 0) {
                // If no responses, just mark as cancelled and go home
                await supabase
                    .from('interviews')
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString(),
                    })
                    .eq('id', interviewId);

                cleanupAllMediaResources();
                router.replace('/(tabs)');
                return;
            }

            const avgScore = responses.reduce((sum, response) =>
                sum + (response.score || 0), 0) / responses.length;

            const finalScore = Math.round(avgScore);
            setTotalScore(finalScore);

            // Update interview record
            await supabase
                .from('interviews')
                .update({
                    status: 'completed',
                    score: finalScore,
                    completed_at: new Date().toISOString(),
                    responses: responses,
                })
                .eq('id', interviewId);

            // Update user's interview count
            if (profile) {
                await supabase
                    .from('profiles')
                    .update({
                        interviews_completed: profile.interviews_completed + 1,
                    })
                    .eq('id', user.id);
            }

            setShowEndConfirmation(false);
            setPhase('results'); // This will trigger cleanup via useEffect
        } catch (error) {
            console.error('Error ending interview:', error);
            Alert.alert('Error', 'Failed to save interview results. Please try again.');
        }
    };

    const cancelEndInterview = () => {
        // Only hide the confirmation modal, don't clean up anything
        setShowEndConfirmation(false);
    };

    const handleRetakeInterview = () => {
        // Clean up everything and restart
        cleanupAllMediaResources();
        setPhase('level-selection');
        setCurrentQuestionIndex(0);
        setResponses([]);
        setTotalScore(0);
        setQuestions([]);
        setCurrentAnswer('');
        setRecordedAudio(null);
        setRecordingTime(0);
        setInterviewId(null);
    };

    const handleGoHome = () => {
        // Clean up everything and go home
        cleanupAllMediaResources();
        router.replace('/(tabs)');
    };

    // Speech-to-text functionality
    const startRecording = async () => {
        if (isRecording) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100,
                }
            });

            const recorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus',
            });

            const chunks: Blob[] = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: 'audio/webm' });
                setRecordedAudio(audioBlob);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());

                // Stop timer
                if (recordingTimerRef.current) {
                    clearInterval(recordingTimerRef.current);
                    recordingTimerRef.current = null;
                }

                // Process speech-to-text
                setIsProcessingSpeech(true);
                try {
                    const result = await speechToText(audioBlob);
                    if (result.text.trim()) {
                        setCurrentAnswer(prev => prev ? `${prev} ${result.text}` : result.text);
                    } else {
                        Alert.alert('No Speech Detected', 'Please try speaking more clearly.');
                    }
                } catch (error) {
                    console.error('Speech-to-text error:', error);
                    Alert.alert('Speech Recognition Error', 'Failed to convert speech to text. Please try again.');
                } finally {
                    setIsProcessingSpeech(false);
                }
            };

            recorder.onerror = (event) => {
                console.error('Recording error:', event);
                Alert.alert('Recording Error', 'Failed to record audio. Please try again.');
                setIsRecording(false);
                stream.getTracks().forEach(track => track.stop());
            };

            setMediaRecorder(recorder);
            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            // Start timer
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Error starting recording:', error);
            if (error instanceof Error) {
                if (error.name === 'NotAllowedError') {
                    Alert.alert('Permission Denied', 'Microphone permission denied. Please allow microphone access.');
                } else if (error.name === 'NotFoundError') {
                    Alert.alert('No Microphone', 'No microphone found. Please connect a microphone.');
                } else {
                    Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
                }
            }
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
            setMediaRecorder(null);
        }
    };

    const playRecording = () => {
        if (!recordedAudio) return;

        if (audioElementRef.current) {
            audioElementRef.current.pause();
        }

        const audioUrl = URL.createObjectURL(recordedAudio);
        audioElementRef.current = new Audio(audioUrl);

        audioElementRef.current.onended = () => {
            setIsPlayingRecording(false);
            URL.revokeObjectURL(audioUrl);
        };

        audioElementRef.current.onerror = () => {
            setIsPlayingRecording(false);
            URL.revokeObjectURL(audioUrl);
            Alert.alert('Playback Error', 'Failed to play recording');
        };

        audioElementRef.current.play();
        setIsPlayingRecording(true);
    };

    const pausePlayback = () => {
        if (audioElementRef.current) {
            audioElementRef.current.pause();
            setIsPlayingRecording(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (phase === 'loading' || isLoading && phase === 'level-selection') {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00d4ff" />
                <Text style={styles.loadingText}>
                    {phase === 'loading' ? 'Loading job details...' : 'Preparing interview...'}
                </Text>
            </View>
        );
    }

    if (phase === 'level-selection') {
        return (
            <View style={styles.container}>
                <InterviewLevelSelector onSelectLevel={handleLevelSelect} />
            </View>
        );
    }

    if (phase === 'interview' && questions.length > 0) {
        const currentQuestion = questions[currentQuestionIndex];

        return (
            <View style={styles.container}>
                {/* Header with Progress and End Button */}
                <View style={styles.headerContainer}>
                    <View style={styles.progressContainer}>
                        <InterviewProgress
                            currentQuestion={currentQuestionIndex + 1}
                            totalQuestions={questions.length}
                            level={currentLevel}
                        />
                    </View>

                    {/* End Interview Button */}
                    <TouchableOpacity
                        onPress={handleEndInterview}
                        style={styles.endButton}
                    >
                        <LinearGradient
                            colors={['#EF4444', '#DC2626']}
                            style={styles.endButtonGradient}
                        >
                            <StopCircle size={20} color="white" />
                            <Text style={styles.endButtonText}>End Interview</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                <View style={styles.interviewContent}>
                    {/* Left Side - Webcam */}
                    <View style={styles.leftPanel}>
                        <WebcamView
                            isActive={true}
                            onCameraReady={() => {}}
                            onCleanup={(cleanupFn) => {
                                webcamCleanupRef.current = cleanupFn;
                            }}
                        />
                    </View>

                    {/* Right Side - Question and Input */}
                    <View style={styles.rightPanel}>
                        {/* Question Display */}
                        <View style={styles.questionSection}>
                            <View style={styles.questionHeader}>
                                <Text style={styles.questionNumber}>Question {currentQuestionIndex + 1}</Text>
                                <View style={styles.questionBadges}>
                                    <View style={[styles.badge, { backgroundColor: '#00d4ff20', borderColor: '#00d4ff40' }]}>
                                        <Text style={[styles.badgeText, { color: '#00d4ff' }]}>{currentQuestion.type}</Text>
                                    </View>
                                    <View style={[styles.badge, { backgroundColor: '#10B98120', borderColor: '#10B98140' }]}>
                                        <Text style={[styles.badgeText, { color: '#10B981' }]}>{currentQuestion.difficulty}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.questionContainer}>
                                <View style={styles.questionHeaderRow}>
                                    <Text style={styles.questionLabel}>Question</Text>
                                    <View style={styles.audioControls}>
                                        <TouchableOpacity
                                            onPress={() => setAutoPlayQuestions(!autoPlayQuestions)}
                                            style={[styles.autoPlayButton, autoPlayQuestions && styles.autoPlayButtonActive]}
                                        >
                                            <Text style={[styles.autoPlayText, autoPlayQuestions && styles.autoPlayTextActive]}>
                                                Auto-play: {autoPlayQuestions ? 'ON' : 'OFF'}
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={toggleQuestionAudio}
                                            style={styles.playQuestionButton}
                                        >
                                            {isPlayingQuestion ? (
                                                <VolumeX size={18} color="#00d4ff" />
                                            ) : (
                                                <Volume2 size={18} color="#00d4ff" />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <Text style={styles.questionText}>{currentQuestion.question}</Text>
                            </View>

                            {/* Voice Agent Info */}
                            <View style={styles.voiceAgentInfo}>
                                <Text style={styles.voiceAgentText}>
                                    🎤 {VOICE_AGENTS[selectedVoiceAgent].name} ({selectedLanguage})
                                    {isPlayingQuestion && ' - Speaking...'}
                                </Text>
                            </View>
                        </View>

                        {/* Answer Input Section */}
                        <View style={styles.answerSection}>
                            <View style={styles.answerHeader}>
                                <Text style={styles.answerLabel}>Your Answer</Text>

                                {/* Recording Status */}
                                {isRecording && (
                                    <View style={styles.recordingStatus}>
                                        <View style={styles.recordingIndicator} />
                                        <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Answer Input */}
                            <TextInput
                                style={styles.answerInput}
                                placeholder="Type your answer here or use voice recording..."
                                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                multiline
                                textAlignVertical="top"
                                value={currentAnswer}
                                onChangeText={setCurrentAnswer}
                                editable={!isLoading && !isRecording && !isProcessingSpeech}
                            />

                            {/* Speech Controls */}
                            <View style={styles.speechControls}>
                                {recordedAudio && (
                                    <TouchableOpacity
                                        onPress={isPlayingRecording ? pausePlayback : playRecording}
                                        style={styles.playButton}
                                    >
                                        {isPlayingRecording ? (
                                            <Pause size={16} color="#00d4ff" />
                                        ) : (
                                            <Play size={16} color="#00d4ff" />
                                        )}
                                        <Text style={styles.playButtonText}>
                                            {isPlayingRecording ? 'Pause' : 'Play Recording'}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    onPress={isRecording ? stopRecording : startRecording}
                                    disabled={isLoading || isProcessingSpeech}
                                    style={[
                                        styles.recordButton,
                                        isRecording && styles.recordingButton,
                                        (isLoading || isProcessingSpeech) && styles.disabledButton,
                                    ]}
                                >
                                    <LinearGradient
                                        colors={
                                            isProcessingSpeech
                                                ? ['#6B7280', '#4B5563']
                                                : isRecording
                                                    ? ['#EF4444', '#DC2626']
                                                    : ['#00d4ff', '#0099cc']
                                        }
                                        style={styles.recordButtonGradient}
                                    >
                                        {isProcessingSpeech ? (
                                            <ActivityIndicator size={16} color="white" />
                                        ) : isRecording ? (
                                            <MicOff size={16} color="white" />
                                        ) : (
                                            <Mic size={16} color="white" />
                                        )}
                                        <Text style={styles.recordButtonText}>
                                            {isProcessingSpeech
                                                ? 'Processing...'
                                                : isRecording
                                                    ? 'Stop Recording'
                                                    : 'Record Answer'
                                            }
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>

                            {/* Submit Button */}
                            <TouchableOpacity
                                onPress={() => handleSubmitAnswer(currentAnswer)}
                                disabled={isLoading || !currentAnswer.trim() || isRecording || isProcessingSpeech}
                                style={[
                                    styles.submitButton,
                                    (isLoading || !currentAnswer.trim() || isRecording || isProcessingSpeech) && styles.submitButtonDisabled
                                ]}
                            >
                                <LinearGradient
                                    colors={
                                        isLoading || !currentAnswer.trim() || isRecording || isProcessingSpeech
                                            ? ['#666', '#666']
                                            : ['#00d4ff', '#0099cc']
                                    }
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
                </View>

                {/* End Interview Confirmation Modal */}
                {showEndConfirmation && (
                    <View style={styles.modalOverlay}>
                        <View style={styles.confirmationModal}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>End Interview?</Text>
                                <TouchableOpacity
                                    onPress={cancelEndInterview}
                                    style={styles.modalCloseButton}
                                >
                                    <X size={24} color="white" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.modalMessage}>
                                {responses.length === 0
                                    ? "You haven't answered any questions yet. Are you sure you want to end the interview?"
                                    : `You've answered ${responses.length} out of ${questions.length} questions. Your progress will be saved and you'll see your results.`
                                }
                            </Text>

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    onPress={cancelEndInterview}
                                    style={styles.cancelButton}
                                >
                                    <Text style={styles.cancelButtonText}>Continue Interview</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={confirmEndInterview}
                                    style={styles.confirmButton}
                                >
                                    <LinearGradient
                                        colors={['#EF4444', '#DC2626']}
                                        style={styles.confirmButtonGradient}
                                    >
                                        <Text style={styles.confirmButtonText}>
                                            {responses.length === 0 ? 'End Interview' : 'View Results'}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        );
    }

    if (phase === 'results') {
        return (
            <InterviewResults
                score={totalScore}
                responses={responses}
                level={currentLevel}
                onRetakeInterview={handleRetakeInterview}
                onGoHome={handleGoHome}
            />
        );
    }

    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00d4ff" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 16,
        fontFamily: 'Inter-Medium',
        marginTop: 16,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 16,
        gap: 16,
    },
    progressContainer: {
        flex: 1,
    },
    endButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    endButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 8,
    },
    endButtonText: {
        color: 'white',
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
    },
    interviewContent: {
        flex: 1,
        flexDirection: width > 768 ? 'row' : 'column',
        padding: 24,
        gap: 24,
    },
    leftPanel: {
        flex: width > 768 ? 0.4 : 1,
        minHeight: width > 768 ? 'auto' : 300,
    },
    rightPanel: {
        flex: width > 768 ? 0.6 : 1,
    },
    questionSection: {
        marginBottom: 24,
    },
    questionHeader: {
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
    questionBadges: {
        flexDirection: 'row',
        gap: 8,
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
        marginBottom: 12,
    },
    questionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    questionLabel: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: '#00d4ff',
    },
    audioControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    autoPlayButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    autoPlayButtonActive: {
        backgroundColor: 'rgba(0, 212, 255, 0.2)',
        borderColor: 'rgba(0, 212, 255, 0.4)',
    },
    autoPlayText: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: 'Inter-Medium',
    },
    autoPlayTextActive: {
        color: '#00d4ff',
    },
    playQuestionButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
    },
    questionText: {
        fontSize: 16,
        color: 'white',
        lineHeight: 24,
        fontFamily: 'Inter-Regular',
    },
    voiceAgentInfo: {
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        alignSelf: 'flex-start',
    },
    voiceAgentText: {
        fontSize: 12,
        color: '#00d4ff',
        fontFamily: 'Inter-Medium',
    },
    answerSection: {
        flex: 1,
    },
    answerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    answerLabel: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: 'white',
    },
    recordingStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    recordingIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
    },
    recordingTime: {
        fontSize: 14,
        color: '#EF4444',
        fontFamily: 'Inter-SemiBold',
    },
    answerInput: {
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
    speechControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
    },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 255, 0.3)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    playButtonText: {
        color: '#00d4ff',
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
    },
    recordButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    recordingButton: {
        // Handled by gradient colors
    },
    disabledButton: {
        opacity: 0.6,
    },
    recordButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 8,
    },
    recordButtonText: {
        color: 'white',
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
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
    confirmationModal: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 24,
        width: '90%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'Inter-Bold',
        color: 'white',
    },
    modalCloseButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    modalMessage: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        lineHeight: 24,
        marginBottom: 24,
        fontFamily: 'Inter-Regular',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
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
    confirmButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    confirmButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: 'white',
        fontFamily: 'Inter-Bold',
        fontSize: 16,
    },
});
