// src/navigation/MainTabs.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Types
import { MainTabsParamList } from './types';

// Écrans
import HomeScreen from '../screens/HomeScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DailyChallengeScreen from '../screens/DailyChallengeScreen';
import GameStack from './GameStack'; // Pile de jeux
import { useSettings } from '../hooks/useSettings';

const Tab = createBottomTabNavigator<MainTabsParamList>();

const MainTabs = () => {
  const { theme } = useSettings();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.text,
        tabBarStyle: { backgroundColor: theme.card },
        headerStyle: { backgroundColor: theme.card },
        headerTitleStyle: { color: theme.text },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
          title: 'Accueil',
        }}
      />
      <Tab.Screen
        name="Games"
        component={GameStack} // On imbrique le Stack de Jeux ici
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="gamepad-variant" color={color} size={size} />
          ),
          title: 'Jeux',
          headerShown: false, // Le header sera géré par GameStack
        }}
      />
      <Tab.Screen
        name="DailyChallenge"
        component={DailyChallengeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-star" color={color} size={size} />
          ),
          title: 'Défi du Jour',
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="trophy" color={color} size={size} />
          ),
          title: 'Statistiques',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
          title: 'Profil',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabs;