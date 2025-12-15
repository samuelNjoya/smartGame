// src/screens/DailyChallengeScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

import { useSettings } from '../hooks/useSettings';
import { usePlayer } from '../hooks/usePlayer';
import DailyChallengeService, { ChallengeStatus, DailyChallengeConfig } from '../services/DailyChallengeService';
import { GameStackParamList } from '../navigation/types';
import DailyChallengeNavigation from '../services/DailyChallengeNavigation';

const { width } = Dimensions.get('window');

const getTimeUntilMidnight = () => {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight.getTime() - now.getTime()) / 1000);
};

const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const DailyChallengeScreen = () => {
  const { theme, } = useSettings();
  const { lives, xp } = usePlayer();
  const navigation = useNavigation<NativeStackNavigationProp<GameStackParamList>>();

  const [challenge, setChallenge] = useState<DailyChallengeConfig | null>(null);
  const [status, setStatus] = useState<ChallengeStatus | 'loading'>('loading');
  const [timeLeft, setTimeLeft] = useState(getTimeUntilMidnight());

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const todayChallenge = DailyChallengeService.getChallengeForToday();
        setChallenge(todayChallenge);
        const currentStatus = await DailyChallengeService.getStatus();
        setStatus(currentStatus);
      };
      loadData();
    }, [])
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getTimeUntilMidnight();
      setTimeLeft(remaining);

      if (challenge && (status === 'won' || status === 'lost')) {
        const now = new Date();
        const challengeDate = new Date(challenge.date);
        const isSameDay =
          challengeDate.getFullYear() === now.getFullYear() &&
          challengeDate.getMonth() === now.getMonth() &&
          challengeDate.getDate() === now.getDate();

        if (!isSameDay) {
          DailyChallengeService.getChallengeForToday();
          DailyChallengeService.getStatus().then(setStatus);
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [challenge, status]);

  const handlePlayChallenge = () => {
    if (!challenge) return;
    DailyChallengeNavigation.launchChallenge(navigation, challenge);
  };

  if (status === 'loading' || !challenge) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={styles.loadingCard}
        >
          <MaterialCommunityIcons name="loading" size={60} color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Chargement du défi...</Text>
        </MotiView>
      </View>
    );
  }

  const isPlayed = status === 'won' || status === 'lost';
  const hasWon = status === 'won';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header avec titre */}
      <MotiView
        from={{ translateY: -20, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        style={styles.header}
      >
        <MaterialCommunityIcons
          name="trophy"
          size={32}
          color={theme.primary}
          style={styles.trophyIcon}
        />
        <Text style={[styles.title, { color: theme.text }]}>Défi Quotidien</Text>
        <Text style={[styles.subtitle, { color: theme.secondary }]}>
          Une nouvelle aventure chaque jour
        </Text>
      </MotiView>

      {/* Carte principale du défi */}
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', delay: 100 }}
        style={[styles.mainCard, { backgroundColor: theme.card }]}
      >
        {/* Badge de statut */}
        <View style={[
          styles.statusBadge,
          {
            backgroundColor: isPlayed
              ? (hasWon ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)')
              : 'rgba(33, 150, 243, 0.1)',
            borderColor: isPlayed
              ? (hasWon ? theme.success : theme.error)
              : theme.primary
          }
        ]}>
          <MaterialCommunityIcons
            name={isPlayed ? (hasWon ? "trophy" : "close-circle") : "clock-outline"}
            size={16}
            color={isPlayed ? (hasWon ? theme.success : theme.error) : theme.primary}
          />
          <Text style={[
            styles.statusText,
            { color: isPlayed ? (hasWon ? theme.success : theme.error) : theme.primary }
          ]}>
            {isPlayed ? (hasWon ? "ACCOMPLI" : "ÉCHOUÉ") : "EN ATTENTE"}
          </Text>
        </View>

        {/* Icône du jeu */}
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={isPlayed ? (hasWon ? "check-decagram" : "close-octagon") : challenge.icon as any}
            size={100}
            color={isPlayed ? (hasWon ? theme.success : theme.error) : theme.primary}
            style={{ marginBottom: 2 }}
          />

          <Text style={[styles.challengeTitle, { color: theme.text }]}>
            {isPlayed ? (hasWon ? "Défi Accompli !" : "Défi Échoué") : challenge.gameName}
          </Text>
        </View>

        {/* Informations du défi */}
        <Text style={[styles.challengeDesc, { color: theme.secondary,  }]}>
                  {isPlayed
                    ? (hasWon
                      ? "Félicitations ! Revenez demain pour un nouveau challenge."
                      : "Dommage ! Vous pourrez retenter votre chance demain.")
                    : `Terminez le niveau ${challenge.targetLevel} en mode **${challenge.difficulty.toUpperCase()}** pour gagner ${challenge.bonusXp} XP !`
                  }
                </Text>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <MaterialCommunityIcons
            name="clock-fast"
            size={24}
            color={theme.primary}
          />
            <Text style={[styles.timerLabel, { color: theme.secondary }]}>
              {isPlayed ? "Prochain défi dans" : "Temps restant"}
            </Text>
            <Text style={[styles.timerValue, { color: theme.text }]}>
              {formatTime(timeLeft)}
            </Text>

        </View>

        {/* Bouton d'action */}
        <TouchableOpacity
          onPress={handlePlayChallenge}
          disabled={isPlayed}
          style={[
            styles.actionButton,
            {
              backgroundColor: isPlayed ? theme.secondary : theme.primary,
              opacity: isPlayed ? 0.6 : 1
            }
          ]}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {isPlayed ? "Défi Terminé" : "Commencer le Défi"}
          </Text>
          <MaterialCommunityIcons
            name={isPlayed ? "check-circle" : "play-circle"}
            size={24}
            color="#FFFFFF"
            style={styles.buttonIcon}
          />
        </TouchableOpacity>
      </MotiView>

      {/* Stats du joueur */}
      <MotiView
        from={{ translateY: 20, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        transition={{ delay: 200 }}
        style={[styles.statsCard, , { backgroundColor: theme.card }]}
      >
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="heart" size={28} color={theme.error} />
            <Text style={[styles.statValue, { color: theme.text }]}>{lives}</Text>
            <Text style={[styles.statLabel, { color: theme.secondary }]}>Vies</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <MaterialCommunityIcons name="star-four-points" size={28} color="#FFD700" />
            <Text style={[styles.statValue, { color: theme.text }]}>{xp}</Text>
            <Text style={[styles.statLabel, { color: theme.secondary }]}>XP</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <MaterialCommunityIcons name="calendar-check" size={28} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {status === 'won' ? '1' : '0'}/1
            </Text>
            <Text style={[styles.statLabel, { color: theme.secondary }]}>Défi</Text>
          </View>
        </View>
      </MotiView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  trophyIcon: {
    marginBottom: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 2,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  iconContainer: {
    alignItems: 'center',
   // marginVertical: 2,
  },
  
   challengeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  challengeDesc: {
    textAlign: 'center',
    //lineHeight: 2,
    paddingHorizontal: 10,
  },
  gameName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    padding: 10,
    borderRadius: 16,
    marginBottom: 10,
    marginTop:2,
    gap: 12,
  },
  timerLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  timerValue: {
    fontSize: 14,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default DailyChallengeScreen;