import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Initialize ElevenLabs client
const elevenlabs = new ElevenLabsClient({
    apiKey: Constants.expoConfig?.extra?.elevenLabsApiKey || process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY,
});

// Multi-language voice configurations
export const VOICE_AGENTS = {
    JESSICA: {
        id: "cgSgspJ2msm6clMCkdW9",
        name: "Jessica",
        language: "English",
        accent: "American",
        description: "Professional, clear female voice",
        modelId: "eleven_multilingual_v2",
        supportedLanguages: ["english"],
    },
    BLONDIE: {
        id: "exsUS4vynmxd379XN4yO",
        name: "Blondie",
        language: "English",
        accent: "British",
        description: "Warm, friendly female voice",
        modelId: "eleven_multilingual_v2",
        supportedLanguages: ["english"],
    },
    SAYURI: {
        id: "l39JidvAMB3s85XyNSRd",
        name: "Sayuri",
        language: "Japanese-English",
        accent: "American-Japanese",
        description: "Bilingual voice with Japanese accent",
        modelId: "eleven_multilingual_v2",
        supportedLanguages: ["english", "japanese"],
    },
    FRANCO: {
        id: "kulszILr6ees0ArU8miO",
        name: "Franco",
        language: "French",
        accent: "Parisian",
        description: "Sophisticated French male voice",
        modelId: "eleven_multilingual_v2",
        supportedLanguages: ["french", "english"],
    },
} as const;

// Language-specific voice settings
export const LANGUAGE_VOICE_SETTINGS = {
    english: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
    },
    french: {
        stability: 0.6,
        similarity_boost: 0.8,
        style: 0.1,
        use_speaker_boost: true,
    },
    japanese: {
        stability: 0.7,
        similarity_boost: 0.7,
        style: 0.2,
        use_speaker_boost: true,
    },
} as const;

export interface TextToSpeechOptions {
    voiceAgent?: keyof typeof VOICE_AGENTS;
    language?: 'english' | 'french' | 'japanese';
    modelId?: string;
    outputFormat?: string;
    customVoiceSettings?: typeof LANGUAGE_VOICE_SETTINGS.english;
}

export interface SpeechToTextOptions {
    modelId?: string;
    language?: string;
    detectLanguage?: boolean;
    useWebSpeechAPI?:boolean;
}

export interface TextToSpeechResponse {
    audioUrl: string;
    audioBlob: Blob;
    duration?: number;
    voiceUsed: string;
    language: string;
}

export interface SpeechToTextResponse {
    text: string;
    confidence: number;
    detectedLanguage?: string;
    originalLanguage?: string;
}

/**
 * Get voice agent by language preference
 */
export const getVoiceByLanguage = (language: string): keyof typeof VOICE_AGENTS => {
    switch (language.toLowerCase()) {
        case 'french':
        case 'fr':
            return 'FRANCO';
        case 'japanese':
        case 'ja':
        case 'jp':
            return 'SAYURI';
        case 'english-uk':
        case 'british':
            return 'BLONDIE';
        default:
            return 'JESSICA';
    }
};

/**
 * Auto-detect language and select appropriate voice
 */
export const detectLanguageAndVoice = (text: string): {
    language: string;
    voiceAgent: keyof typeof VOICE_AGENTS;
} => {
    // Simple language detection based on character patterns
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
    const hasFrench = /[àâäéèêëïîôöùûüÿç]/i.test(text) ||
        /\b(le|la|les|un|une|des|et|ou|mais|donc|car|ni|or)\b/i.test(text);

    if (hasJapanese) {
        return { language: 'japanese', voiceAgent: 'SAYURI' };
    } else if (hasFrench) {
        return { language: 'french', voiceAgent: 'FRANCO' };
    } else {
        return { language: 'english', voiceAgent: 'JESSICA' };
    }
};

/**
 * Check if voice agent supports the target language
 */
export const isVoiceCompatible = (
    voiceAgent: keyof typeof VOICE_AGENTS,
    language: string
): boolean => {
    const agent = VOICE_AGENTS[voiceAgent];
    return agent.supportedLanguages.includes(language.toLowerCase());
};

/**
 * Convert text to speech with multi-language support
 */
