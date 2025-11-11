import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useSettings } from '../hooks/useSettings';
import { usePlayer } from '../hooks/usePlayer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GAME_CONFIG } from '../constants/config';
//import { LinearGradient } from 'expo-linear-gradient';

// Composant pour afficher les coeurs
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

// Carte de défi quotidien
const DailyChallengeCard = ({ theme }) => {
  return (
    // <LinearGradient
    //   colors={[theme.primary, theme.secondary]}
    //   start={{ x: 0, y: 0 }}
    //   end={{ x: 1, y: 1 }}
    //   style={[styles.challengeCard, { borderColor: theme.primary }]}
    // >
    <View style={[styles.challengeCard, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
      <View style={styles.challengeIconContainer}>
        <MaterialCommunityIcons name="calendar-star" size={36} color={theme.text} />
      </View>
      <View style={styles.challengeContent}>
        <Text style={[styles.challengeTitle, { color: theme.text }]}>Défi du Jour</Text>
        <Text style={[styles.challengeDescription, { color: theme.text }]}>
          Terminez le Quiz Difficile en 1 min pour gagner 500 XP !
        </Text>
        <TouchableOpacity style={[styles.challengeButton, { backgroundColor: theme.text }]}>
          <Text style={[styles.challengeButtonText, { color: theme.background }]}>Participer</Text>
        </TouchableOpacity>
      </View>
      </View>
    // </LinearGradient>
  );
};

// Bouton avec icône
const IconButton = ({ title, icon, onPress, theme, color }) => {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.iconButton, { backgroundColor: theme.card }]}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
      <Text style={[styles.iconButtonText, { color: theme.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// Section de recommandation de jeu
const GameRecommendation = ({ theme }) => {
  return (
    <View style={[styles.gameRecommendation, { backgroundColor: theme.card }]}>
      <Image
        source={{ uri: 'https://example.com/game-image.jpg' }}
        style={styles.gameImage}
      />
      <View style={styles.gameInfo}>
        <Text style={[styles.gameTitle, { color: theme.text }]}>Snake</Text>
        <Text style={[styles.gameDescription, { color: theme.textSecondary }]}>
          Jeu de serpent classique
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
    </View>
  );
};

const HomeScreen = () => {
  const { theme, fontSize } = useSettings();
  const { xp } = usePlayer();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header */}
      <View style={styles.header}>
        <LifeHearts />
        <View style={[styles.xpContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.xpText, { color: theme.text, fontSize: fontSize + 2 }]}>
            {xp} XP
          </Text>
          <MaterialCommunityIcons name="star-four-points" size={24} color={theme.secondary} />
        </View>
      </View>

      {/* Section principale */}
      <Text style={[styles.title, { color: theme.text, fontSize: fontSize + 8 }]}>
        Bienvenue sur Smart Game
      </Text>

      {/* Daily Challenge */}
      <DailyChallengeCard theme={theme} />

      {/* Actions rapides */}
      <View style={styles.quickActions}>
        <IconButton
          title="Quick Play"
          icon="gamepad-variant"
          onPress={() => {}}
          theme={theme}
          color={theme.primary}
        />
        <IconButton
          title="Boutique"
          icon="shopping"
          onPress={() => {}}
          theme={theme}
          color={theme.primary}
        />
        <IconButton
          title="Classement"
          icon="trophy"
          onPress={() => {}}
          theme={theme}
          color={theme.primary}
        />
      </View>

      {/* Section Recommandations */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recommandé pour vous</Text>
        <GameRecommendation theme={theme} />
      </View>

      {/* Section Actualités */}
      <View style={[styles.newsSection, { backgroundColor: theme.card }]}>
        <Text style={[styles.newsTitle, { color: theme.text }]}>Actualités</Text>
        <View style={styles.newsItem}>
          <Text style={[styles.newsText, { color: theme.text }]}>
            Nouveau jeu disponible : Memory
          </Text>
          <Text style={[styles.newsDate, { color: theme.textSecondary }]}>24 mai 2023</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
    padding: 8,
    borderRadius: 20,
    paddingHorizontal: 12,
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
  challengeCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  challengeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  challengeContent: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  challengeDescription: {
    fontSize: 14,
    marginBottom: 10,
  },
  challengeButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  challengeButtonText: {
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  iconButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 2,
  },
  iconButtonText: {
    marginTop: 5,
    fontSize: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  gameRecommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    elevation: 2,
  },
  gameImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 15,
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  gameDescription: {
    fontSize: 12,
  },
  newsSection: {
    padding: 15,
    borderRadius: 15,
    elevation: 2,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  newsItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  newsText: {
    fontSize: 14,
  },
  newsDate: {
    fontSize: 12,
    marginTop: 5,
  },
});

export default HomeScreen;
