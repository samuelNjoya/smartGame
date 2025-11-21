// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSettings } from '../hooks/useSettings';
import { RootStackParamList } from './types';
import MainTabs from './MainTabs';
import { StatusBar } from 'expo-status-bar';
import SplashScreen from '../components/SplashScreen'; // Assurez-vous que le chemin est correct

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { theme, isDarkMode } = useSettings();

  // Créer un thème de navigation personnalisé
  const navigationTheme = {
    ...(isDarkMode ? DarkTheme : DefaultTheme),
    colors: {
      ...DefaultTheme.colors,
      primary: theme.primary,
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.background, // Pas de bordure
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Stack.Navigator
        initialRouteName="Splash" // Définir Splash comme écran initial
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        {/* Pile principale avec les onglets */}
        <Stack.Screen name="Main" component={MainTabs} />
        {/* Vous pouvez ajouter des écrans modaux globaux ici */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;