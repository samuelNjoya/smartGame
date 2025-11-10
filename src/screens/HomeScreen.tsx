// src/screens/HomeScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useSettings } from '../hooks/useSettings';
import { usePlayer } from '../hooks/usePlayer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GAME_CONFIG } from '../constants/config';

// Un composant pour afficher les coeurs
const LifeHearts = () => {
  const { lives } = usePlayer();
  const { theme } = useSettings();
  const hearts = [];
  for (let i = 0; i < GAME_CONFIG.MAX_LIVES; i++) {
    hearts.push(
      <MaterialCommunityIcons
        key={i}
        name={i < lives ? 'heart' : 'heart-outline'}
        size={30}
        color={i < lives ? theme.error : theme.text}
      />
    );
  }
  return <View style={styles.heartsContainer}>{hearts}</View>;
};

const HomeScreen = () => {
  const { theme, fontSize } = useSettings();
  const { xp } = usePlayer();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <LifeHearts />
        <View style={styles.xpContainer}>
          <Text style={[styles.xpText, { color: theme.text, fontSize: fontSize }]}>{xp}</Text>
          <MaterialCommunityIcons name="star-four-points" size={24} color={theme.secondary} />
        </View>
      </View>
      
      <Text style={[styles.title, { color: theme.text, fontSize: fontSize + 8 }]}>
        Bienvenue sur Smart Game
      </Text>
      
      {/* TODO: Daily Challenge Card */}
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Défi du Jour</Text>
        <Text style={{ color: theme.text }}>Terminez le Quiz Difficile en 1 min !</Text>
      </View>
      
      <Button title="Quick Play (Jeu Rapide)" color={theme.primary} onPress={() => {}} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  heartsContainer: {
    flexDirection: 'row',
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 8,
    borderRadius: 20,
  },
  xpText: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default HomeScreen;