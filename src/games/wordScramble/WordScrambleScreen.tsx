import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useSettings } from '../../hooks/useSettings';
import { usePlayer } from '../../hooks/usePlayer';
import { useSound } from '../../hooks/useSound';
import { GameStackParamList } from '../../navigation/types';
import { GameDifficulty } from '../../constants/gameData';
import { generateWordLevel, ScrambleWord } from './wordScramble.logic';
import GameEndModal from '../../components/modals/GameEndModal';

type Props = NativeStackScreenProps<GameStackParamList, 'WordScramble'>;
const { width } = Dimensions.get('window');

const WordScrambleScreen = ({ route, navigation }: Props) => {
  const { difficulty, level, isDailyChallenge } = route.params;
  const { theme } = useSettings();
  const { playSound, vibrate } = useSound();
  
  // États du jeu
  const [words, setWords] = useState<ScrambleWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAttempt, setUserAttempt] = useState<string>('');
  const [availableLetters, setAvailableLetters] = useState<{char: string, id: number, used: boolean}[]>([]);
  
  // États Timer & Score
  const [timeLeft, setTimeLeft] = useState(0);
  const [maxTime, setMaxTime] = useState(0);
  const [streak, setStreak] = useState(0);
  
  // États de fin
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWonLevel, setHasWonLevel] = useState(false);

  // Initialisation
  useEffect(() => {
    startLevel();
  }, [difficulty, level]);

  const startLevel = () => {
    // Générer le niveau
    const data = generateWordLevel(difficulty, level);
    setWords(data.words);
    setCurrentIndex(0);
    prepareWord(data.words[0], data.timePerWord);
    setMaxTime(data.timePerWord); // Sauvegarder pour les power-ups
    
    setStreak(0);
    setIsGameOver(false);
    setHasWonLevel(false);
  };

  const prepareWord = (wordObj: ScrambleWord, time: number) => {
    setUserAttempt('');
    // Préparer les lettres cliquables
    const letters = wordObj.scrambled.split('').map((char, i) => ({
      char,
      id: i,
      used: false
    }));
    setAvailableLetters(letters);
    setTimeLeft(time);
  };

  // Timer
  useEffect(() => {
    if (!isGameOver && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleWordFailure(); // Temps écoulé pour ce mot
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, isGameOver, currentIndex]);

  // Logique de validation
  useEffect(() => {
     //  STOP : plus aucune logique ne doit se jouer après la fin du jeu
  if (isGameOver) return;
    //if (words.length === 0) return;
    if (words.length === 0 || !words[currentIndex]) return;
    const currentWord = words[currentIndex];

    // Vérifier si le mot est complet et correct
    if (userAttempt.length === currentWord.original.length) {
      if (userAttempt === currentWord.original) {
        handleWordSuccess();
      } else {
        // Mot complet mais incorrect : Feedback visuel/sonore léger
        playSound('error');
        vibrate('error');
        // On ne passe pas au mot suivant, on laisse le joueur corriger
        // Optionnel: Reset automatique après 500ms
        setTimeout(() => resetInput(), 500);
      }
    }
  }, [userAttempt,words,currentIndex,isGameOver]);// Assurez-vous d'avoir ces dépendances

  const resetInput = () => {
    setUserAttempt('');
    setAvailableLetters(prev => prev.map(l => ({ ...l, used: false })));
  };

  const handleLetterPress = (char: string, index: number) => {
    playSound('click');
    setUserAttempt(prev => prev + char);
    setAvailableLetters(prev => {
      const newArr = [...prev];
      newArr[index].used = true;
      return newArr;
    });
  };

  const handleBackspace = () => {
    if (userAttempt.length === 0) return;
    
    // Retrouver la dernière lettre ajoutée et la rendre disponible
    const lastChar = userAttempt.slice(-1);
    
    // Trouver une instance de cette lettre marquée comme 'used' dans availableLetters
    // On doit prendre la dernière utilisée pour être cohérent, mais ici l'ordre visuel n'est pas strict
    // Simplification : on réactive la première instance trouvée qui est 'used' et match le char
    // (Dans une vraie app, on utiliserait une pile d'historique d'index)
    
    // Amélioration : Utiliser une pile d'index pour backspace précis
    // Pour simplifier ici : on réinitialise tout si on backspace (ou logique simple)
    // Logique simple pour ce snippet :
    const newAttempt = userAttempt.slice(0, -1);
    
    // Réactiver une lettre correspondante
    let restored = false;
    const newLetters = availableLetters.map(l => {
      if (!restored && l.used && l.char === lastChar) {
        restored = true;
        return { ...l, used: false };
      }
      return l;
    });

    setUserAttempt(newAttempt);
    setAvailableLetters(newLetters);
    playSound('click');
  };

  const handleWordSuccess = () => {
    playSound('success');
    vibrate('success');
    
    // Power-ups et Streak
    const newStreak = streak + 1;
    setStreak(newStreak);
    
    // Mise à jour du statut du mot
    const newWords = [...words];
    newWords[currentIndex].status = 'success';
    setWords(newWords);
    
    // Vérifier Power-Ups
    // if (newStreak === 5) Alert.alert("🔥 Série de 5 !", "Double XP activé pour le prochain mot !");
    // if (newStreak === 10) {
    //    Alert.alert("⚡️ Série de 10 !", "+10 secondes bonus !");
    //    setTimeLeft(t => t + 10);
    // }

    nextWord();
  };

  const handleWordFailure = () => {
    playSound('error');
    vibrate('error');
    setStreak(0); // Reset streak
    
    const newWords = [...words];
    newWords[currentIndex].status = 'failed';
    setWords(newWords);
    
    nextWord();
  };

  const nextWord = () => {
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < words.length) {
      setCurrentIndex(nextIndex);
      // Petite pause avant le prochain mot
      setTimeout(() => {
        const nextWordObj = words[nextIndex];
        nextWordObj.status = 'current';
        prepareWord(nextWordObj, maxTime); // On remet le temps max (ou ajusté selon difficulté)
      }, 500);
    } else {
      finishLevel();
    }
  };

  const finishLevel = () => {
    const successCount = words.filter(w => w.status === 'success').length;
    const threshold = Math.ceil(words.length * 0.7);
    const passed = successCount >= threshold;
    
    setHasWonLevel(passed);
    setIsGameOver(true);
  };

  // Rendu des slots de réponse
  const renderAnswerSlots = () => {
    const slots = Array(words[currentIndex].original.length).fill(null);
    return (
      <View style={styles.answerContainer}>
        {slots.map((_, i) => (
          <View key={i} style={[styles.slot, { borderColor: theme.text }]}>
            <Text style={[styles.slotText, { color: theme.text }]}>
              {userAttempt[i] || ''}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  // Protection : Si les mots ne sont pas encore chargés, on affiche un chargement
  if (words.length === 0 || !words[currentIndex]) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
        <Text style={{ color: theme.text, fontSize: 18 }}>Chargement du niveau...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          Niveau {level}
        </Text>
        <View style={styles.statsRow}>
           <Text style={{ color: timeLeft < 10 ? theme.error : theme.primary, fontWeight: 'bold' }}>
             ⏱ {timeLeft}s
           </Text>
           <Text style={{ color: theme.secondary }}>
             Mots: {currentIndex + 1}/{words.length}
           </Text>
           {streak > 1 && <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>🔥 x{streak}</Text>}
        </View>
      </View>

      {/* MOTS PRÉCÉDENTS (Indicateurs) */}
      <View style={styles.progressIndicators}>
        {words.map((w, i) => (
          <MaterialCommunityIcons 
            key={i}
            name={w.status === 'success' ? 'check-circle' : (w.status === 'failed' ? 'close-circle' : 'circle-outline')}
            size={20}
            color={w.status === 'success' ? theme.success : (w.status === 'failed' ? theme.error : theme.secondary)}
            style={{ marginHorizontal: 2 }}
          />
        ))}
      </View>

      {/* ZONE DE JEU */}
      <View style={styles.gameArea}>
        {renderAnswerSlots()}
        
        {/* Lettres Disponibles */}
        <View style={styles.lettersContainer}>
          {availableLetters.map((item, index) => (
             <TouchableOpacity
               key={index}
               disabled={item.used}
               onPress={() => handleLetterPress(item.char, index)}
               style={[
                 styles.letterButton, 
                 { 
                   backgroundColor: item.used ? theme.background : theme.primary,
                   borderColor: theme.primary,
                   opacity: item.used ? 0.3 : 1
                 }
               ]}
             >
               <Text style={[styles.letterText, { color: item.used ? theme.text : '#FFF' }]}>
                 {item.char}
               </Text>
             </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* BOUTONS D'ACTION */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={handleBackspace} style={[styles.actionButton, { backgroundColor: theme.secondary }]}>
           <MaterialCommunityIcons name="backspace" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={resetInput} style={[styles.actionButton, { backgroundColor: theme.error }]}>
           <MaterialCommunityIcons name="refresh" size={24} color="#FFF" />
        </TouchableOpacity>
        {/* Power up hints could go here */}
      </View>

      {/* MODAL DE FIN */}
      <GameEndModal
        visible={isGameOver}
        gameId="WordScramble" // S'assurer que 'WordScramble' est dans GameId type
        difficulty={difficulty}
        level={level}
        isVictory={hasWonLevel}
        navigation={navigation}
        isDailyChallenge={isDailyChallenge} // 2. Passer au modal
        onClose={() => {
          navigation.popToTop();
          navigation.navigate('LevelSelect', { 
            gameId: 'WordScramble', 
            gameName: 'Mots Mêlés', 
            difficulty 
          });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center' },
  header: { width: '100%', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 22, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', gap: 15, marginTop: 5 },
  
  progressIndicators: { flexDirection: 'row', marginBottom: 30 },
  
  gameArea: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  
  answerContainer: { flexDirection: 'row', gap: 5, marginBottom: 40, flexWrap: 'wrap', justifyContent: 'center' },
  slot: { 
    width: 40, height: 40, borderBottomWidth: 2, 
    justifyContent: 'center', alignItems: 'center' 
  },
  slotText: { fontSize: 24, fontWeight: 'bold', textTransform: 'uppercase' },
  
  lettersContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  letterButton: {
    width: 50, height: 50, borderRadius: 10, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
    elevation: 3
  },
  letterText: { fontSize: 20, fontWeight: 'bold' },
  
  actions: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  actionButton: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' }
});

export default WordScrambleScreen;