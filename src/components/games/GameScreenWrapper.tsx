// src/components/games/GameScreenWrapper.tsx
import React, { useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import { useSettings } from '../../hooks/useSettings';

interface GameScreenWrapperProps {
  children: React.ReactNode;
  gameId: string;
}

const GameScreenWrapper = ({ children, gameId }: GameScreenWrapperProps) => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useSettings();
  const { isDailyChallenge } = route.params || {};

  useEffect(() => {
    // Si c'est un défi quotidien, désactiver le header
    if (isDailyChallenge) {
      navigation.setOptions({
        headerShown: false
      });
    }

    return () => {
      // Nettoyer quand le composant se démonte
      if (isDailyChallenge) {
        navigation.setOptions({
          headerShown: true
        });
      }
    };
  }, [isDailyChallenge, navigation]);

  // Si c'est un défi quotidien, afficher un indicateur de chargement pendant la transition
  if (isDailyChallenge && !route.params?.difficulty) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return <>{children}</>;
};

export default GameScreenWrapper;