export const textToSpeech = async (
    text: string,
    options: TextToSpeechOptions = {}
): Promise<TextToSpeechResponse> => {
    try {
        // Validate input
        if (!text || text.trim().length === 0) {
            throw new Error('Text cannot be empty');
        }

        if (text.length > 5000) {
            throw new Error('Text is too long. Maximum 5000 characters allowed.');
        }

        // Check if platform supports audio
        if (Platform.OS !== 'web') {
            console.warn('Text-to-speech is optimized for web platform');
        }

        // Auto-detect language if not specified
        let { voiceAgent, language } = options.voiceAgent && options.language
            ? { voiceAgent: options.voiceAgent, language: options.language }
            : detectLanguageAndVoice(text);

        // Override with user preferences if provided
        if (options.voiceAgent) {
            voiceAgent = options.voiceAgent;
        }
        if (options.language) {
            language = options.language;
        }

        // Check voice compatibility and fallback if needed
        if (!isVoiceCompatible(voiceAgent, language)) {
            console.warn(`Voice ${voiceAgent} doesn't support ${language}, falling back to compatible voice`);
            voiceAgent = getVoiceByLanguage(language);
        }

        const selectedVoice = VOICE_AGENTS[voiceAgent];
        const voiceSettings = options.customVoiceSettings ||
            LANGUAGE_VOICE_SETTINGS[language as keyof typeof LANGUAGE_VOICE_SETTINGS] ||
            LANGUAGE_VOICE_SETTINGS.english;

        const {
            modelId = selectedVoice.modelId,
            outputFormat = "mp3_44100_128",
        } = options;

        console.log(`Converting text to speech using ${selectedVoice.name} (${selectedVoice.language}) for ${language} text`);

        // Generate speech - Fixed property name
        const response = await elevenlabs.textToSpeech.stream(selectedVoice.id, {
            text: text.trim(),
            modelId: modelId, // Fixed: was model_id
            outputFormat: outputFormat as any, // Fixed: proper typing
            voiceSettings: voiceSettings,
        });

        // Convert stream to blob
        const chunks: Uint8Array[] = [];
        const reader = response.getReader();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }

        // Create blob from chunks
        const audioBlob = new Blob(chunks, { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);

        console.log(`Text-to-speech conversion successful with ${selectedVoice.name}`);

        return {
            audioUrl,
            audioBlob,
            duration: estimateAudioDuration(text, language),
            voiceUsed: selectedVoice.name,
            language: selectedVoice.language,
        };

    } catch (error) {
        console.error('Text-to-speech error:', error);

        // Provide more specific error messages
        if (error instanceof Error) {
            if (error.message.includes('quota')) {
                throw new Error('ElevenLabs quota exceeded. Please try again later.');
            } else if (error.message.includes('unauthorized')) {
                throw new Error('Invalid ElevenLabs API key. Please check your configuration.');
            } else if (error.message.includes('network')) {
                throw new Error('Network error. Please check your internet connection.');
            }
        }

        throw new Error(`Text-to-speech failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Convert speech to text with multi-language support
 */
export const speechToText = async (
    audioBlob: Blob,
    options: SpeechToTextOptions = {}
): Promise<SpeechToTextResponse> => {
    try {
        // Validate input
        if (!audioBlob || audioBlob.size === 0) {
            throw new Error('Audio data cannot be empty');
        }

        // Check file size (ElevenLabs has limits)
        const maxSize = 25 * 1024 * 1024; // 25MB
        if (audioBlob.size > maxSize) {
            throw new Error('Audio file is too large. Maximum 25MB allowed.');
        }

        // Check if platform supports audio processing
        if (Platform.OS !== 'web') {
            console.warn('Speech-to-text is optimized for web platform');
        }

        const {
            modelId = "scribe_v1",
            language,
            detectLanguage = true,
        } = options;

        console.log('Converting speech to text...');
        console.log('Audio blob size:', audioBlob.size, 'bytes');
        console.log('Audio blob type:', audioBlob.type);
        console.log('Model ID:', modelId);

        // Convert MP4 to WAV if needed, as ElevenLabs prefers WAV format
        let processedBlob = audioBlob;
        let fileName = 'audio.wav';
        let fileType = 'audio/wav';

        if (audioBlob.type.includes('mp4')) {
            console.log('Converting MP4 to WAV format...');
            try {
                processedBlob = await convertAudioToWav(audioBlob);
                console.log('Conversion successful, new size:', processedBlob.size);
            } catch (conversionError) {
                console.warn('Audio conversion failed, using original:', conversionError);
                // Fall back to original if conversion fails
                fileName = 'audio.mp3'; // Try MP3 extension for MP4 audio
                fileType = 'audio/mpeg';
            }
        } else if (audioBlob.type.includes('webm')) {
            fileName = 'audio.webm';
            fileType = audioBlob.type;
        }

        // Create file with proper name and type
        const audioFile = new File([processedBlob], fileName, {
            type: fileType
        });

        console.log('Created file:', fileName, 'size:', audioFile.size, 'type:', fileType);

        // Prepare request options - try different parameter formats
        const requestOptions = {
            file: audioFile,
            model_id: modelId, // Try underscore format first
        };

        // Add language if specified
        if (language && !detectLanguage) {
            requestOptions.language = language;
        }

        console.log('Request options:', {
            fileName: audioFile.name,
            fileSize: audioFile.size,
            fileType: audioFile.type,
            model_id: requestOptions.model_id,
            language: requestOptions.language || 'auto-detect'
        });

        let response;
        try {
            // Try with model_id first
            response = await elevenlabs.speechToText.convert(requestOptions);
        } catch (modelError) {
            console.log('Trying with modelId instead of model_id...');
            // If model_id fails, try with modelId
            const altRequestOptions = {
                file: audioFile,
                modelId: modelId, // Try camelCase format
            };

            if (language && !detectLanguage) {
                altRequestOptions.language = language;
            }

            response = await elevenlabs.speechToText.convert(altRequestOptions);
        }

        console.log('Speech-to-text conversion successful');

        return {
            text: response.text || '',
            confidence: 0.8,
            detectedLanguage: undefined,
            originalLanguage: language,
        };

    } catch (error) {
        console.error('Speech-to-text error:', error);

        // Enhanced error handling
        if (error instanceof Error) {
            const errorMessage = error.message.toLowerCase();

            if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
                throw new Error('ElevenLabs quota exceeded. Please try again later.');
            } else if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
                throw new Error('Invalid ElevenLabs API key. Please check your configuration.');
            } else if (errorMessage.includes('invalid_model_id')) {
                throw new Error('Invalid model ID. Please use "scribe_v1" or "scribe_v1_experimental".');
            } else if (errorMessage.includes('unsupported') || errorMessage.includes('format')) {
                throw new Error('Audio format not supported. Converting to WAV format failed.');
            } else if (errorMessage.includes('invalid_parameters')) {
                throw new Error('Invalid request parameters. Audio file may be corrupted or empty.');
            } else if (errorMessage.includes('400')) {
                throw new Error('Bad request. Audio format may not be supported or file is corrupted.');
            }
        }

        throw new Error(`Speech-to-text failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

// Helper function to convert audio to WAV
const convertAudioToWav = async (audioBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const fileReader = new FileReader();

        fileReader.onload = async (e) => {
            try {
                const arrayBuffer = e.target?.result as ArrayBuffer;
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                // Convert to WAV
                const wavArrayBuffer = audioBufferToWav(audioBuffer);
                const wavBlob = new Blob([wavArrayBuffer], { type: 'audio/wav' });

                resolve(wavBlob);
            } catch (error) {
                console.error('Audio conversion error:', error);
                reject(error);
            }
        };

        fileReader.onerror = () => reject(new Error('Failed to read audio file'));
        fileReader.readAsArrayBuffer(audioBlob);
    });
};

// Helper function to convert AudioBuffer to WAV
const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bytesPerSample = 2;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const bufferSize = 44 + dataSize;

    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bytesPerSample * 8, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Convert audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
            const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(offset, intSample, true);
            offset += 2;
        }
    }

    return arrayBuffer;
};

