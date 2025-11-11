// src/screens/DifficultySelectScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameStackParamList } from '../navigation/types';
import { useSettings } from '../hooks/useSettings';
import { GameDifficulty, MAX_LEVELS } from '../constants/gameData'; // NOUVEL IMPORT

type Props = NativeStackScreenProps<GameStackParamList, 'DifficultySelect'>;

const difficulties: { key: GameDifficulty; label: string; color: string }[] = [
  { key: 'easy', label: 'Facile', color: '#4CAF50' }, // Vert
  { key: 'medium', label: 'Moyen', color: '#FFC107' }, // Jaune
  { key: 'hard', label: 'Difficile', color: '#F44336' }, // Rouge
];

const DifficultySelectScreen = ({ route, navigation }: Props) => {
  const { theme } = useSettings();
  const { gameId, gameName } = route.params;

  const handleSelectDifficulty = (difficulty: GameDifficulty) => {
    // Navigue vers l'écran de sélection de niveau
    navigation.navigate('LevelSelect', {
      gameId,
      gameName,
      difficulty,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        {gameName}
      </Text>
      <Text style={[styles.subtitle, { color: theme.text }]}>
        Sélectionnez la difficulté :
      </Text>

      {difficulties.map((d) => (
        <View key={d.key} style={styles.buttonContainer}>
          <Text style={[styles.levelCount, { color: theme.text }]}>
            {MAX_LEVELS[d.key]} niveaux disponibles
          </Text>
          <Button
            title={d.label}
            onPress={() => handleSelectDifficulty(d.key)}
            color={d.color}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
  },
  buttonContainer: {
    width: '80%',
    marginVertical: 15,
  },
  levelCount: {
    textAlign: 'center',
    marginBottom: 5,
    fontSize: 14,
  }
});

export default DifficultySelectScreen;