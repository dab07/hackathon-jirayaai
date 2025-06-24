import 'dotenv/config';

export default {
    expo: {
        name: "hackathon-jirayaai",
        slug: "hackathon-jirayaai",
        version: "1.0.0",
        extra: {
            geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
            elevenlabsApiKey: process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY,
        },
    },
};
