import StorageService from './StorageService';
import { GAMES, GameId, GameDifficulty } from '../constants/gameData';

const DAILY_STATUS_KEY_PREFIX = 'daily_challenge_status_';
const BONUS_XP = 500; // XP Spécial pour le défi

export interface DailyChallengeConfig {
  gameId: GameId;
  gameName: string;
  difficulty: GameDifficulty;
  targetLevel: number;
  bonusXp: number;
  icon: string;
}

export type ChallengeStatus = 'pending' | 'won' | 'lost';

// ⭐⭐⭐ FONCTION DE HASH AMÉLIORÉE ⭐⭐⭐
const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir en entier 32 bits
  }
  return Math.abs(hash);
};

// ⭐⭐⭐ GÉNÉRATION DE DÉFI QUOTIDIEN AMÉLIORÉE ⭐⭐⭐
// const getChallengeForDate = (date: Date): DailyChallengeConfig => {
//   const dateString = date.toISOString().split('T')[0]; // "2024-02-11"
  
//   // 1. Créer un seed UNIQUE et robuste
//   const seed = simpleHash(dateString);
  
//   // 2. Choisir le jeu - Distribution égale
//   const availableGames = GAMES.filter(g => g.id !== 'RandomGame');
  
//   // Utiliser une partie du seed pour le jeu
//   const gameSeed = seed % 1000000;
//   const gameIndex = gameSeed % availableGames.length;
//   const selectedGame = availableGames[gameIndex];

//   // 3. Choisir la difficulté - PLUS DE VARIÉTÉ
//   const difficultySeed = (seed >> 8) % 100; // Utiliser différents bits
//   let difficulty: GameDifficulty = 'medium';
  
//   if (difficultySeed < 30) {
//     difficulty = 'easy';
//   } else if (difficultySeed < 60) {
//     difficulty = 'medium';
//   } else if (difficultySeed < 85) {
//     difficulty = 'hard';
//   } else {
//     difficulty = 'master';
//   }

//   // 4. Choisir un niveau - VARIATION SELON LA DIFFICULTÉ
//   const levelSeed = (seed >> 16) % 100;
//   let level = 1;
  
//   switch (difficulty) {
//     case 'easy':
//       level = 5 + (levelSeed % 20); // Niveaux 5-25
//       break;
//     case 'medium':
//       level = 10 + (levelSeed % 30); // Niveaux 10-40
//       break;
//     case 'hard':
//       level = 15 + (levelSeed % 35); // Niveaux 15-50
//       break;
//     case 'master':
//       level = 20 + (levelSeed % 40); // Niveaux 20-60
//       break;
//   }

//   // Log pour débogage (à retirer en production)
//   console.log(`🎯 Défi du ${dateString}: ${selectedGame.name}, ${difficulty}, niveau ${level}, seed: ${seed}`);

//   return {
//     gameId: selectedGame.id as GameId,
//     gameName: selectedGame.name,
//     icon: selectedGame.icon,
//     difficulty,
//     targetLevel: level,
//     bonusXp: BONUS_XP
//   };
// };
const getChallengeForDate = (date: Date): DailyChallengeConfig => {
  const dateString = date.toISOString().split('T')[0]; // "2024-02-11"
  
  // Utiliser le timestamp comme seed
  const timestamp = date.getTime();
  const seed = parseInt(timestamp.toString().slice(-9)); // Prendre les 9 derniers chiffres
  
  // 1. Choisir le jeu
  const availableGames = GAMES.filter(g => g.id !== 'RandomGame');
  const gameIndex = (seed % 1000) % availableGames.length;
  const selectedGame = availableGames[gameIndex];

  // 2. Choisir la difficulté (aléatoire entre les 4)
  const difficulties: GameDifficulty[] = ['easy', 'medium', 'hard', 'master'];
  const difficultyIndex = ((seed >> 10) % 100) % difficulties.length;
  const difficulty = difficulties[difficultyIndex];

  // 3. Choisir un niveau selon la difficulté
  const levelRanges = {
    easy: { min: 1, max: 30 },
    medium: { min: 10, max: 50 },
    hard: { min: 15, max: 70 },
    master: { min: 20, max: 75 }
  };
  
  const range = levelRanges[difficulty];
  const level = range.min + ((seed >> 20) % (range.max - range.min + 1));

  return {
    gameId: selectedGame.id as GameId,
    gameName: selectedGame.name,
    icon: selectedGame.icon,
    difficulty,
    targetLevel: level,
    bonusXp: BONUS_XP
  };
};

const getTodayStatusKey = () => {
  const dateString = new Date().toISOString().split('T')[0];
  return `${DAILY_STATUS_KEY_PREFIX}${dateString}`;
};

const getStatus = async (): Promise<ChallengeStatus> => {
  const key = getTodayStatusKey();
  const status = await StorageService.get(key);
  
  if (status === 'won' || status === 'lost') {
    return status;
  }
  return 'pending'; 
};

const completeChallenge = async (isVictory: boolean) => {
  const key = getTodayStatusKey();
  const result = isVictory ? 'won' : 'lost';
  await StorageService.set(key, result);
};

const DailyChallengeService = {
  getChallengeForToday: () => getChallengeForDate(new Date()),
  getStatus,
  completeChallenge,
  BONUS_XP
};

export default DailyChallengeService;