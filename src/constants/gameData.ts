// src/constants/gameData.ts

export const MAX_LEVELS = {
  easy: 200,
  medium: 150,
  hard: 100,
  master: 75,
};

export const GAMES = [
  { id: 'Memory', name: 'Memory', icon: 'cards',description:'Testez votre mémoire visuelle en retrouvant les paires de cartes identiques.' },
  // { id: 'Quiz', name: 'Quiz de Culture Générale', icon: 'lightbulb-on' },
  // { id: 'Snake', name: 'Snake', icon: 'snake' },
  { id: 'NeuroPuzzle', name: 'NeuroPuzzle', icon: 'brain',description:'Stimulez votre cerveau avec des énigmes logiques et des casse-têtes complexes.' }, // AJOUT (Utilisez une icône MaterialCommunityIcons valide comme 'brain')
  { id: 'WordScramble', name: 'Mots Mêlés', icon: 'format-letter-case',description:'Reconstituez les mots à partir de lettres mélangées. Testez votre vocabulaire!' }, // AJOUT pour afficher dans la liste des jeux
  { id: 'MathRush', name: 'Calcul Express', icon: 'calculator',description:'Résolvez des opérations mathématiques dans un temps limité. Rapidité et précision!' }, // AJOUT
 // { id: 'WordGuess', name: 'Devine le Mot', icon: 'format-text-variant' }, // AJOUT a completer plutart
  // Ajoutez d'autres jeux ici
];

export type GameDifficulty = 'easy' | 'medium' | 'hard' | 'master';
export type GameId = 'Memory' | 'Quiz' | 'Snake' | 'NeuroPuzzle' | 'WordScramble'| 'MathRush'| 'WordGuess' | 'RandomGame'; // Ajouter 'RandomGame' pour la leçon/recharge

// Récompenses de base en XP pour chaque jeu/difficulté
// Ces valeurs seront doublées pour les multiples de 5
export const BASE_XP_REWARDS = {
  easy: 50,
  medium: 100,
  hard: 150,
  master: 200,
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

// NOUVELLE STRUCTURE POUR LA PROGRESSION DES PAIRES DE MEMORY
export const MEMORY_LEVEL_PROGRESSION = {
  // Progression: [Min_Paires, Max_Paires]
  easy: [5, 10],   // 8 cartes à 20 cartes
  medium: [8, 12],  // 16 cartes à 24 cartes 8 12
  hard: [10, 15],  // 20 cartes à 30 cartes
  master: [15, 20],
};

// NOUVELLE STRUCTURE POUR LA LIMITE DE COUPS (CONDITION DE DÉFAITE)
// La formule sera (Nombre de paires * Multiplicateur de difficulté)
export const MAX_MOVES_MULTIPLIER = {
  easy: 2.5,  // 2.5 fois le nombre de paires
  medium: 2.1,  // 2.0 fois le nombre de paires
  hard: 1.9,   // 1.5 fois le nombre de paires (très strict)
  master: 1.7,
};