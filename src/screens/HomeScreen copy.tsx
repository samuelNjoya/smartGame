// src/screens/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useSettings } from '../hooks/useSettings';
import { usePlayer } from '../hooks/usePlayer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GAME_CONFIG } from '../constants/config';
import HomeCarousel from '../components/HomeCarousel';

// AJOUT : Fonction formatTime (réutilisée du modal)
const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Un composant pour afficher les coeurs
const LifeHearts = () => {

  const { lives,regenJobs } = usePlayer(); // AJOUT : regenJobs pour le timer
  const { theme } = useSettings();
  const [timeLeft, setTimeLeft] = useState('00:00');  // AJOUT : State pour le timer

  // AJOUT : useEffect pour updater le timer si jobs actifs
  useEffect(() => {
    if (regenJobs.length > 0) {
      const firstJob = regenJobs[0];
      const updateTimer = () => {
        const remaining = firstJob.endTime - Date.now();
        if (remaining <= 0) {
          setTimeLeft('00:00');
          // Optionnel : Ici, tu peux trigger une recharge via usePlayer si besoin
        } else {
          setTimeLeft(formatTime(remaining));
        }
      };
      
      updateTimer();  // Immédiat
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);  // Cleanup anti-leak !
    } else {
      setTimeLeft('00:00');  // Reset si pas de job
    }
  }, [regenJobs]);  // Dépendance : re-run si jobs changent

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
  // AJOUT : Affichage du timer seulement si actif
  const showTimer = timeLeft !== '00:00';

  return (
    <View style={styles.heartsContainer}>
      <View style={styles.heartsRow}>{hearts}</View>  {/* Row pour cœurs */}
      {showTimer && (
        <Text style={[styles.timerText, { color: theme.primary }]}>
          Prochaine vie : {timeLeft}
        </Text>
      )}
    </View>
  );
  //return <View style={styles.heartsContainer}>{hearts}</View>;
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
          <MaterialCommunityIcons name="star-four-points" size={18} color={theme.secondary} />
        </View>
      </View>
      
      <Text style={[styles.title, { color: theme.text, fontSize: fontSize + 6 }]}>
        Bienvenue sur Smart Game
      </Text>
      
      {/* TODO: Daily Challenge Card */}
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Défi du Jour</Text>
        <Text style={{ color: theme.text }}>Terminez Rapidement le défis du jour pour remporter un mega bonus</Text>
      </View>
     
         {/* Intégration du carousel */}
      <HomeCarousel />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
heartsContainer: {
    alignItems: 'center',  // MODIFIÉ : Centré pour timer sous cœurs
  },
  heartsRow: {  // AJOUT : Nouveau style pour row des cœurs
    flexDirection: 'row',
  },
  timerText: {  // AJOUT : Style pour le timer (discret)
    fontSize: 12,
    fontWeight: '500',
    marginTop: 5,
    textAlign: 'center',
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 5,
    borderRadius: 15,
  },
  xpText: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  card: {
    padding: 20,
    borderRadius: 10,
    //marginBottom: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default HomeScreen;