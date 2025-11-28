// src/games/neuroPuzzle/neuroPuzzle.logic.ts
import { NEURO_CONFIG, NeuroDifficulty } from '../../constants/neuroPuzzleConfig';

export interface NeuroCell {
  id: number;
  targetColor: string | null; // La couleur qu'il faut deviner
  userColor: string | null;   // La couleur mise par le joueur
}

/**
 * Génère les paramètres dynamiques en fonction du niveau linéaire.
 * C'est ici que l'IA adaptative est simulée : plus le niveau monte, plus c'est dur.
 */
export const generateLevelParams = (difficulty: NeuroDifficulty, level: number) => {
  const config = NEURO_CONFIG[difficulty];
  
  // Facteur de complexité (0.0 à 1.0) basé sur le niveau (ex: level 100 = 1.0)
  // On cap à 100 pour éviter des calculs infinis si on ajoute des niveaux
  const complexityFactor = Math.min(level, 100) / 100;

  // Calcul du nombre de tuiles à colorier (augmente avec le niveau)
  const maxTiles = config.gridSize * config.gridSize;
  // Formule : Base + (EspaceRestant * Complexité * 0.7)
  const targetTileCount = Math.floor(
    config.minTargetTiles + ((maxTiles - config.minTargetTiles) * complexityFactor * 0.7)
  );

  // Calcul du temps de mémorisation (augmente légèrement avec le niveau pour Hard/Master)
  let memorizationTime = config.baseTime;
  if (difficulty === 'hard' || difficulty === 'master') {
    memorizationTime = Math.max(1.5, config.baseTime + (complexityFactor * 1.5));
  }

  return { targetTileCount, memorizationTime, config };
};

export const generateNeuroGrid = (difficulty: NeuroDifficulty, level: number): NeuroCell[] => {
  const { targetTileCount, config } = generateLevelParams(difficulty, level);
  const totalCells = config.gridSize * config.gridSize;
  
  // 1. Initialiser grille vide
  let grid: NeuroCell[] = Array.from({ length: totalCells }, (_, i) => ({
    id: i,
    targetColor: null,
    userColor: null,
  }));

  // 2. Sélectionner aléatoirement des indices uniques
  const indices = new Set<number>();
  while (indices.size < targetTileCount) {
    indices.add(Math.floor(Math.random() * totalCells));
  }

  // 3. Assigner des couleurs cibles
  indices.forEach(index => {
    // Choisir une couleur aléatoire parmi celles disponibles
    const randomColor = config.availableColors[Math.floor(Math.random() * config.availableColors.length)];
    grid[index].targetColor = randomColor;
  });

  return grid;
};