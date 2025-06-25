import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageCircle, Send, Clock } from 'lucide-react-native';
import { Question } from '@/utils/GeminiAi/genai';

interface QuestionCardProps {
    question: Question;
    questionNumber: number;
    onSubmitAnswer: (answer: string) => void;
    isLoading?: boolean;
}

export default function QuestionCard({
                                         question,
                                         questionNumber,
                                         onSubmitAnswer,
                                         isLoading = false
                                     }: QuestionCardProps) {
    const [answer, setAnswer] = useState('');
    const [timeElapsed, setTimeElapsed] = useState(0);

    React.useEffect(() => {
        const timer = setInterval(() => {
            setTimeElapsed(prev => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSubmit = () => {
        if (!answer.trim()) {
            Alert.alert('Answer Required', 'Please provide an answer to continue.');
            return;
        }
        onSubmitAnswer(answer.trim());
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'technical':
                return 'bg-blue-100 text-blue-800';
            case 'behavioral':
                return 'bg-green-100 text-green-800';
            case 'scenario':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy':
                return 'bg-green-100 text-green-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'hard':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <View className="p-6 bg-white">
            {/* Question Header */}
            <View className="mb-6">
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-2xl font-bold text-gray-900">
                        Question {questionNumber}
                    </Text>
                    <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                        <Clock size={16} color="#6B7280" />
                        <Text className="text-gray-600 ml-2 font-mono">{formatTime(timeElapsed)}</Text>
                    </View>
                </View>

                <View className="flex-row mb-4">
                    <View className={`rounded-full px-3 py-1 mr-2 ${getTypeColor(question.type)}`}>
                        <Text className="text-sm font-medium capitalize">{question.type}</Text>
                    </View>
                    <View className={`rounded-full px-3 py-1 ${getDifficultyColor(question.difficulty)}`}>
                        <Text className="text-sm font-medium capitalize">{question.difficulty}</Text>
                    </View>
                </View>

                <View className="bg-gray-50 rounded-2xl p-6">
                    <View className="flex-row items-start mb-3">
                        <MessageCircle size={20} color="#6B7280" className="mr-3 mt-1" />
                        <Text className="text-lg text-gray-900 leading-relaxed flex-1">
                            {question.question}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Answer Input */}
            <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-900 mb-3">Your Answer</Text>
                <TextInput
                    className="border border-gray-300 rounded-2xl p-4 text-base min-h-[120px]"
                    placeholder="Type your answer here..."
                    multiline
                    textAlignVertical="top"
                    value={answer}
                    onChangeText={setAnswer}
                    editable={!isLoading}
                />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading || !answer.trim()}
                className="overflow-hidden rounded-2xl disabled:opacity-50"
            >
                <LinearGradient
                    colors={['#3B82F6', '#1D4ED8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="p-4 flex-row items-center justify-center"
                >
                    <Send size={20} color="white" />
                    <Text className="text-white font-bold text-lg ml-2">
                        {isLoading ? 'Processing...' : 'Submit Answer'}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}
