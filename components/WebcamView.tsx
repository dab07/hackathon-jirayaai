import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

interface WebcamViewProps {
    isActive: boolean;
    onCameraReady?: () => void;
    onCleanup?: (cleanupFn: () => void) => void;
}

export default function WebcamView({ isActive, onCameraReady, onCleanup }: WebcamViewProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const stopCamera = () => {
        if (stream) {
            // Stop all tracks to release camera and microphone
            stream.getTracks().forEach(track => {
                track.stop();
                console.log(`Stopped ${track.kind} track:`, track.label);
            });

            // Clear video source
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }

            setStream(null);
            console.log('Camera and microphone resources released');
        }
    };

    useEffect(() => {
        if (Platform.OS === 'web' && isActive) {
            startCamera();
        } else if (stream) {
            stopCamera();
        }

        return () => {
            if (stream) {
                stopCamera();
            }
        };
    }, [isActive]);

    // Provide cleanup function to parent component
    useEffect(() => {
        if (onCleanup) {
            onCleanup(stopCamera);
        }
    }, [stream, onCleanup]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user',
                },
                audio: false,
            });

            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.play();
                onCameraReady?.();
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
        }
    };

    if (Platform.OS !== 'web') {
        return null; // Camera not supported on mobile in this implementation
    }

    return (
        <View style={styles.container}>
            <video
                ref={videoRef}
                style={styles.video}
                autoPlay
                muted
                playsInline
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        borderRadius: 16,
        overflow: 'hidden',
    },
    video: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    } as any,
});
