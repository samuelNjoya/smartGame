// App.tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { PlayerProvider } from './src/contexts/PlayerContext';
import AppNavigator from './src/navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // Important pour Snake

export default function App() {
  return (
    // GestureHandler doit être à la racine pour les gestes
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <PlayerProvider>
          {/* AppNavigator gère le changement de thème pour la barre de statut */}
          <AppNavigator />
        </PlayerProvider>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}