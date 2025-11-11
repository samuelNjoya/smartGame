// src/services/ProgressionService.ts

import StorageService from './StorageService';
import { GameDifficulty, GameId, MAX_LEVELS } from '../constants/gameData';

const PROGRESS_KEY_PREFIX = 'game:progress:';

// Type pour stocker le niveau le plus élevé déverrouillé/terminé
// Le niveau déverrouillé est (lastCompletedLevel + 1)
type GameProgress = {
  lastCompletedLevel: number; 
};

// Par convention, le niveau déverrouillé pour jouer est (lastCompletedLevel + 1)
// Si lastCompletedLevel = 0, le niveau 1 est déverrouillé.
// Si lastCompletedLevel = 5, les niveaux 1 à 5 sont terminés, le niveau 6 est déverrouillé.


/**
 * Récupère le niveau le plus élevé que le joueur a complété
 * pour un jeu et une difficulté donnés.
 * @returns Le numéro du niveau terminé. 0 si aucun n'est terminé (déverrouillant le niveau 1).
 */
const getLastCompletedLevel = async (gameId: GameId, difficulty: GameDifficulty): Promise<number> => {
  const key = `${PROGRESS_KEY_PREFIX}${gameId}:${difficulty}`;
  const data = await StorageService.get(key);

  if (data) {
    try {
      const progress: GameProgress = JSON.parse(data);
      return progress.lastCompletedLevel;
    } catch (e) {
      console.error("Erreur de parsing de la progression", e);
    }
  }
  // Par défaut, rien n'est complété (le niveau 1 est déverrouillé)
  return 0;
};

/**
 * Enregistre qu'un niveau a été complété.
 * Met à jour le niveau complété le plus élevé si le nouveau est supérieur.
 * @param level Le niveau qui vient d'être complété (ex: 5).
 * @returns true si la progression a augmenté (un nouveau niveau est déverrouillé).
 */
const saveLevelCompletion = async (gameId: GameId, difficulty: GameDifficulty, level: number): Promise<boolean> => {
  const lastCompleted = await getLastCompletedLevel(gameId, difficulty);
  
  // Si le joueur rejoue un niveau déjà terminé (level <= lastCompleted), ne rien faire.
  if (level <= lastCompleted) {
    return false;
  }
  
  // On vérifie qu'on ne dépasse pas le nombre max de niveaux pour cette difficulté
  const maxLevels = MAX_LEVELS[difficulty];
  const newCompletedLevel = Math.min(level, maxLevels);

  const key = `${PROGRESS_KEY_PREFIX}${gameId}:${difficulty}`;
  const progress: GameProgress = { lastCompletedLevel: newCompletedLevel };
  
  await StorageService.set(key, JSON.stringify(progress));
  
  // Un nouveau niveau est déverrouillé (level > lastCompleted)
  return true; 
};


const ProgressionService = {
  getLastCompletedLevel,
  saveLevelCompletion,
};

export default ProgressionService;