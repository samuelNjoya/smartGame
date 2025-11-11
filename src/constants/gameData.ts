// src/constants/gameData.ts

export const MAX_LEVELS = {
  easy: 100,
  medium: 75,
  hard: 50,
};

export const GAMES = [
  { id: 'Memory', name: 'Memory', icon: 'cards' },
  { id: 'Quiz', name: 'Quiz de Culture Générale', icon: 'lightbulb-on' },
  { id: 'Snake', name: 'Snake', icon: 'snake' },
  // Ajoutez d'autres jeux ici
];

export type GameDifficulty = 'easy' | 'medium' | 'hard';
export type GameId = 'Memory' | 'Quiz' | 'Snake' | 'RandomGame'; // Ajouter 'RandomGame' pour la leçon/recharge

// Récompenses de base en XP pour chaque jeu/difficulté
// Ces valeurs seront doublées pour les multiples de 5
export const BASE_XP_REWARDS = {
  easy: 50,
  medium: 100,
  hard: 150,
};

// Récompenses aléatoires pour les multiples de 10
export const RANDOM_XP_REWARDS = [
  { label: '+50 XP', value: 50 },
  { label: '+150 XP', value: 150 },
  { label: '+300 XP', value: 300 },
  { label: '+500 XP', value: 500 },
  { label: '+1000 XP', value: 1000 },
  { label: 'Rien 🥲', value: 0 },
];