// src/screens/LeaderboardScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Button, Alert } from 'react-native';
import { useSettings } from '../hooks/useSettings';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';

// Données simulées pour le classement local
// Dans une vraie app, vous liriez ceci depuis AsyncStorage
type ScoreEntry = {
  id: string;
  rank: number;
  game: string;
  difficulty: 'Facile' | 'Moyen' | 'Difficile';
  score: number;
};

const FAKE_SCORES: ScoreEntry[] = [
  { id: '1', rank: 1, game: 'Memory', difficulty: 'Difficile', score: 1250 },
  { id: '2', rank: 2, game: 'Quiz', difficulty: 'Difficile', score: 1100 },
  { id: '3', rank: 3, game: 'Snake', difficulty: 'Moyen', score: 980 },
  { id: '4', rank: 4, game: 'Memory', difficulty: 'Moyen', score: 850 },
  { id: '5', rank: 5, game: 'Quiz', difficulty: 'Facile', score: 500 },
  { id: '6', rank: 6, game: 'Snake', difficulty: 'Facile', score: 300 },
];

const LeaderboardScreen = () => {
  const { theme, fontSize } = useSettings();
  const [scores, setScores] = useState(FAKE_SCORES);

  const exportToCSV = () => {
    // Pour un export réel, utilisez 'expo-sharing' et 'expo-file-system'
    // ou une bibliothèque comme 'react-native-csv'
    Alert.alert(
      "Exporter en CSV",
      "Cette fonctionnalité générera un fichier CSV de vos scores. (Simulation)"
    );
  };
  
  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700'; // Or
    if (rank === 2) return '#C0C0C0'; // Argent
    if (rank === 3) return '#CD7F32'; // Bronze
    return theme.text;
  };

  const renderScoreItem = ({ item, index }: { item: ScoreEntry; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateX: -50 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 300, delay: index * 50 }}
      style={[styles.scoreRow, { backgroundColor: theme.card }]}
    >
      <View style={styles.rankContainer}>
        <MaterialCommunityIcons
          name={item.rank <= 3 ? "trophy-variant" : "numeric"}
          size={24}
          color={getRankColor(item.rank)}
        />
        <Text style={[styles.rankText, { color: getRankColor(item.rank) }]}>
          {item.rank}
        </Text>
      </View>
      <View style={styles.gameInfo}>
        <Text style={[styles.gameText, { color: theme.text, fontSize: fontSize }]}>{item.game}</Text>
        <Text style={[styles.difficultyText, { color: theme.text }]}>{item.difficulty}</Text>
      </View>
      <Text style={[styles.scoreText, { color: theme.primary, fontSize: fontSize }]}>
        {item.score} pts
      </Text>
    </MotiView>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text, fontSize: fontSize + 8 }]}>
        Classement Local
      </Text>
      
      <Button
        title="Exporter les scores (CSV)"
        onPress={exportToCSV}
        color={theme.primary}
      />

      <FlatList
        data={scores}
        renderItem={renderScoreItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <Text style={[styles.headerText, { color: theme.text, flex: 2 }]}>Rang</Text>
            <Text style={[styles.headerText, { color: theme.text, flex: 3 }]}>Jeu</Text>
            <Text style={[styles.headerText, { color: theme.text, flex: 2, textAlign: 'right' }]}>Score</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  list: {
    marginTop: 20,
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    elevation: 2,
  },
  rankContainer: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  gameInfo: {
    flex: 3,
  },
  gameText: {
    fontWeight: 'bold',
  },
  difficultyText: {
    fontSize: 12,
  },
  scoreText: {
    flex: 2,
    fontWeight: 'bold',
    textAlign: 'right',
  },
});

export default LeaderboardScreen;