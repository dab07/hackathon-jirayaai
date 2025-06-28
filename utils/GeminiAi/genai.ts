import { GoogleGenAI } from '@google/genai';
import { Alert } from "react-native";
import Constants from 'expo-constants';

export interface Question {
    question: string;
    type: 'technical' | 'behavioral' | 'scenario' | 'resume-based';
    difficulty: 'easy' | 'medium' | 'hard';
    expectedAnswer?: string;
}
type DifficultyLevel = 1 | 2 | 3;

export const generateQuestions = async (
    jobTitle: string,
    jobDescription: string,
    skills: string[],
    level: number,
    yearsExperience: number,
    resumeText?: string | null,
    previousAnswers?: string[]
): Promise<Question[]> => {
    const difficultyMap: Record<DifficultyLevel, string> = {
        1: 'entry-level to basic',
        2: 'intermediate to advanced',
        3: 'advanced with adaptive difficulty'
    };

    const questionCounts: Record<DifficultyLevel, string> = {
        1: '5-8',
        2: '10-15',
        3: '10-15'
    };

    // Calculate question distribution
    const totalQuestions = level === 1 ? 6 : level === 2 ? 12 : 12;
    const resumeQuestions = resumeText ? (level === 1 ? 2 : 3) : 0;
    const regularQuestions = totalQuestions - resumeQuestions;

    let prompt = `Generate ${questionCounts[level]} interview questions for a ${jobTitle} position with ${yearsExperience} years of experience.

Job Description: ${jobDescription}
Required Skills: ${skills.join(', ')}
Difficulty Level: ${difficultyMap[level]}

${level === 3 && previousAnswers?.length ?
        `Previous answers provided: ${previousAnswers.join('. ')}
    Adapt the difficulty and focus based on the candidate's previous responses.` : ''
    }

${resumeText ? `
IMPORTANT: Generate ${resumeQuestions} questions specifically based on the candidate's resume content below. These should be personalized questions about their actual experience, projects, and achievements mentioned in their resume.

Resume Content:
${resumeText.substring(0, 3000)}${resumeText.length > 3000 ? '...' : ''}

For resume-based questions:
- Ask about specific projects, technologies, or experiences mentioned in the resume
- Question their experience with technologies they've listed
- These questions should have type: "resume-based"

Generate ${regularQuestions} additional standard interview questions covering technical, behavioral, and scenario-based topics.
` : ''}

Return questions in JSON format with the following structure:
{
  "questions": [
    {
      "question": "Question text",
      "type": "technical|behavioral|scenario|resume-based",
      "difficulty": "easy|medium|hard",
      "expectedAnswer": "Brief description of what a good answer should include"
    }
  ]
}

Make sure questions are:
- Relevant to the job role and skills
- Progressive in difficulty
- Mix of technical, behavioral, scenario-based${resumeText ? ', and resume-based' : ''}
- Realistic for the experience level
${resumeText ? `- ${resumeQuestions} questions should be specifically about their resume content` : ''}`;

    try {
        const apiKey = Constants.expoConfig?.extra?.geminiApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('API key not configured. Please check your .env file');
        }

        const ai = new GoogleGenAI({
            apiKey: apiKey,
        });

        const config = {
            responseMimeType: 'text/plain',
        };

        const model = 'gemini-2.0-flash-exp';
        const contents = [
            {
                role: 'user',
                parts: [
                    {
                        text: prompt,
                    },
                ],
            },
        ];

        const response = await ai.models.generateContentStream({
            model,
            config,
            contents,
        });

        let fullResponse = '';
        for await (const chunk of response) {
            fullResponse += chunk.text;
        }

        let trimFullResponse = fullResponse.trim();

        // Clean up the response to extract JSON
        if (trimFullResponse.startsWith('```json')) {
            trimFullResponse = trimFullResponse.replace('```json', '').replace(/\s*```$/, '');
        } else if (trimFullResponse.startsWith('```')) {
            trimFullResponse = trimFullResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        let parsedGeminiResponse: any;
        try {
            parsedGeminiResponse = JSON.parse(trimFullResponse);
            const questions = parsedGeminiResponse.questions || [];

            // Validate that we have resume-based questions if resume was provided
            if (resumeText) {
                const resumeBasedQuestions = questions.filter((q: Question) => q.type === 'resume-based');
                console.log(`Generated ${resumeBasedQuestions.length} resume-based questions out of ${questions.length} total questions`);
            }

            return questions;
        } catch (parseError) {
            console.error('Error parsing JSON response:', parseError);
            return generateFallbackQuestions(jobTitle, level, resumeText);
        }

    } catch (error) {
        console.error('Error generating interview questions:', error);
        Alert.alert('Error', 'Failed to generate interview questions. Using fallback questions.');
        return generateFallbackQuestions(jobTitle, level, resumeText);
    }
};

