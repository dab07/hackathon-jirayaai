import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
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

    useEffect(() => {
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
                return styles.tagTechnical;
            case 'behavioral':
                return styles.tagBehavioral;
            case 'scenario':
                return styles.tagScenario;
            default:
                return styles.tagDefault;
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy':
                return styles.tagEasy;
            case 'medium':
                return styles.tagMedium;
            case 'hard':
                return styles.tagHard;
            default:
                return styles.tagDefault;
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <Text style={styles.questionNumber}>
                        Question {questionNumber}
                    </Text>
                    <View style={styles.timer}>
                        <Clock size={16} color="#6B7280" />
                        <Text style={styles.timerText}>{formatTime(timeElapsed)}</Text>
                    </View>
                </View>

                <View style={styles.tagsRow}>
                    <View style={[styles.tag, getTypeColor(question.type)]}>
                        <Text style={styles.tagText}>{question.type}</Text>
                    </View>
                    <View style={[styles.tag, getDifficultyColor(question.difficulty)]}>
                        <Text style={styles.tagText}>{question.difficulty}</Text>
                    </View>
                </View>

                <View style={styles.questionBox}>
                    <View style={styles.questionRow}>
                        <MessageCircle size={20} color="#6B7280" style={styles.iconMargin} />
                        <Text style={styles.questionText}>{question.question}</Text>
                    </View>
                </View>
            </View>

            {/* Answer Input */}
            <View style={styles.answerSection}>
                <Text style={styles.answerLabel}>Your Answer</Text>
                <TextInput
                    style={styles.answerInput}
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
                style={[styles.submitButton, (isLoading || !answer.trim()) && styles.disabled]}
            >
                <LinearGradient
                    colors={['#3B82F6', '#1D4ED8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradient}
                >
                    <Send size={20} color="white" />
                    <Text style={styles.submitText}>
                        {isLoading ? 'Processing...' : 'Submit Answer'}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
        backgroundColor: 'white'
    },
    header: {
        marginBottom: 24
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    questionNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827'
    },
    timer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6
    },
    timerText: {
        color: '#6B7280',
        fontFamily: 'Courier',
        marginLeft: 8
    },
    tagsRow: {
        flexDirection: 'row',
        marginBottom: 16
    },
    tag: {
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginRight: 8
    },
    tagText: {
        fontSize: 14,
        fontWeight: '500',
        textTransform: 'capitalize'
    },
    tagTechnical: {
        backgroundColor: '#DBEAFE',
        color: '#1E40AF'
    },
    tagBehavioral: {
        backgroundColor: '#D1FAE5',
        color: '#065F46'
    },
    tagScenario: {
        backgroundColor: '#EDE9FE',
        color: '#5B21B6'
    },
    tagEasy: {
        backgroundColor: '#D1FAE5',
        color: '#065F46'
    },
    tagMedium: {
        backgroundColor: '#FEF3C7',
        color: '#92400E'
    },
    tagHard: {
        backgroundColor: '#FECACA',
        color: '#B91C1C'
    },
    tagDefault: {
        backgroundColor: '#F3F4F6',
        color: '#374151'
    },
    questionBox: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16
    },
    questionRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12
    },
    iconMargin: {
        marginRight: 12,
        marginTop: 4
    },
    questionText: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
        lineHeight: 22
    },
    answerSection: {
        marginBottom: 24
    },
    answerLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12
    },
    answerInput: {
        borderColor: '#D1D5DB',
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        minHeight: 120
    },
    submitButton: {
        borderRadius: 16,
        overflow: 'hidden'
    },
    gradient: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    submitText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
        marginLeft: 8
    },
    disabled: {
        opacity: 0.5
    }
});
