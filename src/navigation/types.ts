// src/navigation/types.ts (Mise à jour)
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameDifficulty } from '../constants/gameData'; // NOUVEL IMPORT

// Types pour la barre d'onglets principale
export type MainTabsParamList = {
  Home: undefined;
  Games: undefined; // Mènera à GameStack
  DailyChallenge: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};

export type GameStackParamList = {
  // MODIFIÉ: GameList devient l'écran de sélection du jeu
  GameList: undefined;
  
  // NOUVEL ÉCRAN : Sélection de la difficulté
  DifficultySelect: { gameId: string; gameName: string }; 
  
  // NOUVEL ÉCRAN : Sélection des niveaux
  LevelSelect: { 
    gameId: string; 
    gameName: string; 
    difficulty: GameDifficulty 
  };
  
  // Écran du jeu (Quiz, Memory, etc.)
  Quiz: { difficulty: GameDifficulty; level: number };
  Memory: { difficulty: GameDifficulty; level: number };
  Snake: { difficulty: GameDifficulty; level: number };
  NeuroPuzzle: { difficulty: GameDifficulty; level: number }; // AJOUT
  WordScramble: { difficulty: GameDifficulty; level: number }; // AJOUT
  MathRush: { difficulty: GameDifficulty; level: number }; // AJOUT
  // ... autres jeux
};

// Types pour la pile racine de l'application
export type RootStackParamList = {
  Main: undefined; // Les onglets principaux
  GameStack: undefined; // La pile des jeux
  Splash: undefined; // <--- NOUVELLE ROUTE INITIALE
  // ... autres écrans globaux (ex: Modals)
};

// Types pour les props d'écran (pour une vérification facile)
// Exemple pour un écran dans la pile de jeux
export type GameScreenProps<T extends keyof GameStackParamList> =
  NativeStackScreenProps<GameStackParamList, T>;


// Exemple pour un écran dans les onglets principaux
export type TabScreenProps<T extends keyof MainTabsParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabsParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;