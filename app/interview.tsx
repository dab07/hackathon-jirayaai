import React, { useState, useEffect } from 'react';
import { View, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/utils/stores/authStore';
import { generateQuestions, evaluateAnswer } from '@/utils/GeminiAi/genai';
import { supabase } from '@/utils/supabase/client';
import InterviewLevelSelector from '../components/InterviewLevelSelector';
import InterviewProgress from '../components/InterviewProgress';
import QuestionCard from '../components/QuestionCard';
import InterviewResults from '../components/InterviewResults';
import AuthModal from '../components/AuthModal';

export default function InterviewScreen() {
    const router = useRouter();
    const { jobTitle, jobDescription, skills, yearsExperience } = useLocalSearchParams<{
        jobTitle: string;
        jobDescription: string;
        skills: string;
        yearsExperience: string;
    }>();

    const { user, profile, refreshProfile } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [phase, setPhase] = useState<'level-selection' | 'interview' | 'results'>('level-selection');
    const [currentLevel, setCurrentLevel] = useState(1);
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [responses, setResponses] = useState<any[]>([]);
    const [totalScore, setTotalScore] = useState(0);
    const [jobDetailId, setJobDetailId] = useState<string | null>(null);
    const [interviewId, setInterviewId] = useState<string | null>(null);

    // Check authentication on mount
    useEffect(() => {
        if (!user) {
            setShowAuthModal(true);
        }
    }, [user]);

    // Check if user has enough tokens
    const checkTokenAvailability = () => {
        if (!profile) return false;
        return profile.tokens_used < profile.tokens_limit;
    };

    const handleLevelSelect = async (level: number) => {
        if (!user || !jobTitle || !jobDescription) {
            Alert.alert('Error', 'Missing required information to start interview');
            return;
        }

        // Check token availability
        if (!checkTokenAvailability()) {
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
        try {
            // Parse skills if it's a string
            let skillsArray: string[] = [];
            if (skills) {
                try {
                    skillsArray = typeof skills === 'string' ? JSON.parse(skills) : skills;
                } catch {
                    skillsArray = [skills]; // If parsing fails, treat as single skill
                }
            }

            const experience = parseInt(yearsExperience) || 0;

            // Create job detail record
            const { data: jobDetail, error: jobError } = await supabase
                .from('job_details')
                .insert({
                    user_id: user.id,
                    job_title: jobTitle,
                    job_description: jobDescription,
                    skills: skillsArray,
                    years_experience: experience,
                })
                .select()
                .single();

            if (jobError) {
                throw new Error('Failed to save job details');
            }

            setJobDetailId(jobDetail.id);

            // Generate questions using AI
            const generatedQuestions = await generateQuestions(
                jobTitle,
                jobDescription,
                skillsArray,
                level,
                experience
            );

            if (generatedQuestions.length === 0) {
                throw new Error('No questions generated');
            }

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
                throw new Error('Failed to create interview record');
            }

            setInterviewId(interview.id);
            setQuestions(generatedQuestions);
            setCurrentLevel(level);
            setPhase('interview');
        } catch (error) {
            console.error('Error starting interview:', error);
            Alert.alert('Error', 'Failed to start interview. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitAnswer = async (answer: string) => {
        if (!questions.length || !jobTitle || !interviewId) return;

        setIsLoading(true);
        try {
            const currentQuestion = questions[currentQuestionIndex];

            // Evaluate answer using AI
            const evaluation = await evaluateAnswer(
                currentQuestion.question,
                answer,
                currentQuestion.expectedAnswer || '',
                jobTitle
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
                    .eq('id', user!.id);

                // Refresh profile to get updated token count
                refreshProfile();
            }

            // Check if interview is complete
            if (currentQuestionIndex + 1 >= questions.length) {
                const avgScore = updatedResponses.reduce((sum, response) =>
                    sum + (response.score || 0), 0) / updatedResponses.length;

                const finalScore = Math.round(avgScore);
                setTotalScore(finalScore);

                // Update interview record
                await supabase
                    .from('interviews')
                    .update({
                        status: 'completed',
                        score: finalScore,
                        tokens_used: tokensUsed * updatedResponses.length, // Rough estimate
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
                        .eq('id', user!.id);
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

    const handleRetakeInterview = () => {
        setPhase('level-selection');
        setCurrentQuestionIndex(0);
        setResponses([]);
        setTotalScore(0);
        setQuestions([]);
        setJobDetailId(null);
        setInterviewId(null);
    };

    const handleGoHome = () => {
        router.replace('/(tabs)');
    };

    const handleAuthSuccess = () => {
        setShowAuthModal(false);
        // User is now authenticated, they can proceed with the interview
    };

    // Show auth modal if user is not authenticated
    if (!user) {
        return (
            <View style={styles.container}>
                <AuthModal
                    isVisible={showAuthModal}
                    onClose={() => {
                        setShowAuthModal(false);
                        router.replace('/(tabs)'); // Redirect to home if they close without signing in
                    }}
                    initialMode="signup"
                />
            </View>
        );
    }

    if (isLoading && phase === 'level-selection') {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00d4ff" />
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
                <InterviewProgress
                    currentQuestion={currentQuestionIndex + 1}
                    totalQuestions={questions.length}
                    level={currentLevel}
                />
                <QuestionCard
                    question={currentQuestion}
                    questionNumber={currentQuestionIndex + 1}
                    onSubmitAnswer={handleSubmitAnswer}
                    isLoading={isLoading}
                />
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
});
