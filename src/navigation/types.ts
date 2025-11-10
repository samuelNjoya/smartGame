// src/navigation/types.ts
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Types pour la barre d'onglets principale
export type MainTabsParamList = {
  Home: undefined;
  Games: undefined; // Mènera à GameStack
  DailyChallenge: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};

// Types pour la pile de jeux (accessible depuis l'onglet "Games")
export type GameStackParamList = {
  GameList: undefined;
  Memory: { difficulty: 'easy' | 'medium' | 'hard' };
  Quiz: { difficulty: 'easy' | 'medium' | 'hard' };
  Snake: { difficulty: 'easy' | 'medium' | 'hard' };
  // ... autres jeux
};

// Types pour la pile racine de l'application
export type RootStackParamList = {
  Main: undefined; // Les onglets principaux
  GameStack: undefined; // La pile des jeux
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