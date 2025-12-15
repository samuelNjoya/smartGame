// App.tsx
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { PlayerProvider } from './src/contexts/PlayerContext';
import AppNavigator from './src/navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';

// Empêche le splash de se cacher automatiquement
SplashScreen.preventAutoHideAsync().catch(() => {
  console.warn('SplashScreen prevention failed');
});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Charge les fonts, initialise, etc. (si tu en as)
        // Pour l'instant, juste un délai
        await new Promise(resolve => setTimeout(resolve, 500)); // ⭐ 0.5s seulement
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        // ⭐⭐ IMPORTANT : Cache le splash ici
        await SplashScreen.hideAsync().catch(() => {
          console.warn('SplashScreen hide failed');
        });
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null; // ⭐⭐ Ça c'est le problème ! Pendant ce temps, écran vide
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <PlayerProvider>
          <AppNavigator />
        </PlayerProvider>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}