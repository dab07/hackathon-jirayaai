import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Settings as SettingsIcon,
    Bell,
    Moon,
    Volume2,
    Shield,
    HelpCircle,
    Info,
    ChevronRight
} from 'lucide-react-native';

export default function SettingsTab() {
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(true);
    const [soundEffects, setSoundEffects] = useState(true);

    const settingsGroups = [
        {
            title: 'Preferences',
            items: [
                {
                    icon: Bell,
                    label: 'Notifications',
                    type: 'toggle',
                    value: notifications,
                    onToggle: setNotifications,
                },
                {
                    icon: Moon,
                    label: 'Dark Mode',
                    type: 'toggle',
                    value: darkMode,
                    onToggle: setDarkMode,
                },
                {
                    icon: Volume2,
                    label: 'Sound Effects',
                    type: 'toggle',
                    value: soundEffects,
                    onToggle: setSoundEffects,
                },
            ],
        },
        {
            title: 'Account',
            items: [
                {
                    icon: Shield,
                    label: 'Privacy & Security',
                    type: 'navigation',
                    onPress: () => console.log('Privacy settings'),
                },
            ],
        },
        {
            title: 'Support',
            items: [
                {
                    icon: HelpCircle,
                    label: 'Help & Support',
                    type: 'navigation',
                    onPress: () => console.log('Help'),
                },
                {
                    icon: Info,
                    label: 'About',
                    type: 'navigation',
                    onPress: () => console.log('About'),
                },
            ],
        },
    ];

    return (
        <ScrollView style={styles.container}>
            <LinearGradient
                colors={['#0a0a0a', '#1a1a2e']}
                style={styles.gradient}
            >
                {/* Header */}
                <View style={styles.header}>
                    <SettingsIcon size={32} color="#00d4ff" />
                    <Text style={styles.title}>Settings</Text>
                    <Text style={styles.subtitle}>Customize your interview experience</Text>
                </View>

                {/* Settings Groups */}
                {settingsGroups.map((group, groupIndex) => (
                    <View key={groupIndex} style={styles.settingsGroup}>
                        <Text style={styles.groupTitle}>{group.title}</Text>
                        <View style={styles.groupContainer}>
                            {group.items.map((item, itemIndex) => {
                                const IconComponent = item.icon;
                                return (
                                    <TouchableOpacity
                                        key={itemIndex}
                                        style={[
                                            styles.settingItem,
                                            itemIndex === group.items.length - 1 && styles.lastItem,
                                        ]}
                                        onPress={item.onPress}
                                        disabled={item.type === 'toggle'}
                                    >
                                        <View style={styles.settingLeft}>
                                            <IconComponent size={20} color="#00d4ff" />
                                            <Text style={styles.settingLabel}>{item.label}</Text>
                                        </View>

                                        {item.type === 'toggle' ? (
                                            <Switch
                                                value={item.value}
                                                onValueChange={item.onToggle}
                                                trackColor={{ false: '#333', true: '#00d4ff' }}
                                                thumbColor={item.value ? '#fff' : '#ccc'}
                                            />
                                        ) : (
                                            <ChevronRight size={20} color="rgba(255, 255, 255, 0.4)" />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ))}

                {/* App Version */}
                <View style={styles.versionContainer}>
                    <Text style={styles.versionText}>Version 1.0.0</Text>
                    <Text style={styles.versionSubtext}>© 2025 Jiraya. All rights reserved.</Text>
                </View>
            </LinearGradient>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    gradient: {
        flex: 1,
        paddingTop: 60,
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginTop: 16,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        fontFamily: 'Inter-Regular',
    },
    settingsGroup: {
        marginBottom: 32,
    },
    groupTitle: {
        fontSize: 18,
        fontFamily: 'Inter-Bold',
        color: 'white',
        marginBottom: 12,
    },
    groupContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    lastItem: {
        borderBottomWidth: 0,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingLabel: {
        color: 'white',
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        marginLeft: 12,
    },
    versionContainer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    versionText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        marginBottom: 4,
    },
    versionSubtext: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontFamily: 'Inter-Regular',
        fontSize: 12,
    },
});
