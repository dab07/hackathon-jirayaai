import { create } from 'zustand';
import { Question } from '../GeminiAi/genai';

export interface InterviewStore {
    currentInterview: {
        jobId: string;
        level: number;
        questions: Question[];
        currentQuestionIndex: number;
        responses: Array<{
            question: string;
            answer: string;
            score?: number;
            feedback?: string;
        }>;
        status: 'pending' | 'in_progress' | 'completed';
        totalScore?: number;
    } | null;

    // Actions
    startInterview: (jobId: string, level: number, questions: Question[]) => void;
    submitAnswer: (answer: string) => void;
    nextQuestion: () => void;
    completeInterview: (totalScore: number) => void;
    resetInterview: () => void;
}

export const useInterviewStore = create<InterviewStore>((set, get) => ({
    currentInterview: null,

    startInterview: (jobId: string, level: number, questions: Question[]) => {
        set({
            currentInterview: {
                jobId,
                level,
                questions,
                currentQuestionIndex: 0,
                responses: [],
                status: 'in_progress',
            },
        });
    },

    submitAnswer: (answer: string) => {
        const state = get();
        if (!state.currentInterview) return;

        const currentQuestion = state.currentInterview.questions[state.currentInterview.currentQuestionIndex];
        const newResponse = {
            question: currentQuestion.question,
            answer,
        };

        set({
            currentInterview: {
                ...state.currentInterview,
                responses: [...state.currentInterview.responses, newResponse],
            },
        });
    },

    nextQuestion: () => {
        const state = get();
        if (!state.currentInterview) return;

        set({
            currentInterview: {
                ...state.currentInterview,
                currentQuestionIndex: state.currentInterview.currentQuestionIndex + 1,
            },
        });
    },

    completeInterview: (totalScore: number) => {
        const state = get();
        if (!state.currentInterview) return;

        set({
            currentInterview: {
                ...state.currentInterview,
                status: 'completed',
                totalScore,
            },
        });
    },

    resetInterview: () => {
        set({ currentInterview: null });
    },
}));
