// src/games/wordGuess/WordGuessScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, TextInput } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useSettings } from '../../hooks/useSettings';
import { usePlayer } from '../../hooks/usePlayer';
import { useSound } from '../../hooks/useSound';
import { GameStackParamList } from '../../navigation/types';
import { useWordGuessLogic } from './useWordGuessLogic';
import GameEndModal from '../../components/modals/GameEndModal';

type Props = NativeStackScreenProps<GameStackParamList, 'WordGuess'>;
const { width } = Dimensions.get('window');

const WordGuessScreen = ({ route, navigation }: Props) => {
  const { difficulty, level } = route.params;
  const { theme } = useSettings();
  const { playSound, vibrate } = useSound();
  const { addXP, spendLife } = usePlayer();

  // Utilisation du Hook Logique
  const game = useWordGuessLogic(difficulty, level);

  // Clavier virtuel (Lettres A-Z)
  const ALPHABET = "AZERTYUIOPQSDFGHJKLMWXCVBN".split(''); // Layout AZERTY simplifié

  // Effet de fin de partie
  useEffect(() => {
    if (game.isGameOver) {
      if (game.hasWonLevel) {
        playSound('win');
        // Bonus XP basé sur le score total + étoiles
        const finalXp = game.totalScore + (game.stars * 50);
        addXP(finalXp);
      } else {
        playSound('lose');
       // spendLife(1);
      }
    }
  }, [game.isGameOver]);

  // Fonction de saisie clavier
  const handleKeyPress = (char: string) => {
    if (game.wordStatus !== 'playing') return;
    if (game.currentGuess.length < (game.currentWord?.word.length || 0)) {
      playSound('click');
      game.setCurrentGuess(prev => prev + char);
    }
  };

  const handleBackspace = () => {
    if (game.currentGuess.length > 0) {
      playSound('click');
      game.setCurrentGuess(prev => prev.slice(0, -1));
    }
  };

  const handleSubmit = () => {
    const success = game.submitGuess();
    if (success) {
      playSound('success');
      vibrate('success');
    } else {
      playSound('error');
      vibrate('error');
      // Animation shake (à implémenter si besoin, ou juste feedback sonore)
      game.setCurrentGuess(''); // Reset sur erreur pour recommencer
    }
  };

  // Chargement
  if (!game.currentWord) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
        <Text style={{ color: theme.text }}>Chargement...</Text>
      </View>
    );
  }

  // Modal de fin
  if (game.isGameOver) {
    return (
      <GameEndModal
        visible={game.isGameOver}
        gameId="WordGuess" // Assurez-vous d'ajouter ça au type GameId
        difficulty={difficulty}
        level={level}
        isVictory={game.hasWonLevel}
        score={game.totalScore}
        navigation={navigation}
        onClose={() => {
          navigation.popToTop();
          navigation.navigate('LevelSelect', { gameId: 'WordGuess', gameName: 'Devine le Mot', difficulty });
        }}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* HEADER : Progression & Vies */}
      <View style={styles.header}>
        <Text style={[styles.levelText, { color: theme.secondary }]}>
          Niveau {level} ({difficulty})
        </Text>
        <View style={styles.progressDots}>
          {[...Array(game.totalWords)].map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.dot, 
                { 
                  backgroundColor: i < game.currentIndex ? theme.success : (i === game.currentIndex ? theme.primary : theme.card),
                  opacity: i === game.currentIndex ? 1 : 0.6
                }
              ]} 
            />
          ))}
        </View>
      </View>

      {/* ZONE D'INDICE & TIMER */}
      <View style={styles.clueContainer}>
        <Text style={[styles.categoryText, { color: theme.accent }]}>{game.currentWord.category}</Text>
        <Text style={[styles.clueText, { color: theme.text }]}>
          " {game.currentWord.clues[game.clueLevel]} "
        </Text>
        <Text style={[styles.timerText, { color: game.timeLeft < 10 ? theme.error : theme.primary }]}>
          ⏱ {game.timeLeft}s
        </Text>
      </View>

      {/* MOT À DEVINER (Slots) */}
      <View style={styles.wordContainer}>
        {game.currentWord.word.split('').map((char, index) => {
          // Logique d'affichage : Soit deviné, soit révélé par indice
          const isRevealed = game.revealedIndices.includes(index);
          const userChar = game.currentGuess[index];
          const displayChar = isRevealed ? char : (userChar || '');
          
          return (
            <MotiView
              key={index}
              from={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={[
                styles.letterBox, 
                { 
                  borderColor: isRevealed ? theme.success : (userChar ? theme.primary : theme.secondary),
                  backgroundColor: isRevealed ? 'rgba(76, 175, 80, 0.1)' : 'transparent'
                }
              ]}
            >
              <Text style={[styles.letterText, { color: theme.text }]}>{displayChar}</Text>
            </MotiView>
          );
        })}
      </View>

      {/* BARRE D'OUTILS (Aides) */}
      <View style={styles.toolsContainer}>
        <TouchableOpacity 
          style={[styles.toolButton, { opacity: game.hintsUsed.firstLetter >= game.maxFirstLetterHints ? 0.3 : 1 }]}
          onPress={() => { if(game.revealFirstLetter()) vibrate('default'); }}
          disabled={game.hintsUsed.firstLetter >= game.maxFirstLetterHints}
        >
          <MaterialCommunityIcons name="format-letter-case" size={24} color={theme.text} />
          <Text style={[styles.toolBadge, { color: theme.text }]}>{game.maxFirstLetterHints - game.hintsUsed.firstLetter}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.toolButton, { backgroundColor: theme.primary }]}
          onPress={() => { if(game.showNextClue()) vibrate('default'); else Alert.alert("Max indices atteints"); }}
        >
          <MaterialCommunityIcons name="lightbulb-on" size={24} color="#FFF" />
          <Text style={{color:'#FFF', fontSize:10, fontWeight:'bold'}}>Indice</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.toolButton, { opacity: game.hintsUsed.lastLetter >= game.maxLastLetterHints ? 0.3 : 1 }]}
          onPress={() => { if(game.revealLastLetter()) vibrate('default'); }}
          disabled={game.hintsUsed.lastLetter >= game.maxLastLetterHints}
        >
          <MaterialCommunityIcons name="format-letter-ends-with" size={24} color={theme.text} />
          <Text style={[styles.toolBadge, { color: theme.text }]}>{game.maxLastLetterHints - game.hintsUsed.lastLetter}</Text>
        </TouchableOpacity>
      </View>

      {/* CLAVIER VIRTUEL */}
      <View style={styles.keyboardContainer}>
        <View style={styles.keyboardRow}>
          {ALPHABET.slice(0, 10).map(char => (
            <KeyButton key={char} char={char} onPress={() => handleKeyPress(char)} theme={theme} />
          ))}
        </View>
        <View style={styles.keyboardRow}>
          {ALPHABET.slice(10, 20).map(char => (
            <KeyButton key={char} char={char} onPress={() => handleKeyPress(char)} theme={theme} />
          ))}
        </View>
        <View style={styles.keyboardRow}>
           <TouchableOpacity style={[styles.keyButton, { backgroundColor: theme.error, width: 40 }]} onPress={handleBackspace}>
              <MaterialCommunityIcons name="backspace" size={20} color="#FFF" />
           </TouchableOpacity>
           
           {ALPHABET.slice(20).map(char => (
            <KeyButton key={char} char={char} onPress={() => handleKeyPress(char)} theme={theme} />
          ))}
          
          <TouchableOpacity style={[styles.keyButton, { backgroundColor: theme.success, width: 50 }]} onPress={handleSubmit}>
              <MaterialCommunityIcons name="check" size={24} color="#FFF" />
           </TouchableOpacity>
        </View>
      </View>

    </View>
  );
};