export async function evaluateAnswer(
    question: string,
    answer: string,
    expectedAnswer: string,
    jobTitle: string
): Promise<{ score: number; feedback: string }> {
    const prompt = `Evaluate this interview answer for a ${jobTitle} position:

Question: ${question}
Candidate's Answer: ${answer}
Expected Answer Guide: ${expectedAnswer}

Provide a score (0-100) and constructive feedback in JSON format:
{
  "score": 85,
  "feedback": "Your detailed feedback here"
}

Scoring criteria:
- Technical accuracy (40%)
- Communication clarity (30%)
- Problem-solving approach (30%)

Be constructive and specific in feedback.`;

    try {
        const apiKey = Constants.expoConfig?.extra?.geminiApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('API key not configured. Please check your .env file');
        }

        const ai = new GoogleGenAI({
            apiKey: apiKey,
        });

        const config = {
            responseMimeType: 'text/plain',
        };

        const model = 'gemini-2.0-flash-exp';
        const contents = [
            {
                role: 'user',
                parts: [
                    {
                        text: prompt,
                    },
                ],
            },
        ];

        const response = await ai.models.generateContentStream({
            model,
            config,
            contents,
        });

        let fullResponse = '';
        for await (const chunk of response) {
            fullResponse += chunk.text;
        }

        let trimFullResponse = fullResponse.trim();

        // Clean up the response to extract JSON
        if (trimFullResponse.startsWith('```json')) {
            trimFullResponse = trimFullResponse.replace('```json', '').replace(/\s*```$/, '');
        } else if (trimFullResponse.startsWith('```')) {
            trimFullResponse = trimFullResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const jsonMatch = trimFullResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in response');
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Error evaluating answer:', error);
        return {
            score: 70,
            feedback: 'Unable to evaluate answer at this time. Please try again.'
        };
    }
}

function generateFallbackQuestions(jobTitle: string, level: number, resumeText?: string | null): Question[] {
    const basicQuestions = [
        {
            question: `Tell me about your experience with ${jobTitle} responsibilities.`,
            type: 'behavioral' as const,
            difficulty: 'easy' as const,
            expectedAnswer: 'Should mention relevant experience and specific examples'
        },
        {
            question: 'What motivates you in your work?',
            type: 'behavioral' as const,
            difficulty: 'easy' as const,
            expectedAnswer: 'Should show passion and alignment with role'
        },
        {
            question: `What technical skills do you consider most important for a ${jobTitle}?`,
            type: 'technical' as const,
            difficulty: 'medium' as const,
            expectedAnswer: 'Should mention relevant technical skills and explain why'
        },
        {
            question: 'Describe a challenging project you worked on recently.',
            type: 'scenario' as const,
            difficulty: 'medium' as const,
            expectedAnswer: 'Should include problem, solution, and results'
        },
        {
            question: 'How do you stay updated with industry trends?',
            type: 'behavioral' as const,
            difficulty: 'easy' as const,
            expectedAnswer: 'Should mention specific resources and learning habits'
        },
        {
            question: `How would you handle a situation where you disagree with your team lead about a technical decision?`,
            type: 'behavioral' as const,
            difficulty: 'medium' as const,
            expectedAnswer: 'Should demonstrate communication skills and professional conflict resolution'
        },
        {
            question: `Walk me through how you would approach debugging a complex issue in production.`,
            type: 'technical' as const,
            difficulty: 'hard' as const,
            expectedAnswer: 'Should show systematic approach, tools knowledge, and problem-solving methodology'
        },
        {
            question: 'Where do you see yourself in 5 years?',
            type: 'behavioral' as const,
            difficulty: 'easy' as const,
            expectedAnswer: 'Should show career planning and alignment with company growth'
        }
    ];

    // Add resume-based questions if resume text is available
    const resumeBasedQuestions = resumeText ? [
        {
            question: 'I see from your resume that you have experience with various technologies. Can you tell me about a specific project where you had to learn a new technology quickly?',
            type: 'resume-based' as const,
            difficulty: 'medium' as const,
            expectedAnswer: 'Should describe a specific learning experience and how they adapted'
        },
        {
            question: 'Looking at your background, what would you say is your greatest professional achievement and why?',
            type: 'resume-based' as const,
            difficulty: 'medium' as const,
            expectedAnswer: 'Should highlight a significant accomplishment with measurable impact'
        },
        {
            question: 'Based on your experience, how do you approach working in team environments?',
            type: 'resume-based' as const,
            difficulty: 'easy' as const,
            expectedAnswer: 'Should demonstrate collaboration skills and team experience'
        }
    ] : [];

    const allQuestions = [...basicQuestions, ...resumeBasedQuestions];
    const questionCount = level === 1 ? 5 : level === 2 ? 8 : 10;

    return allQuestions.slice(0, questionCount);
}
