// src/games/wordGuess/wordGenerator.ts
import { GameDifficulty } from '../../constants/gameData';

export interface WordProblem {
  id: string;
  word: string;
  category: string;
  clues: [string, string, string]; // 3 indices : Vague -> Moyen -> Précis
  timeLimit: number;
}

// Base de données simulée (À enrichir)
const WORD_DB = {
  easy: [
    { word: 'CHAT', category: 'ANIMAL', clues: ['Aime le poisson', 'Il miaule', 'Ennemi de la souris'] },
    { word: 'FLEUR', category: 'NATURE', clues: ['Pousse dans le jardin', 'A des pétales', 'Sent bon'] },
    { word: 'LIVRE', category: 'OBJET', clues: ['Se lit', 'A des pages', 'On le trouve en bibliothèque'] },
    { word: 'PLUIE', category: 'MÉTÉO', clues: ['Eau qui tombe', 'Vient des nuages', 'Mouille le sol'] },
    { word: 'POMME', category: 'FRUIT', clues: ['Fruit rond', 'Peut être rouge ou verte', 'Blanche Neige en a croqué une'] },
    { word: 'LOUP', category: 'ANIMAL', clues: ['Vit en meute', 'Crie à la lune', 'Grand méchant des contes'] },
    { word: 'ROBOT', category: 'TECH', clues: ['Machine intelligente', 'Fait de métal', 'Imite l\'humain'] },
  ],
  medium: [
    { word: 'ENERGIE', category: 'PHYSIQUE', clues: ['Force en action', 'Peut être solaire', 'Nécessaire pour bouger'] },
    { word: 'SYSTEME', category: 'LOGIQUE', clues: ['Ensemble organisé', 'Solaire ou d\'exploitation', 'Méthode'] },
    { word: 'AVENTURE', category: 'ACTION', clues: ['Voyage risqué', 'Péripétie', 'Action héroïque'] },
    { word: 'MEMOIRE', category: 'COGNITIF', clues: ['Souvenirs', 'Stockage cérébral', 'Peut être courte ou longue'] },
    { word: 'PLANETE', category: 'ASTRONOMIE', clues: ['Corps céleste', 'Tourne autour d\'une étoile', 'La Terre en est une'] },
    { word: 'VIRUS', category: 'BIOLOGIE', clues: ['Microbe', 'Provoque des maladies', 'Informatique aussi'] },
  ],
  hard: [
    { word: 'PHENOMENE', category: 'SCIENCE', clues: ['Fait observable', 'Événement rare', 'Chose extraordinaire'] },
    { word: 'STRATEGIE', category: 'MILITAIRE', clues: ['Art de la guerre', 'Plan d\'action', 'Nécessaire aux échecs'] },
    { word: 'REVOLUTION', category: 'HISTOIRE', clues: ['Changement brusque', 'Tour complet', '1789 en France'] },
    { word: 'AEROPORT', category: 'TRANSPORT', clues: ['Lieu de transit', 'Pistes et tours', 'Pour les avions'] },
    { word: 'CHAMPION', category: 'SPORT', clues: ['Vainqueur', 'Détenteur du titre', 'Le meilleur'] },
  ],
  master: [
    { word: 'EPISTEMOLOGIE', category: 'PHILOSOPHIE', clues: ['Étude des sciences', 'Théorie de la connaissance', 'Discours sur le savoir'] },
    { word: 'CONSCIENCE', category: 'PSYCHOLOGIE', clues: ['Perception de soi', 'Voix intérieure', 'État d\'éveil'] },
    { word: 'PARADOXE', category: 'LOGIQUE', clues: ['Contradiction', 'Vérité apparente mais fausse', 'Logique impossible'] },
    { word: 'ARCHEOLOGIE', category: 'SCIENCE', clues: ['Étude du passé', 'Fouilles', 'Ruines et vestiges'] },
    { word: 'METAPHORE', category: 'LITTÉRATURE', clues: ['Figure de style', 'Image sans "comme"', 'Sens figuré'] },
  ]
};

const TIME_LIMITS = {
  easy: 60,
  medium: 45,
  hard: 35,
  master: 30,
};

export const generateWordLevel = (difficulty: GameDifficulty, level: number): WordProblem[] => {
  // Sélectionner le pool approprié
  // Note: Pour une vraie production, on utiliserait le 'level' pour varier les pools comme dans MathRush
  // Ici on simplifie pour l'exemple en prenant le pool de difficulté direct
  const poolKey = difficulty === 'easy' ? 'easy' : difficulty === 'medium' ? 'medium' : difficulty === 'hard' ? 'hard' : 'master';
  // @ts-ignore
  const pool = WORD_DB[poolKey] || WORD_DB.easy;
  
  // Mélanger et prendre 5 mots
  const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 5);
  
  return shuffled.map((item, index) => ({
    id: `${level}-${index}`,
    word: item.word,
    category: item.category,
    clues: item.clues as [string, string, string],
    timeLimit: TIME_LIMITS[difficulty] || 45,
  }));
};