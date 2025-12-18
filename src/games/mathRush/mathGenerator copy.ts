// src/games/mathRush/mathGenerator.ts
import { GameDifficulty } from "../../constants/gameData";

export type Operation = '+' | '-' | '*' | '/';

export interface MathProblem {
  id: number;
  question: string;
  answer: number;
  options: number[];
  baseXp: number;
  timeLimit: number; // Temps en secondes
}

const getRandomInt = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateOptions = (answer: number, count: number): number[] => {
  const options = new Set<number>([answer]);
  let range = Math.max(5, Math.abs(answer) / 2); // Plage d'options basée sur la réponse
  
  while (options.size < count) {
    let wrongAnswer = answer + getRandomInt(-range, range);
    
    // Évite les réponses triviales ou trop proches
    if (wrongAnswer !== answer && Math.abs(wrongAnswer - answer) > 1) {
      options.add(wrongAnswer);
    } else {
      // Pour les cas où la réponse est 0 ou petit, on s'assure d'avoir des options variées
      if (wrongAnswer === answer) {
        wrongAnswer += (Math.random() > 0.5 ? 2 : -2);
      }
      options.add(wrongAnswer);
    }
  }

  // Mélange des options
  return Array.from(options).sort(() => Math.random() - 0.5);
};


/**
 * Génère une opération mathématique complète en fonction de la difficulté et du niveau.
 */
const generateProblem = (difficulty: GameDifficulty, problemId: number): MathProblem => {
  let num1: number, num2: number, num3: number;
  let operation: Operation;
  let answer: number;
  let question: string;
  let numOptions = 4; // 4 choix par défaut
  let timeLimit = 15;
  let baseXp = 0;//10
  
  // Progression dynamique des niveaux (nombre d'opérations et plages de nombres)
  const numProblems = getRandomInt(10, 20);
  const complexityFactor = Math.min(1, problemId / numProblems); // Problèmes plus complexes en fin de niveau

  switch (difficulty) {
    case 'easy':
      timeLimit = 15; baseXp = 0; numOptions = 3;
      // Additions et Soustractions. Nombres jusqu'à 20 (début) à 50 (fin)
      const maxEasyNum = getRandomInt(20, 50);
      num1 = getRandomInt(1, maxEasyNum);
      num2 = getRandomInt(1, maxEasyNum * complexityFactor);
      
      operation = Math.random() > 0.5 ? '+' : '-';
      
      if (operation === '-') {
        if (num2 > num1) [num1, num2] = [num2, num1]; // Assure un résultat non négatif
      }
      answer = eval(`${num1} ${operation} ${num2}`);
      question = `${num1} ${operation} ${num2} = ?`;
      break;

    case 'medium':
      timeLimit = 10; baseXp = 0;
      // Multiplications, Additions/Soustractions plus larges. Nombres jusqu'à 100
      
      if (Math.random() < 0.3) { // 30% de Multiplications
        num1 = getRandomInt(2, 10); // Tables
        num2 = getRandomInt(2, 10);
        operation = '*';
        answer = num1 * num2;
        question = `${num1} ${operation} ${num2} = ?`;
      } else { // 70% Add/Sub plus larges
        const maxMedNum = getRandomInt(50, 100);
        num1 = getRandomInt(10, maxMedNum);
        num2 = getRandomInt(10, maxMedNum * (1 - complexityFactor * 0.5));
        
        operation = Math.random() > 0.5 ? '+' : '-';
        if (operation === '-') {
          if (num2 > num1) [num1, num2] = [num2, num1];
        }
        answer = eval(`${num1} ${operation} ${num2}`);
        question = `${num1} ${operation} ${num2} = ?`;
      }
      break;

    case 'hard':
      timeLimit = 8; baseXp = 0;
      // Opérations mixtes (3 termes), Division
      const type = Math.random();

      if (type < 0.3) { // Division (Résultats entiers)
        num2 = getRandomInt(2, 10); // Diviseur
        answer = getRandomInt(2, 10); // Réponse
        num1 = num2 * answer; // Dividende
        operation = '/';
        question = `${num1} ${operation} ${num2} = ?`;
      } else { // 3 termes (Mixte)
        num1 = getRandomInt(5, 15);
        num2 = getRandomInt(1, 10);
        num3 = getRandomInt(1, 5);
        
        const op1 = Math.random() > 0.5 ? '+' : '-';
        const op2 = Math.random() > 0.5 ? '*' : '+';
        
        // S'assurer de respecter les règles de priorité (multiplication avant)
        answer = eval(`${num1} ${op1} ${num2} ${op2} ${num3}`);
        question = `${num1} ${op1} ${num2} ${op2} ${num3} = ?`;
      }
      break;

    case 'master':
      timeLimit = 7; baseXp = 0;
      // Nombres négatifs, Carrés, Vitesse
      const masterType = Math.random();
      
      if (masterType < 0.3) { // Carrés simples
        num1 = getRandomInt(5, 15);
        answer = num1 * num1;
        question = `${num1}² = ?`;
      } else { // Nombres négatifs et 3 termes complexes
        num1 = getRandomInt(-20, 30);
        num2 = getRandomInt(-10, 20);
        num3 = getRandomInt(-5, 5);
        
        const op1 = Math.random() > 0.5 ? '+' : '-';
        const op2 = Math.random() > 0.5 ? '+' : '-';
        
        answer = eval(`${num1} ${op1} ${num2} ${op2} ${num3}`);
        question = `${num1} ${op1} ${num2} ${op2} ${num3} = ?`;
        
        // Nettoyage de l'affichage (- -)
        question = question.replace(/\+ -/g, '- ');
      }
      break;
  }

  return {
    id: problemId,
    question,
    answer,
    options: generateOptions(answer, numOptions),
    baseXp,
    timeLimit,
  };
};

/**
 * Génère l'ensemble des problèmes pour un niveau.
 */
export const generateMathLevel = (difficulty: GameDifficulty, level: number): MathProblem[] => {
  //const numProblems = 10 + Math.floor((Math.min(level, 100) / 100) * 10); // 10 à 20 problèmes
  const numProblems = 10; // Fixe à 10 problèmes
  const problems: MathProblem[] = [];

  for (let i = 0; i < numProblems; i++) {
    problems.push(generateProblem(difficulty, i));
  }

  return problems;
};