const KeyButton = ({ char, onPress, theme }: any) => (
  <TouchableOpacity onPress={onPress} style={[styles.keyButton, { backgroundColor: theme.card }]}>
    <Text style={[styles.keyText, { color: theme.text }]}>{char}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, alignItems: 'center' },
  header: { width: '100%', alignItems: 'center', marginBottom: 20 },
  levelText: { fontSize: 14, fontWeight: 'bold' },
  progressDots: { flexDirection: 'row', gap: 5, marginTop: 5 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  
  clueContainer: { width: '100%', alignItems: 'center', marginBottom: 30, padding: 15, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.05)' },
  categoryText: { fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 5 },
  clueText: { fontSize: 18, fontStyle: 'italic', textAlign: 'center', marginBottom: 10 },
  timerText: { fontSize: 20, fontWeight: 'bold' },

  wordContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 5, marginBottom: 30 },
  letterBox: { width: 40, height: 45, borderBottomWidth: 3, borderRadius: 5, justifyContent: 'center', alignItems: 'center' },
  letterText: { fontSize: 24, fontWeight: 'bold' },

  toolsContainer: { flexDirection: 'row', gap: 30, marginBottom: 30 },
  toolButton: { alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 10 },
  toolBadge: { fontSize: 10, marginTop: 2, fontWeight: 'bold' },

  keyboardContainer: { width: '100%', alignItems: 'center', gap: 8 },
  keyboardRow: { flexDirection: 'row', gap: 4, justifyContent: 'center', width: '100%' },
  keyButton: { width: 30, height: 42, borderRadius: 5, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  keyText: { fontSize: 18, fontWeight: 'bold' },
});

export default WordGuessScreen;