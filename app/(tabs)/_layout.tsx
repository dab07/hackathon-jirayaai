import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Brain, User, Settings, DollarSign } from 'lucide-react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#1a1a1a',
                    borderTopColor: 'rgba(0, 212, 255, 0.2)',
                    borderTopWidth: 1,
                    paddingBottom: 8,
                    paddingTop: 8,
                    height: 70,
                },
                tabBarActiveTintColor: '#00d4ff',
                tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
                tabBarLabelStyle: {
                    fontFamily: 'Inter-Medium',
                    fontSize: 12,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ size, color }) => (
                        <Home size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="interview"
                options={{
                    title: 'Interview',
                    tabBarIcon: ({ size, color }) => (
                        <Brain size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="pricing"
                options={{
                    title: 'Pricing',
                    tabBarIcon: ({ size, color }) => (
                        <DollarSign size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ size, color }) => (
                        <User size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ size, color }) => (
                        <Settings size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
