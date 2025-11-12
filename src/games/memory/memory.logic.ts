// src/games/memory/memory.logic.ts
import { MEMORY_LEVEL_PROGRESSION, GameDifficulty, MAX_LEVELS, MAX_MOVES_MULTIPLIER } from '../../constants/gameData'; // NOUVEL IMPORT

// Icônes à utiliser
const ICONS = [
  'apple', 'bomb', 'car', 'database', 'ghost', 'heart',
  'laptop', 'lock', 'map', 'rocket', 'server', 'skull',
  'star', 'trophy', 'wifi', 'xml'
];

export interface MemoryCardType {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

// Génère le set de cartes pour le jeu
// export const generateDeck = (difficulty: 'easy' | 'medium' | 'hard'): MemoryCardType[] => {
//   let pairCount: number;
//   switch (difficulty) {
//     case 'easy': pairCount = 4; break; // Grille 2x4
//     case 'medium': pairCount = 6; break; // Grille 3x4
//     case 'hard': pairCount = 8; break; // Grille 4x4
//   }

//   // Sélectionner les icônes
//   const iconsForGame = ICONS.slice(0, pairCount);
//   const cards = [...iconsForGame, ...iconsForGame]; // Créer les paires

//   // Mélanger
//   const shuffledCards = cards
//     .map((icon, index) => ({
//       id: index,
//       icon: icon,
//       isFlipped: false,
//       isMatched: false,
//     }))
//     .sort(() => Math.random() - 0.5);

//   return shuffledCards;
// };



// Fonction utilitaire pour interpoler la difficulté entre les niveaux
const getPairCountForLevel = (difficulty: GameDifficulty, level: number): number => {
  const [minPairs, maxPairs] = MEMORY_LEVEL_PROGRESSION[difficulty];
  const maxLevel = MAX_LEVELS[difficulty];

  // Progression linéaire : (maxPaires - minPaires) * (level - 1) / (maxLevel - 1) + minPaires
  // Le niveau 1 donne minPairs. Le niveau maxLevel donne maxPairs.
  if (maxLevel <= 1) return minPairs;

  const progressionStep = (maxPairs - minPairs) / (maxLevel - 1);
  const pairCount = minPairs + progressionStep * (level - 1);
  
  // Arrondir au nombre entier de paires le plus proche
  return Math.round(pairCount);
};

// Génère le set de cartes pour le jeu
export const generateDeck = (difficulty: GameDifficulty, level: number): MemoryCardType[] => {
  const pairCount = getPairCountForLevel(difficulty, level);
  
  // Utiliser Math.min pour s'assurer que nous n'utilisons pas plus d'icônes que disponibles
  const finalPairCount = Math.min(pairCount, ICONS.length); 

  // Sélectionner les icônes
  const iconsForGame = ICONS.slice(0, finalPairCount);
  const cards = [...iconsForGame, ...iconsForGame]; // Créer les paires (finalPairCount * 2 cartes)

  // Mélanger
  const shuffledCards = cards
    .map((icon, index) => ({
      id: index,
      icon: icon,
      isFlipped: false,
      isMatched: false,
    }))
    .sort(() => Math.random() - 0.5);

  return shuffledCards;
};

/**
 * Calcule le nombre maximal de coups autorisés pour le niveau.
 */
export const calculateMaxMoves = (difficulty: GameDifficulty, level: number): number => {
    const pairCount = getPairCountForLevel(difficulty, level);
    const multiplier = MAX_MOVES_MULTIPLIER[difficulty];
    
    // Le nombre de paires est le nombre minimal de coups.
    // La limite est (nombre de paires) * multiplicateur.
    return Math.ceil(pairCount * multiplier);
}