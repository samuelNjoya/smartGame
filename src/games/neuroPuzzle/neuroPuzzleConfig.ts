// src/constants/neuroPuzzleConfig.ts

export type NeuroDifficulty = 'easy' | 'medium' | 'hard' | 'master';

interface DifficultyConfig {
  gridSize: number;      // ex: 3 pour 3x3
  availableColors: string[]; // Palette de couleurs disponibles
  baseTime: number;      // Temps de mémorisation de base (secondes)
  minTargetTiles: number; // Nombre min de cases à colorier
}

export const NEURO_COLORS = [
  '#EF476F', // Rouge/Rose
  '#FFD166', // Jaune
  '#06D6A0', // Vert
  '#118AB2', // Bleu
  '#073B4C', // Bleu Foncé
  '#9D4EDD', // Violet
  '#0d0f0eff', // Violet
];

export const NEURO_CONFIG: Record<NeuroDifficulty, DifficultyConfig> = {
  easy: {
    gridSize: 3,
    availableColors: NEURO_COLORS.slice(0, 4), // 4 couleurs
    baseTime: 4.5,
    minTargetTiles: 4,
  },
  medium: {
    gridSize: 4,
    availableColors: NEURO_COLORS.slice(0, 5), // 5 couleurs
    baseTime: 4,
    minTargetTiles: 5,
  },
  hard: {
    gridSize: 5,
    availableColors: NEURO_COLORS.slice(0, 6), // 6 couleurs
    baseTime: 4,
    minTargetTiles: 6,
  },
  master: {
    gridSize: 6,
    availableColors: NEURO_COLORS.slice(0, 7), // 7 couleurs
    baseTime: 3.5, // Très rapide
    minTargetTiles: 7,
  },
};