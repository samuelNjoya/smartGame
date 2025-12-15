// src/games/wordScramble/wordScramble.logic.ts
import { GameDifficulty } from '../../constants/gameData';
import { WORD_DB } from './wordDatabase';

export interface ScrambleWord {
  id: number;
  original: string;
  scrambled: string;
  status: 'pending' | 'success' | 'failed' | 'current';
}

export interface LevelConfig {
  words: ScrambleWord[];
  timePerWord: number;
  passThreshold: number; // Nombre de mots à trouver pour réussir
}

// Mélange de Fisher-Yates
const shuffleString = (str: string): string => {
  const arr = str.split('');
  let n = arr.length;
  // S'assurer que le mot mélangé n'est pas identique à l'original (sauf si impossible)
  let shuffled = '';
  
  do {
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    shuffled = arr.join('');
  } while (shuffled === str && str.length > 1);
  
  return shuffled;
};

const getRandomWordsFromPool = (pool: string[], count: number): string[] => {
  const shuffled = pool.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const generateWordLevel = (difficulty: GameDifficulty, level: number): LevelConfig => {
  let wordCount = 5;
  let timePerWord = 60;
  let lengthsToPick: number[] = [];

  // 1. Définir la configuration en fonction de la difficulté et du niveau
  switch (difficulty) {
    case 'easy':
      timePerWord = Math.max(40, 60 - (level * 0.1)); // Diminue lentement
     wordCount = 5 + Math.floor(level / 50); // 5 à 8 mots
   //  wordCount = 5
      
      if (level <= 50) lengthsToPick = [4];
      else if (level <= 100) lengthsToPick = [4, 5];
      else if (level <= 150) lengthsToPick = [5, 6];
      else lengthsToPick = [6, 7];
      break;

    case 'medium':
      timePerWord = Math.max(35, 50 - (level * 0.1));
      wordCount = 6 + Math.floor(level / 50); // 6 à 8 mots
      
      if (level <= 50) lengthsToPick = [6];
      else if (level <= 100) lengthsToPick = [6, 7];
      else lengthsToPick = [7, 8];
      break;

    case 'hard':
      timePerWord = Math.max(30, 45 - (level * 0.1));
      wordCount = 7 + Math.floor(level / 50);
      lengthsToPick = [7, 8, 9];
      break;

    case 'master': // Cas spécial (type 'master' n'est pas dans GameDifficulty standard, ajustez selon vos types)
      timePerWord = 40; // Temps très court fixe
      wordCount = 8;
      lengthsToPick = [8, 9, 10];
      break;
      
    // Fallback pour TypeScript si 'master' est géré via un cast
    default: 
       timePerWord = 30; wordCount = 8; lengthsToPick = [8, 9]; break;
  }

  // 2. Récupérer les mots depuis la DB
  const selectedWords: string[] = [];
  const dbCategory = difficulty === 'master' ? WORD_DB.master : WORD_DB[difficulty];

  // Remplir la liste des mots
  while (selectedWords.length < wordCount) {
    // Choisir une longueur aléatoire parmi celles autorisées
    const len = lengthsToPick[Math.floor(Math.random() * lengthsToPick.length)];
    // @ts-ignore - Accès dynamique aux clés de longueur (ex: '4', '10')
    const pool = dbCategory[len] || dbCategory['10'] || [];
    
    if (pool.length > 0) {
      const word = pool[Math.floor(Math.random() * pool.length)];
      // Éviter les doublons
      if (!selectedWords.includes(word)) {
        selectedWords.push(word);
      }
    }
  }

  // 3. Formater les objets ScrambleWord
  const gameWords: ScrambleWord[] = selectedWords.map((word, index) => ({
    id: index,
    original: word,
    scrambled: shuffleString(word),
    status: 'pending',
  }));

  // Le premier mot est actif
  if (gameWords.length > 0) gameWords[0].status = 'current';

  return {
    words: gameWords,
    timePerWord,
    passThreshold: Math.ceil(wordCount * 0.7), // 70% requis
  };
};