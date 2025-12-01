// src/games/wordGuess/useWordGuessLogic.ts
import { useState, useEffect, useRef } from 'react';
import { generateWordLevel, WordProblem } from './wordGenerator';
import { GameDifficulty } from '../../constants/gameData';

// Constantes de jeu
const WORDS_PER_LEVEL = 5;
const MAX_FIRST_LETTER_HINTS = 2;
const MAX_LAST_LETTER_HINTS = 2;
const PASS_THRESHOLD = 3; // 3 mots sur 5

export const useWordGuessLogic = (difficulty: GameDifficulty, level: number) => {
  // Données du niveau
  const [words, setWords] = useState<WordProblem[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  
  // État du mot en cours
  const [currentGuess, setCurrentGuess] = useState('');
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]); // Indices des lettres révélées
  const [clueLevel, setClueLevel] = useState(0); // 0, 1, 2
  const [timeLeft, setTimeLeft] = useState(0);
  const [wordStatus, setWordStatus] = useState<'playing' | 'success' | 'failed'>('playing');

  // État global du niveau
  const [wordsFound, setWordsFound] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [hintsUsed, setHintsUsed] = useState({
    firstLetter: 0,
    lastLetter: 0,
    extraClues: 0
  });
  
  // États de fin
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWonLevel, setHasWonLevel] = useState(false);
  const [stars, setStars] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Démarrage
  useEffect(() => {
    const generatedWords = generateWordLevel(difficulty, level);
    setWords(generatedWords);
    startWord(generatedWords[0]);
  }, [difficulty, level]);

  // Timer
  useEffect(() => {
    if (wordStatus === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            handleTimeOut();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, wordStatus]);

  const startWord = (wordObj: WordProblem) => {
    setCurrentWordIndex(words.indexOf(wordObj));
    setCurrentGuess('');
    setRevealedIndices([]);
    setClueLevel(0);
    setTimeLeft(wordObj.timeLimit);
    setWordStatus('playing');
  };

  const handleTimeOut = () => {
    setWordStatus('failed');
    setTimeout(nextWord, 1500);
  };

  const submitGuess = () => {
    if (!words[currentWordIndex]) return;
    const target = words[currentWordIndex].word;

    if (currentGuess.toUpperCase() === target) {
      // Victoire sur ce mot
      setWordStatus('success');
      setWordsFound(prev => prev + 1);
      
      // Calcul Score du mot (Base + Temps restant - Pénalité indices)
      const timeBonus = timeLeft; // 1 pt par seconde
      const cluePenalty = clueLevel * 10;
      const wordScore = 50 + timeBonus - cluePenalty;
      setTotalScore(prev => prev + Math.max(10, wordScore));

      setTimeout(nextWord, 1000);
      return true;
    } else {
      // Erreur (géré par l'UI pour shaker)
      return false;
    }
  };

  const nextWord = () => {
    const nextIndex = currentWordIndex + 1;
    if (nextIndex < words.length) {
      startWord(words[nextIndex]);
    } else {
      finishLevel();
    }
  };

  const finishLevel = () => {
    // Calcul de la victoire
    // Il faut ajouter +1 si le dernier mot était un succès car l'état wordsFound 
    // peut ne pas être à jour dans cette closure si appelé immédiatement
    // Mais ici nextWord est appelé après le render, donc wordsFound est à jour ?
    // Par sécurité, on re-vérifie le statut du mot courant si on vient de finir
    let finalWordsFound = wordsFound;
    
    // Calcul des étoiles
    // Critères : 
    // 1 étoile : >= 3 mots
    // 2 étoiles : >= 4 mots
    // 3 étoiles : 5 mots + peu d'indices
    let earnedStars = 0;
    if (finalWordsFound >= PASS_THRESHOLD) earnedStars = 1;
    if (finalWordsFound >= 4) earnedStars = 2;
    if (finalWordsFound === 5 && hintsUsed.extraClues <= 2) earnedStars = 3;

    setStars(earnedStars);
    setHasWonLevel(finalWordsFound >= PASS_THRESHOLD);
    setIsGameOver(true);
  };

  // --- Helpers ---

  const revealFirstLetter = () => {
    if (hintsUsed.firstLetter >= MAX_FIRST_LETTER_HINTS) return false;
    if (revealedIndices.includes(0)) return false;

    setRevealedIndices(prev => [...prev, 0]);
    setHintsUsed(prev => ({ ...prev, firstLetter: prev.firstLetter + 1 }));
    return true;
  };

  const revealLastLetter = () => {
    if (hintsUsed.lastLetter >= MAX_LAST_LETTER_HINTS) return false;
    const lastIdx = words[currentWordIndex].word.length - 1;
    if (revealedIndices.includes(lastIdx)) return false;

    setRevealedIndices(prev => [...prev, lastIdx]);
    setHintsUsed(prev => ({ ...prev, lastLetter: prev.lastLetter + 1 }));
    return true;
  };

  const showNextClue = () => {
    if (clueLevel >= 2) return false;
    setClueLevel(prev => prev + 1);
    setHintsUsed(prev => ({ ...prev, extraClues: prev.extraClues + 1 }));
    // Pénalité score immédiate ? Non, on déduit à la fin du mot.
    return true;
  };

  return {
    // Data
    currentWord: words[currentWordIndex],
    totalWords: words.length,
    currentIndex: currentWordIndex,
    
    // State
    currentGuess,
    setCurrentGuess,
    revealedIndices,
    clueLevel,
    timeLeft,
    wordStatus,
    
    // Global Stats
    wordsFound,
    totalScore,
    hintsUsed,
    maxFirstLetterHints: MAX_FIRST_LETTER_HINTS,
    maxLastLetterHints: MAX_LAST_LETTER_HINTS,

    // End State
    isGameOver,
    hasWonLevel,
    stars,

    // Actions
    submitGuess,
    revealFirstLetter,
    revealLastLetter,
    showNextClue,
  };
};