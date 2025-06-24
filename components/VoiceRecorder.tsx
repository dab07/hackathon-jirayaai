import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Mic, Square, Play, Pause } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { speechToText, cleanupAudioUrl } from '@/utils/GeminiAi/elevenlabs';


interface VoiceRecorderProps {
    onRecordingComplete: (text: string, audioBlob: Blob) => void;
    onRecordingStart?: () => void;
    onRecordingStop?: () => void;
    onError?: (error: string) => void;
    maxDuration?: number; // in seconds
    disabled?: boolean;
}

export default function VoiceRecorder({
                                          onRecordingComplete,
                                          onRecordingStart,
                                          onRecordingStop,
                                          onError,
                                          maxDuration = 300, // 5 minutes default
                                          disabled = false,
                                      }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [hasRecording, setHasRecording] = useState(false);
    const [supportedMimeType, setSupportedMimeType] = useState<string>('');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioUrlRef = useRef<string | null>(null);

    // Check browser compatibility and supported MIME types on mount
    useEffect(() => {
        if (Platform.OS === 'web') {
            checkBrowserCompatibility();
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, []);

    const checkBrowserCompatibility = () => {
        // Check for required APIs
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn('MediaDevices API not supported');
            return;
        }

        if (!window.MediaRecorder) {
            console.warn('MediaRecorder API not supported');
            return;
        }

        // Test MIME types in order of preference
        const mimeTypes = [
            'audio/webm;codecs=opus',
            'audio/webm;codecs=vp8,opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/ogg',
            'audio/wav',
            'audio/mp4;codecs=mp4a.40.2',
            'audio/mp4',
            'audio/mpeg',
            'audio/aac',
            '', // Empty string as last resort
        ];

        for (const mimeType of mimeTypes) {
            if (MediaRecorder.isTypeSupported(mimeType)) {
                setSupportedMimeType(mimeType);
                console.log('Selected MIME type:', mimeType || 'default');
                break;
            }
        }

        // Log browser info for debugging
        console.log('Browser:', navigator.userAgent);
        console.log('MediaRecorder supported:', !!window.MediaRecorder);
        console.log('getUserMedia supported:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
    };

    const cleanup = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioUrlRef.current) {
            cleanupAudioUrl(audioUrlRef.current);
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };

    const startTimer = () => {
        timerRef.current = setInterval(() => {
            setRecordingTime(prev => {
                const newTime = prev + 1;
                if (newTime >= maxDuration) {
                    stopRecording();
                    return maxDuration;
                }
                return newTime;
            });
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const startRecording = async () => {
        if (Platform.OS !== 'web') {
            onError?.('Voice recording is only supported on web platform');
            return;
        }

        // Check for required APIs
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            onError?.('Voice recording is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
            return;
        }

        if (!window.MediaRecorder) {
            onError?.('MediaRecorder is not supported in this browser. Please use a modern browser.');
            return;
        }

        try {
            console.log('Requesting microphone access...');

            // Request microphone permission with multiple fallback strategies
            let stream: MediaStream;

            try {
                // Strategy 1: Try with optimal settings
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        sampleRate: 44100,
                        channelCount: 1,
                    }
                });
                console.log('Using optimal audio settings');
            } catch (optimalError) {
                console.warn('Optimal audio settings failed, trying standard settings:', optimalError);

                try {
                    // Strategy 2: Try with standard settings
                    stream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true,
                        }
                    });
                    console.log('Using standard audio settings');
                } catch (standardError) {
                    console.warn('Standard audio settings failed, trying basic settings:', standardError);

                    // Strategy 3: Fallback to basic audio
                    stream = await navigator.mediaDevices.getUserMedia({
                        audio: true
                    });
                    console.log('Using basic audio settings');
                }
            }

            streamRef.current = stream;
            chunksRef.current = [];

            console.log('Microphone access granted, creating MediaRecorder...');

            // Use the pre-determined supported MIME type
            let mimeType = supportedMimeType;

            // If no supported type was found during initialization, try again
            if (!mimeType) {
                const fallbackTypes = [
                    'audio/webm;codecs=opus',
                    'audio/webm',
                    'audio/ogg;codecs=opus',
                    'audio/wav',
                    'audio/mp4',
                    '',
                ];

                mimeType = fallbackTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';
            }

            console.log('Using MIME type for recording:', mimeType || 'browser default');

            // Create MediaRecorder with or without MIME type
            let mediaRecorder: MediaRecorder;

            try {
                if (mimeType) {
                    mediaRecorder = new MediaRecorder(stream, { mimeType });
                } else {
                    // Let browser choose default
                    mediaRecorder = new MediaRecorder(stream);
                }
            } catch (mimeError) {
                console.warn('Failed to create MediaRecorder with MIME type, using default:', mimeError);
                // Fallback to browser default
                mediaRecorder = new MediaRecorder(stream);
            }

            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                console.log('Data available:', event.data.size, 'bytes, type:', event.data.type);
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                console.log('Recording stopped, processing audio...');

                // Use the actual MIME type from the recorded data
                const actualMimeType = chunksRef.current.length > 0 ? chunksRef.current[0].type : 'audio/webm';
                const audioBlob = new Blob(chunksRef.current, { type: actualMimeType });

                console.log('Created audio blob:', {
                    size: audioBlob.size,
                    type: audioBlob.type,
                    chunks: chunksRef.current.length
                });

                if (audioBlob.size === 0) {
                    onError?.('No audio data recorded. Please try again.');
                    resetRecording();
                    return;
                }

                setHasRecording(true);

                // Create audio URL for playback
                if (audioUrlRef.current) {
                    cleanupAudioUrl(audioUrlRef.current);
                }
                audioUrlRef.current = URL.createObjectURL(audioBlob);

                // Process speech-to-text
                await processAudio(audioBlob);
            };

            mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event);
                const error = (event as any).error;
                let errorMessage = 'Recording failed. Please try again.';

                if (error) {
                    if (error.name === 'NotSupportedError') {
                        errorMessage = 'Audio recording format not supported. Please try a different browser.';
                    } else if (error.name === 'SecurityError') {
                        errorMessage = 'Recording blocked by security settings. Please check your browser permissions.';
                    } else {
                        errorMessage = `Recording error: ${error.message}`;
                    }
                }

                onError?.(errorMessage);
                resetRecording();
            };

            mediaRecorder.onstart = () => {
                console.log('Recording started successfully');
                console.log('MediaRecorder state:', mediaRecorder.state);
                console.log('MediaRecorder MIME type:', mediaRecorder.mimeType);
            };

            // Start recording with data collection interval
            console.log('Starting MediaRecorder...');

            try {
                mediaRecorder.start(1000); // Collect data every second
            } catch (startError) {
                console.error('Failed to start recording:', startError);
                throw new Error(`Failed to start recording: ${startError}`);
            }

            setIsRecording(true);
            setRecordingTime(0);
            startTimer();
            onRecordingStart?.();

            console.log('Recording setup complete');

        } catch (error) {
            console.error('Error starting recording:', error);

            // Cleanup on error
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }

            if (error instanceof Error) {
                if (error.name === 'NotAllowedError') {
                    onError?.('Microphone permission denied. Please allow microphone access and try again.');
                } else if (error.name === 'NotFoundError') {
                    onError?.('No microphone found. Please connect a microphone and try again.');
                } else if (error.name === 'NotSupportedError') {
                    onError?.('Audio recording is not supported in this browser. Please use Chrome, Firefox, or Safari.');
                } else if (error.name === 'NotReadableError') {
                    onError?.('Microphone is being used by another application. Please close other apps and try again.');
                } else if (error.name === 'OverconstrainedError') {
                    onError?.('Microphone settings are not supported. Please try again.');
                } else if (error.name === 'AbortError') {
                    onError?.('Recording was interrupted. Please try again.');
                } else {
                    onError?.(`Recording failed: ${error.message}. Please check your microphone and try again.`);
                }
            } else {
                onError?.('Failed to start recording. Please check your microphone and try again.');
            }

            resetRecording();
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            console.log('Stopping recording...');

            try {
                mediaRecorderRef.current.stop();
            } catch (stopError) {
                console.error('Error stopping recording:', stopError);
            }

            setIsRecording(false);
            stopTimer();
            onRecordingStop?.();

            // Stop all tracks
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        }
    };

    const processAudio = async (audioBlob: Blob) => {
        setIsProcessing(true);

        try {
            console.log('Processing audio blob:', {
                size: audioBlob.size,
                type: audioBlob.type
            });

            const result = await speechToText(audioBlob);

            if (result.text && result.text.trim().length > 0) {
                console.log('Speech-to-text successful:', result.text.substring(0, 100) + '...');
                onRecordingComplete(result.text.trim(), audioBlob);
            } else {
                onError?.('No speech detected. Please try speaking more clearly.');
            }
        } catch (error) {
            console.error('Speech-to-text error:', error);
            onError?.(error instanceof Error ? error.message : 'Failed to process audio');
        } finally {
            setIsProcessing(false);
        }
    };

    const playRecording = () => {
        if (!audioUrlRef.current) return;

        if (audioRef.current) {
            audioRef.current.pause();
        }

        audioRef.current = new Audio(audioUrlRef.current);
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.onerror = (e) => {
            console.error('Audio playback error:', e);
            setIsPlaying(false);
            onError?.('Failed to play recording');
        };

        audioRef.current.play().catch(playError => {
            console.error('Failed to play audio:', playError);
            setIsPlaying(false);
            onError?.('Failed to play recording');
        });

        setIsPlaying(true);
    };

    const pausePlayback = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const resetRecording = () => {
        cleanup();
        setIsRecording(false);
        setIsProcessing(false);
        setIsPlaying(false);
        setRecordingTime(0);
        setHasRecording(false);
        chunksRef.current = [];
    };

    const handleMainButtonPress = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getMainButtonContent = () => {
        if (isProcessing) {
            return (
                <Text style={styles.processingText}>
                    Processing...
                </Text>
            );
        }

        if (isRecording) {
            return <Square size={24} color="white" fill="white" />;
        }

        return <Mic size={24} color="white" />;
    };

    const getMainButtonColors = () => {
        if (isProcessing) {
            return ['#6B7280', '#4B5563'];
        }
        if (isRecording) {
            return ['#EF4444', '#DC2626'];
        }
        return ['#00d4ff', '#0099cc'];
    };

    // Show browser compatibility warning if needed
    if (Platform.OS === 'web' && (!navigator.mediaDevices || !window.MediaRecorder)) {
        return (
            <View style={styles.container}>
                <View style={styles.warningContainer}>
                    <Text style={styles.warningTitle}>Browser Not Supported</Text>
                    <Text style={styles.warningText}>
                        Voice recording requires a modern browser. Please use:
                    </Text>
                    <Text style={styles.warningList}>
                        • Chrome 47+{'\n'}
                        • Firefox 25+{'\n'}
                        • Safari 14+{'\n'}
                        • Edge 79+
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Browser Compatibility Info */}
            {Platform.OS === 'web' && supportedMimeType && (
                <Text style={styles.debugInfo}>
                    Audio format: {supportedMimeType || 'browser default'}
                </Text>
            )}

            {/* Main Record Button */}
            <TouchableOpacity
                onPress={handleMainButtonPress}
                disabled={disabled || isProcessing}
                style={[
                    styles.recordButton,
                    isRecording && styles.recordingButton,
                    (disabled || isProcessing) && styles.disabledButton,
                ]}
            >
                <LinearGradient
                    colors={getMainButtonColors() as [string, string, ...string[]]}
                    style={styles.buttonGradient}
                >
                    {getMainButtonContent()}
                </LinearGradient>
            </TouchableOpacity>

            {/* Recording Timer */}
            {(isRecording || recordingTime > 0) && (
                <Text style={styles.timerText}>
                    {formatTime(recordingTime)}
                    {maxDuration && ` / ${formatTime(maxDuration)}`}
                </Text>
            )}

            {/* Status Text */}
            <Text style={styles.statusText}>
                {isProcessing
                    ? 'Converting speech to text...'
                    : isRecording
                        ? 'Recording... Tap to stop'
                        : hasRecording
                            ? 'Recording complete'
                            : 'Tap to record your answer'
                }
            </Text>

            {/* Playback Controls */}
            {hasRecording && !isRecording && (
                <View style={styles.playbackControls}>
                    <TouchableOpacity
                        onPress={isPlaying ? pausePlayback : playRecording}
                        style={styles.playButton}
                    >
                        {isPlaying ? (
                            <Pause size={20} color="#00d4ff" />
                        ) : (
                            <Play size={20} color="#00d4ff" />
                        )}
                        <Text style={styles.playButtonText}>
                            {isPlaying ? 'Pause' : 'Play'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={resetRecording}
                        style={styles.resetButton}
                    >
                        <Text style={styles.resetButtonText}>Record Again</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: 16,
    },
    warningContainer: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        maxWidth: 300,
    },
    warningTitle: {
        fontSize: 16,
        fontFamily: 'Inter-Bold',
        color: '#EF4444',
        marginBottom: 8,
    },
    warningText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginBottom: 8,
        fontFamily: 'Inter-Regular',
    },
    warningList: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'left',
        fontFamily: 'Inter-Regular',
    },
    debugInfo: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: 8,
        fontFamily: 'Inter-Regular',
    },
    recordButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    recordingButton: {
        transform: [{ scale: 1.1 }],
    },
    disabledButton: {
        opacity: 0.6,
    },
    buttonGradient: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    processingText: {
        color: 'white',
        fontSize: 12,
        fontFamily: 'Inter-SemiBold',
        textAlign: 'center',
    },
    timerText: {
        marginTop: 12,
        fontSize: 18,
        color: '#00d4ff',
        fontFamily: 'Inter-Bold',
    },
    statusText: {
        marginTop: 8,
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        fontFamily: 'Inter-Medium',
        textAlign: 'center',
        maxWidth: 250,
    },
    playbackControls: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 12,
    },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 255, 0.3)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 6,
    },
    playButtonText: {
        color: '#00d4ff',
        fontSize: 12,
        fontFamily: 'Inter-SemiBold',
    },
    resetButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    resetButtonText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12,
        fontFamily: 'Inter-SemiBold',
    },
});
