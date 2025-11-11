// src/screens/GameListScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, Button, FlatList, TouchableOpacity } from 'react-native';
import { useSettings } from '../hooks/useSettings';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameStackParamList } from '../navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GAMES } from '../constants/gameData'; // NOUVEL IMPORT

type Props = NativeStackScreenProps<GameStackParamList, 'GameList'>;

// Composant réutilisable pour afficher chaque jeu
const GameListItem = ({ game, theme, navigation }: any) => {
  const handlePress = () => {
    // Navigue vers l'écran de sélection de difficulté
    navigation.navigate('DifficultySelect', { 
      gameId: game.id, 
      gameName: game.name 
    });
  };

  return (
    <TouchableOpacity 
      style={[styles.gameCard, { backgroundColor: theme.card }]} 
      onPress={handlePress}
    >
      <MaterialCommunityIcons name={game.icon} size={40} color={theme.primary} />
      <Text style={[styles.gameName, { color: theme.text }]}>
        {game.name}
      </Text>
      <Text style={[styles.gameHint, { color: theme.text }]}>
        Choisir la difficulté ➡️
      </Text>
    </TouchableOpacity>
  );
};

const GameListScreen = ({ navigation }: Props) => {
  const { theme } = useSettings();
  // Suppression de la logique 'lives' et 'modalVisible' ici, 
  // car l'utilisateur ne dépense une vie qu'au lancement d'un NIVEAU.

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        🕹️ Choisissez un Jeu
      </Text>
      
      <FlatList
        data={GAMES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GameListItem game={item} theme={theme} navigation={navigation} />
        )}
        contentContainerStyle={styles.listContent}
      />
      
      {/* Suppression du NoLivesModal : Il sera affiché au moment de L'APPUIS sur un niveau réel. */}
      {/* ... */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 40,
  },
  gameCard: {
    marginVertical: 10,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  gameName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  gameHint: {
    fontSize: 12,
    marginTop: 5,
  },
});

export default GameListScreen;