const getFileExtension = (mimeType: string): string => {
    const mimeToExt: { [key: string]: string } = {
        'audio/webm': '.webm',
        'audio/mp4': '.mp4',
        'audio/ogg': '.ogg',
        'audio/wav': '.wav',
        'audio/mpeg': '.mp3',
        'audio/mp3': '.mp3',
    };

    return mimeToExt[mimeType] || '.webm';
};

/**
 * Get available voices with language information
 */
export const getAvailableVoices = async () => {
    try {
        const response = await elevenlabs.voices.getAll();
        return response.voices.map(voice => ({
            id: voice.voiceId, // Fixed: was voice_id
            name: voice.name,
            category: voice.category,
            description: voice.description,
            previewUrl: voice.previewUrl,
            settings: voice.settings,
            labels: voice.labels,
        }));
    } catch (error) {
        console.error('Error fetching voices:', error);
        throw new Error('Failed to fetch available voices');
    }
};

/**
 * Get voice agent information
 */
export const getVoiceAgentInfo = (agentKey: keyof typeof VOICE_AGENTS) => {
    return VOICE_AGENTS[agentKey];
};

/**
 * Get all available voice agents
 */
export const getAllVoiceAgents = () => {
    return Object.entries(VOICE_AGENTS).map(([key, agent]) => ({
        key: key as keyof typeof VOICE_AGENTS,
        ...agent,
    }));
};

