// src/games/memory/memory.logic.ts

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
export const generateDeck = (difficulty: 'easy' | 'medium' | 'hard'): MemoryCardType[] => {
  let pairCount: number;
  switch (difficulty) {
    case 'easy': pairCount = 4; break; // Grille 2x4
    case 'medium': pairCount = 6; break; // Grille 3x4
    case 'hard': pairCount = 8; break; // Grille 4x4
  }

  // Sélectionner les icônes
  const iconsForGame = ICONS.slice(0, pairCount);
  const cards = [...iconsForGame, ...iconsForGame]; // Créer les paires

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