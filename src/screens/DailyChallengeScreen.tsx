// src/screens/DailyChallengeScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useSettings } from '../hooks/useSettings';
import { usePlayer } from '../hooks/usePlayer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import LottieView from 'lottie-react-native'; // N'oubliez pas d'installer npx expo install lottie-react-native

// Fonction pour formater le temps (HH:MM:SS)
const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const DailyChallengeScreen = () => {
  const { theme, fontSize } = useSettings();
  const { lives, xp } = usePlayer();
  
  // Simulation d'un compte à rebours (ex: 8 heures restantes)
  const [timeLeft, setTimeLeft] = useState(8 * 3600); 

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  const handlePlayChallenge = () => {
    // TODO: Logique pour vérifier les vies et naviguer vers le défi
    // ex: navigation.navigate('GameStack', { screen: 'Quiz', difficulty: 'hard' })
    alert("Lancement du défi ! (Logique de navigation à implémenter)");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text, fontSize: fontSize + 8 }]}>
        Défi du Jour
      </Text>
      
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring' }}
        style={[styles.card, { backgroundColor: theme.card }]}
      >
        {/* <LottieView
          source={require('../../assets/animations/trophy-animation.json')} // Mettez votre animation Lottie ici
          autoPlay
          loop
          style={styles.lottie}
        /> */}

        <MaterialCommunityIcons 
          name="trophy-award" 
          size={150} 
          color={theme.secondary} 
          style={styles.lottie} // On garde le style pour l'espacement
        />
        
        <Text style={[styles.challengeTitle, { color: theme.primary }]}>
          Maître du Quiz !
        </Text>
        
        <Text style={[styles.challengeDesc, { color: theme.text, fontSize: fontSize }]}>
          Terminez le Quiz en difficulté **Difficile** en moins de 2 minutes et gagnez **500 XP** bonus !
        </Text>
        
        <View style={styles.timerBox}>
          <MaterialCommunityIcons name="clock-fast" size={24} color={theme.text} />
          <Text style={[styles.timerText, { color: theme.text }]}>
            Temps restant : {formatTime(timeLeft)}
          </Text>
        </View>
        
        <Button
          title="Relever le défi !"
          onPress={handlePlayChallenge}
          color={theme.primary}
          disabled={timeLeft === 0}
        />
      </MotiView>
      
      <View style={styles.statsContainer}>
        <Text style={[styles.statsText, { color: theme.text }]}>Vos Vies: {lives}</Text>
        <Text style={[styles.statsText, { color: theme.text }]}>Votre XP: {xp}</Text>
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
    marginBottom: 20,
  },
  card: {
    width: '100%',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  lottie: {
    width: 150,
    height: 150,
    marginBottom: 10,
  },
  challengeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  challengeDesc: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  timerText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statsText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DailyChallengeScreen;

//N'oubliez pas de placer une animation Lottie valide dans assets/animations/trophy-animation.json ou de supprimer/remplacer la vue LottieView).