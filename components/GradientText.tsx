import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

interface GradientTextProps {
    text: string;
    colors: string[];
    style?: any;
}

export const GradientText: React.FC<GradientTextProps> = ({ text, colors, style }) => {
    return (
        <MaskedView
            style={style}
            maskElement={
                <Text style={[styles.text, style]}>
                    {text}
                </Text>
            }
        >
            <LinearGradient
                colors={colors as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.gradient, style]}
            >
                <Text style={[styles.text, style, { opacity: 0 }]}>
                    {text}
                </Text>
            </LinearGradient>
        </MaskedView>
    );
};

const styles = StyleSheet.create({
    text: {
        fontFamily: 'Inter-Bold',
    },
    gradient: {
        flex: 1,
    },
});