/**
 * Test voice agent with sample text
 */
export const testVoiceAgent = async (
    agentKey: keyof typeof VOICE_AGENTS,
    sampleText?: string
): Promise<TextToSpeechResponse> => {
    const agent = VOICE_AGENTS[agentKey];
    const defaultTexts = {
        JESSICA: "Hello! I'm Jessica, your English interview assistant. I'm here to help you practice.",
        BLONDIE: "Hello there! I'm Blondie, and I'll be conducting your interview today. Shall we begin?",
        SAYURI: "Hello! I'm Sayuri. I can help you practice in both English and Japanese.",
        FRANCO: "Bonjour! Je suis Franco, votre assistant d'entretien en français. Comment allez-vous?",
    };

    const text = sampleText || defaultTexts[agentKey];

    // Use appropriate language for the voice agent
    const language = agentKey === 'FRANCO' ? 'french' : 'english';

    return textToSpeech(text, {
        voiceAgent: agentKey,
        language,
    });
};

/**
 * Get user's subscription info and usage
 */
export const getUserInfo = async () => {
    try {
        const response = await elevenlabs.user.get();
        return {
            subscription: response.subscription,
            charactersUsed: response.subscription?.characterCount || 0,
            charactersLimit: response.subscription?.characterLimit || 0,
            canUseInstantVoiceCloning: false, // Fixed: property doesn't exist
            canUseProfessionalVoiceCloning: false, // Fixed: property doesn't exist
        };
    } catch (error) {
        console.error('Error fetching user info:', error);
        throw new Error('Failed to fetch user information');
    }
};

/**
 * Utility function to estimate audio duration based on text length and language
 */
const estimateAudioDuration = (text: string, language: string = 'english'): number => {
    // Different languages have different speaking rates
    const wordsPerMinute = {
        english: 155,
        french: 145,
        japanese: 120, // Slower due to syllabic nature
    };

    const wpm = wordsPerMinute[language as keyof typeof wordsPerMinute] || wordsPerMinute.english;
    const words = text.trim().split(/\s+/).length;
    return Math.ceil((words / wpm) * 60); // Return duration in seconds
};

/**
 * Utility function to validate audio format
 */
export const isValidAudioFormat = (file: File): boolean => {
    const validTypes = [
        'audio/wav',
        'audio/mpeg',
        'audio/mp3',
        'audio/m4a',
        'audio/aac',
        'audio/ogg',
        'audio/webm',
    ];
    return validTypes.includes(file.type);
};

/**
 * Cleanup function to revoke object URLs and free memory
 */
export const cleanupAudioUrl = (audioUrl: string) => {
    if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
    }
};

// Export default configuration for easy access
export const defaultConfig = {
    voiceAgent: 'JESSICA' as keyof typeof VOICE_AGENTS,
    language: 'english' as const,
    modelId: "eleven_multilingual_v2",
    outputFormat: "mp3_44100_128",
} as const;
