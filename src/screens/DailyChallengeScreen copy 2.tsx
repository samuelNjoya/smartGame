import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';

import { useSettings } from '../hooks/useSettings';
import { usePlayer } from '../hooks/usePlayer';
import DailyChallengeService, { ChallengeStatus, DailyChallengeConfig } from '../services/DailyChallengeService';
import { GameStackParamList } from '../navigation/types';
import DailyChallengeNavigation from '../services/DailyChallengeNavigation'; // ⭐⭐⭐ GARDEZ CET IMPORT

// Calcul du temps restant jusqu'à minuit
const getTimeUntilMidnight = () => {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight.getTime() - now.getTime()) / 1000);
  //return 10;
};

// Formatage HH:MM:SS
const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const DailyChallengeScreen = () => {
  const { theme, fontSize } = useSettings();
  const { lives, xp } = usePlayer();
  const navigation = useNavigation<NativeStackNavigationProp<GameStackParamList>>();

  const [challenge, setChallenge] = useState<DailyChallengeConfig | null>(null);
  const [status, setStatus] = useState<ChallengeStatus | 'loading'>('loading');
  const [timeLeft, setTimeLeft] = useState(getTimeUntilMidnight());

  // Recharger le statut à chaque fois qu'on revient sur l'écran
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

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getTimeUntilMidnight();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        console.log('🔄 Minuit passé ! Chargement du nouveau défi...');

        try {
          const todayChallenge = DailyChallengeService.getChallengeForToday();
          setChallenge(todayChallenge);

          const currentStatus =  DailyChallengeService.getStatus(); //await 
          setStatus(currentStatus);
        } catch (error) {
          console.error('Erreur lors du rechargement du défi:', error);
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ⭐⭐⭐ CORRECTION : UTILISEZ DailyChallengeNavigation ⭐⭐⭐
  const handlePlayChallenge = () => {
    if (!challenge) return;

    // Utilisez le service dédié pour une navigation propre
    DailyChallengeNavigation.launchChallenge(navigation, challenge);
  };

  if (status === 'loading' || !challenge) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const isPlayed = status === 'won' || status === 'lost';
  const hasWon = status === 'won';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text, fontSize: fontSize + 8 }]}>
        Défi du Jour
      </Text>

      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring' }}
        style={[
          styles.card,
          {
            backgroundColor: isPlayed ? (hasWon ? theme.success + '20' : theme.error + '20') : theme.card,
            borderColor: isPlayed ? (hasWon ? theme.success : theme.error) : 'transparent',
            borderWidth: isPlayed ? 2 : 0
          }
        ]}
      >
        <MaterialCommunityIcons
          name={isPlayed ? (hasWon ? "check-decagram" : "close-octagon") : challenge.icon as any}
          size={100}
          color={isPlayed ? (hasWon ? theme.success : theme.error) : theme.primary}
          style={{ marginBottom: 20 }}
        />

        <Text style={[styles.challengeTitle, { color: theme.text }]}>
          {isPlayed ? (hasWon ? "Défi Accompli !" : "Défi Échoué") : challenge.gameName}
        </Text>

        <Text style={[styles.challengeDesc, { color: theme.secondary, fontSize: fontSize }]}>
          {isPlayed
            ? (hasWon
              ? "Félicitations ! Revenez demain pour un nouveau challenge."
              : "Dommage ! Vous pourrez retenter votre chance demain.")
            : `Terminez le niveau ${challenge.targetLevel} en mode **${challenge.difficulty.toUpperCase()}** pour gagner ${challenge.bonusXp} XP !`
          }
        </Text>

        {timeLeft > 0 && (
          <View style={styles.timerBox}>
            <MaterialCommunityIcons name="clock-outline" size={20} color={theme.text} />
            <Text style={[styles.timerText, { color: theme.text }]}>
              {isPlayed ? "Prochain défi dans : " : "Expire dans : "}
              {formatTime(timeLeft)}
            </Text>
          </View>
        )}

        <View style={{ width: '100%', marginTop: 20 }}>
          <Button
            title={isPlayed ? "À demain !" : "Relever le défi"}
            onPress={handlePlayChallenge}
            color={isPlayed ? theme.secondary : theme.primary}
            disabled={isPlayed || timeLeft <= 0}
          />
        </View>
      </MotiView>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <MaterialCommunityIcons name="heart" size={24} color={theme.error} />
          <Text style={[styles.statsText, { color: theme.text }]}>{lives}</Text>
        </View>
        <View style={styles.statBox}>
          <MaterialCommunityIcons name="star" size={24} color={theme.accent} />
          <Text style={[styles.statsText, { color: theme.text }]}>{xp} XP</Text>
        </View>
      </View>
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
    fontWeight: 'bold',
    marginBottom: 30,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  challengeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  challengeDesc: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginBottom: 10,
  },
  timerText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  statsContainer: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
  },
  statBox: {
    alignItems: 'center',
    gap: 5
  },
  statsText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default DailyChallengeScreen;