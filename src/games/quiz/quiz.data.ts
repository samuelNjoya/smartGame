// src/games/quiz/quiz.data.ts

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // Index de la bonne réponse
}

const easyQuestions: QuizQuestion[] = [
  {
    question: 'Quelle est la couleur du ciel ?',
    options: ['Rouge', 'Vert', 'Bleu', 'Jaune'],
    correctAnswer: 2,
  },
  {
    question: 'Combien de jours y a-t-il dans une semaine ?',
    options: ['5', '6', '7', '8'],
    correctAnswer: 2,
  },
];

const mediumQuestions: QuizQuestion[] = [
  {
    question: 'Quelle est la capitale de la France ?',
    options: ['Berlin', 'Madrid', 'Paris', 'Rome'],
    correctAnswer: 2,
  },
  {
    question: 'Qui a peint la Joconde ?',
    options: ['Van Gogh', 'Picasso', 'Da Vinci', 'Monet'],
    correctAnswer: 2,
  },
];

const hardQuestions: QuizQuestion[] = [
  {
    question: "Quelle est la vitesse de la lumière (approx.) ?",
    options: ['300 km/s', '300,000 km/s', '150,000 km/h', '1,000,000 km/s'],
    correctAnswer: 1,
  },
  {
    question: "En quelle année l'homme a-t-il marché sur la Lune ?",
    options: ['1965', '1969', '1972', '1958'],
    correctAnswer: 1,
  },
];

export const getQuizQuestions = (difficulty: 'easy' | 'medium' | 'hard'): QuizQuestion[] => {
  switch (difficulty) {
    case 'easy': return easyQuestions;
    case 'medium': return mediumQuestions;
    case 'hard': return hardQuestions;
  }
};