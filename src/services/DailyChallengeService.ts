import StorageService from './StorageService';
import { GAMES, GameId, GameDifficulty } from '../constants/gameData';

const DAILY_STATUS_KEY_PREFIX = 'daily_challenge_status_';
const BONUS_XP = 500; // XP Spécial pour le défi

export interface DailyChallengeConfig {
  gameId: GameId;
  gameName: string;
  difficulty: GameDifficulty;
  targetLevel: number; // On fixe un niveau spécifique
  bonusXp: number;
  icon: string;
}

// Génère une configuration déterministe basée sur la date
// (Tout le monde aura le même défi le même jour)
const getChallengeForDate = (date: Date): DailyChallengeConfig => {
  const dateString = date.toISOString().split('T')[0]; // "2023-10-27"
  
  // Créer un "seed" simple à partir de la date
  const seed = dateString.split('-').reduce((acc, val) => acc + parseInt(val), 0);
  
  // 1. Choisir le jeu
  // On exclut 'RandomGame' s'il est dans la liste, on ne veut que les vrais jeux
  const availableGames = GAMES.filter(g => g.id !== 'RandomGame');
  const gameIndex = seed % availableGames.length;
  const selectedGame = availableGames[gameIndex];

  // 2. Choisir la difficulté (Cycle : Moyen -> Difficile -> Moyen -> Difficile...)
  // Les défis sont rarement "Faciles" ou "Maître" pour rester accessibles mais challengeants
  const isHard = seed % 2 === 0;
  const difficulty: GameDifficulty = isHard ? 'hard' : 'medium';

  // 3. Choisir un niveau (entre 10 et 50 pour éviter les niveaux trop tuto ou impossibles)
  const level = 10 + (seed % 40);

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

const getStatus = async (): Promise<'pending' | 'completed'> => {
  const key = getTodayStatusKey();
  const status = await StorageService.get(key);
  return status === 'completed' ? 'completed' : 'pending';
};

const completeChallenge = async () => {
  const key = getTodayStatusKey();
  await StorageService.set(key, 'completed');
};

const DailyChallengeService = {
  getChallengeForToday: () => getChallengeForDate(new Date()),
  getStatus,
  completeChallenge,
  BONUS_XP
};

export default DailyChallengeService;