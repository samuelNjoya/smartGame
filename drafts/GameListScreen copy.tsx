// src/screens/GameListScreen.tsx c'est ici qu'on utilise le modal
import React, { useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useSettings } from '../hooks/useSettings';
import { usePlayer } from '../hooks/usePlayer';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameStackParamList } from '../navigation/types';
import NoLivesModal from '../components/layout/NoLivesModal';

type Props = NativeStackScreenProps<GameStackParamList, 'GameList'>;

const GameListScreen = ({ navigation }: Props) => {
  const { theme } = useSettings();
  const { lives } = usePlayer();
  const [modalVisible, setModalVisible] = useState(false);

  // Wrapper de navigation qui vérifie les vies
  const navigateToGame = (game: keyof GameStackParamList, params: any) => {
    if (lives > 0) {
      // @ts-ignore
      navigation.navigate(game, params);
    } else {
      // Plus de vies ! Ouvrir le modal
      setModalVisible(true);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Tous les Jeux</Text>
      
      {/* TODO: Filtres et recherche ici */}
      
      <View style={styles.gameButton}>
        <Button
          title="Jouer à Memory (Moyen)"
          onPress={() => navigateToGame('Memory', { difficulty: 'medium' })}
          color={theme.primary}
        />
      </View>
      
      <View style={styles.gameButton}>
        <Button
          title="Jouer au Quiz (Difficile)"
          onPress={() => navigateToGame('Quiz', { difficulty: 'hard' })}
          color={theme.primary}
        />
      </View>
      
      <View style={styles.gameButton}>
        <Button
          title="Jouer à Snake (Facile)"
          onPress={() => navigateToGame('Snake', { difficulty: 'easy' })}
          color={theme.primary}
        />
      </View>

      {/* Les autres squelettes de jeu */}
      {/* ... */}
      
      <NoLivesModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
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
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  gameButton: {
    marginVertical: 10,
  },
});

export default GameListScreen;