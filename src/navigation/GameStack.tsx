// src/navigation/GameStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GameStackParamList } from './types';
import { useSettings } from '../hooks/useSettings';

// Écrans de jeu
import GameListScreen from '../screens/GameListScreen';
import MemoryGameScreen from '../games/memory/MemoryGameScreen';
import QuizGameScreen from '../games/quiz/QuizGameScreen';
import SnakeGameScreen from '../games/snake/SnakeGameScreen';
import DifficultySelectScreen from '../screens/levels/DifficultySelectScreen';
import LevelSelectScreen from '../screens/levels/LevelSelectScreen';
import NeuroPuzzleScreen from '../games/neuroPuzzle/NeuroPuzzleScreen';
import WordScrambleScreen from '../games/wordScramble/WordScrambleScreen';
import MathRushScreen from '../games/mathRush/MathRushScreen';
import WordGuessScreen from '../games/wordGuess/WordGuessScreen';

const Stack = createNativeStackNavigator<GameStackParamList>();

const GameStack = () => {
  const { theme } = useSettings();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTitleStyle: { color: theme.text },
        headerTintColor: theme.primary, // Couleur de la flèche de retour
      }}>
      <Stack.Screen
        name="GameList"
        component={GameListScreen}
        options={{ title: 'Catalogue de Jeux' }}
      />

      {/* --- DÉCLARATION DES NOUVEAUX ÉCRANS --- */}
      <Stack.Screen 
        name="DifficultySelect" 
        component={DifficultySelectScreen} 
        options={{ title: 'Sélectionner la Difficulté' }}
      />
      <Stack.Screen 
        name="LevelSelect" 
        component={LevelSelectScreen} 
        options={{ title: 'Sélectionner le Niveau' }}
      />
      
      {/* JEUX COMPLETS */}
      <Stack.Screen name="Memory" component={MemoryGameScreen} options={{ title: 'Jeu de Mémoire' }} />
      {/* <Stack.Screen name="Quiz" component={QuizGameScreen} options={{ title: 'Quiz Culture' }} /> */}
      {/* <Stack.Screen name="Snake" component={SnakeGameScreen} options={{ title: 'Snake' }} /> */}
      <Stack.Screen name="NeuroPuzzle" component={NeuroPuzzleScreen} options={{ title: 'NeuroPuzzle' }} />
      <Stack.Screen name="WordScramble" component={WordScrambleScreen} options={{ title: 'Mots Mêlés' }} />
      <Stack.Screen name="MathRush" component={MathRushScreen} options={{ title: 'Calcul Express' }}/>
      {/* <Stack.Screen name="WordGuess" component={WordGuessScreen} options={{ title: 'Dévine le Mot' }}/> */}
      
      {/* <Stack.Screen name="Sudoku" component={SudokuScreen} /> 
      <Stack.Screen name="TicTacToe" component={TicTacToeScreen} /> 
      */}
    </Stack.Navigator>
  );
};

export default GameStack;