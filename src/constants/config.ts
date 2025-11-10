// src/constants/config.ts

export const GAME_CONFIG = {
  // Système de vies
  MAX_LIVES: 5,
  LIFE_REGEN_MINUTES: 5, // 5 minutes par vie

  // Boutique de vies (XP)
  LIFE_COST: {
    1: 200,
    2: 350,
    3: 600,
    4: 800, // Exemple
    5: 1000, // Exemple
  },

  // Récompenses
  DEFAULT_XP_PER_WIN: 10,
  LEVEL_5_MULTIPLIER: 2, // Bonus x2 pour les multiples de 5
  LEVEL_10_BONUS_OPTIONS: [1, 15, 100, 500, 1000, 5000], // Récompenses aléatoires
};