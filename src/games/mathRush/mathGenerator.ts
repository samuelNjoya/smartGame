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

// Fonction de calcul sécurisée qui respecte les priorités mathématiques
const calculateExpression = (numbers: number[], operations: string[]): number => {
  // 1. Traiter d'abord les multiplications et divisions
  const processedNumbers: number[] = [numbers[0]];
  const processedOperations: string[] = [];
  
  for (let i = 0; i < operations.length; i++) {
    const currentNumber = numbers[i + 1];
    const currentOperation = operations[i];
    
    if (currentOperation === '*' || currentOperation === '/') {
      // Appliquer l'opération au dernier nombre traité
      const lastIndex = processedNumbers.length - 1;
      if (currentOperation === '*') {
        processedNumbers[lastIndex] *= currentNumber;
      } else {
        processedNumbers[lastIndex] /= currentNumber;
      }
    } else {
      // Addition ou soustraction : garder pour plus tard
      processedNumbers.push(currentNumber);
      processedOperations.push(currentOperation);
    }
  }
  
  // 2. Traiter les additions et soustractions
  let result = processedNumbers[0];
  for (let i = 0; i < processedOperations.length; i++) {
    if (processedOperations[i] === '+') {
      result += processedNumbers[i + 1];
    } else {
      result -= processedNumbers[i + 1];
    }
  }
  
  return Math.round(result * 100) / 100; // Arrondir à 2 décimales
};

const getRandomInt = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Fonction pour générer une fraction simple
const generateSimpleFraction = (): { numerator: number; denominator: number; value: number } => {
  const denominator = getRandomInt(2, 8); // Dénominateur entre 2 et 8
  const numerator = getRandomInt(1, denominator - 1); // Numérateur < dénominateur
  return {
    numerator,
    denominator,
    value: numerator / denominator
  };
};

// Fonction pour générer un carré parfait pour les racines
const generatePerfectSquare = (maxRoot: number = 20) => {
  const root = getRandomInt(2, maxRoot);
  return {
    root,
    square: root * root
  };
};

// ⭐⭐⭐ NOUVELLE FONCTION : Détecter le type de réponse ⭐⭐⭐
const getAnswerType = (answer: number): 'integer' | 'decimal' => {
  // Vérifie si la réponse est un entier (ex: 8) ou un décimal (ex: 8.5)
  return answer % 1 === 0 ? 'integer' : 'decimal';
};

// ⭐⭐⭐ NOUVELLE FONCTION : Générer une mauvaise réponse crédible ⭐⭐⭐
const generateWrongAnswer = (answer: number, answerType: 'integer' | 'decimal', range: number): number => {
  let wrongAnswer: number;
  
  if (answerType === 'integer') {
    // Pour les réponses entières → générer d'autres entières crédibles
    if (Math.random() < 0.3) {
      // 30% : erreur de calcul commune (double, moitié, ±10%)
      if (Math.random() < 0.5) {
        wrongAnswer = answer * 2; // Double
      } else {
        wrongAnswer = Math.round(answer / 2); // Moitié
      }
    } else if (Math.random() < 0.5) {
      // 35% : erreur proche (±1 à ±3)
      const offset = getRandomInt(-3, 3);
      wrongAnswer = answer + (offset !== 0 ? offset : 1);
    } else {
      // 35% : erreur dans la plage normale
      wrongAnswer = answer + getRandomInt(-range, range);
    }
    
    // S'assurer que c'est un entier différent de la réponse
    wrongAnswer = Math.round(wrongAnswer);
    if (wrongAnswer === answer) {
      wrongAnswer += (Math.random() > 0.5 ? 1 : -1);
    }
  } else {
    // Pour les réponses décimales → générer d'autres décimales crédibles
    const decimalPlaces = 2; // Toujours 2 décimales pour la cohérence
    const multiplier = Math.pow(10, decimalPlaces);
    
    if (Math.random() < 0.4) {
      // 40% : erreur proche (±0.1 à ±0.5)
      const offset = (getRandomInt(-5, 5)) / 10;
      wrongAnswer = answer + offset;
    } else if (Math.random() < 0.3) {
      // 30% : fraction simple proche (0.25, 0.33, 0.5, 0.66, 0.75)
      const commonDecimals = [0.25, 0.33, 0.5, 0.66, 0.75, 1.25, 1.33, 1.5, 1.66, 1.75];
      wrongAnswer = commonDecimals[getRandomInt(0, commonDecimals.length - 1)];
      // Ajuster pour être dans la plage
      const base = Math.floor(answer);
      wrongAnswer = base + wrongAnswer;
    } else {
      // 30% : erreur dans la plage normale
      wrongAnswer = answer + (getRandomInt(-range * 10, range * 10) / 10);
    }
    
    // Arrondir à 2 décimales et s'assurer que c'est différent
    wrongAnswer = Math.round(wrongAnswer * multiplier) / multiplier;
    if (Math.abs(wrongAnswer - answer) < 0.05) {
      wrongAnswer += 0.1;
    }
  }
  
  return wrongAnswer;
};

// ⭐⭐⭐ FONCTION generateOptions MODIFIÉE ⭐⭐⭐
const generateOptions = (answer: number, count: number, difficulty: GameDifficulty, questionType?: string): number[] => {
  const options = new Set<number>();
  const answerType = getAnswerType(answer);
  
  // Déterminer combien de décimales afficher
  const decimalPlaces = answerType === 'decimal' ? 2 : 0;
  const multiplier = Math.pow(10, decimalPlaces);
  
  // Formater la réponse correcte
  const formattedAnswer = Math.round(answer * multiplier) / multiplier;
  options.add(formattedAnswer);
  
  // Plage adaptée à la difficulté et au type de réponse
  let range: number;
  switch(difficulty) {
    case 'easy':
      range = Math.max(3, Math.abs(answer) / 3);
      break;
    case 'medium':
      range = Math.max(5, Math.abs(answer) / 2);
      break;
    case 'hard':
    case 'master':
      range = Math.max(8, Math.abs(answer) * 0.8);
      break;
  }
  
  // Générer des mauvaises réponses crédibles
  while (options.size < count) {
    const wrongAnswer = generateWrongAnswer(answer, answerType, range);
    
    // Vérifier que l'option n'est pas trop proche des autres
    let isTooClose = false;
    for (const opt of options) {
      if (Math.abs(opt - wrongAnswer) < (answerType === 'integer' ? 1 : 0.1)) {
        isTooClose = true;
        break;
      }
    }
    
    if (!isTooClose) {
      // Formater selon le type
      const formattedWrongAnswer = Math.round(wrongAnswer * multiplier) / multiplier;
      options.add(formattedWrongAnswer);
    }
    
    // Éviter la boucle infinie
    if (options.size < count && options.size > 1) {
      // Ajouter une option évidente mais crédible
      const obviousWrong = answerType === 'integer' 
        ? answer + (answer > 0 ? -range : range)
        : answer + (answer > 0 ? -range/2 : range/2);
      const formattedObvious = Math.round(obviousWrong * multiplier) / multiplier;
      options.add(formattedObvious);
    }
  }

  // Mélanger les options
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
  let numOptions = 4;
  let timeLimit = 15;
  let questionType: string = 'basic'; // 'basic', 'fraction', 'square', 'root'
  
  // Progression dynamique basée sur l'ID du problème
  const complexityFactor = Math.min(1, problemId / 20); // Sur 20 problèmes max

  switch (difficulty) {
    case 'easy':
      timeLimit = 15;
      numOptions = 3;
      questionType = 'basic';
      
      // Additions et soustractions simples
      const maxEasyNum = 20 + Math.floor(complexityFactor * 30); // 20 à 50
      num1 = getRandomInt(1, maxEasyNum);
      num2 = getRandomInt(1, maxEasyNum);
      
      operation = Math.random() > 0.5 ? '+' : '-';
      
      // Pour les soustractions, éviter les nombres négatifs
      if (operation === '-' && num2 > num1) {
        [num1, num2] = [num2, num1];
      }
      
      answer = operation === '+' ? num1 + num2 : num1 - num2;
      question = `${num1} ${operation} ${num2} = ?`;
      break;

    case 'medium':
      timeLimit = 12;
      questionType = 'basic';
      
      // 40% multiplications, 60% additions/soustractions
      if (Math.random() < 0.4) {
        num1 = getRandomInt(2, 10 + Math.floor(complexityFactor * 5)); // 2-15
        num2 = getRandomInt(2, 10);
        operation = '*';
        answer = num1 * num2;
        question = `${num1} × ${num2} = ?`;
      } else {
        const maxMedNum = 50 + Math.floor(complexityFactor * 50); // 50-100
        num1 = getRandomInt(10, maxMedNum);
        num2 = getRandomInt(10, maxMedNum);
        
        operation = Math.random() > 0.5 ? '+' : '-';
        if (operation === '-' && num2 > num1) {
          [num1, num2] = [num2, num1];
        }
        
        answer = operation === '+' ? num1 + num2 : num1 - num2;
        question = `${num1} ${operation} ${num2} = ?`;
      }
      break;

    case 'hard':
      timeLimit = 10;
      questionType = 'basic';
      
      // 25% divisions, 75% opérations mixtes
      if (Math.random() < 0.25) {
        // Division avec résultat entier
        num2 = getRandomInt(2, 12); // Diviseur
        answer = getRandomInt(2, 12); // Résultat
        num1 = num2 * answer; // Dividende
        operation = '/';
        question = `${num1} ÷ ${num2} = ?`;
      } else {
        // Opérations à 3 termes avec priorité
        num1 = getRandomInt(10, 30);
        num2 = getRandomInt(2, 15);
        num3 = getRandomInt(2, 10);
        
        const operations: string[] = [];
        operations.push(Math.random() > 0.5 ? '+' : '-');
        operations.push(Math.random() > 0.7 ? '*' : (Math.random() > 0.5 ? '+' : '-'));
        
        // Calcul avec priorité
        answer = calculateExpression([num1, num2, num3], operations);
        
        // Formater la question proprement
        question = `${num1} ${operations[0]} ${2} ${operations[1]} ${num3} = ?`;
      }
      break;

    case 'master':
      timeLimit = 8;
      
      // Répartition des types de problèmes pour Master :
      const problemType = Math.random();
      
      if (problemType < 0.2) {
        // Carrés simples
        questionType = 'square';
        num1 = getRandomInt(5, 20);
        answer = num1 * num1;
        question = `${num1}² = ?`;
      } 
      else if (problemType < 0.4) {
        // Racines carrées de carrés parfaits
        questionType = 'root';
        const { root, square } = generatePerfectSquare(15);
        answer = root;
        question = `√${square} = ?`;
      }
      else if (problemType < 0.6) {
        // Fractions simples
        questionType = 'fraction';
        const fraction1 = generateSimpleFraction();
        const fraction2 = generateSimpleFraction();
        
        // 50% addition, 50% soustraction de fractions
        if (Math.random() > 0.5) {
          // Addition de fractions
          if (fraction1.denominator === fraction2.denominator) {
            answer = fraction1.value + fraction2.value;
            question = `${fraction1.numerator}/${fraction1.denominator} + ${fraction2.numerator}/${fraction2.denominator} = ?`;
          } else {
            // Fractions avec dénominateurs différents (simples)
            const lcm = fraction1.denominator * fraction2.denominator;
            const num1Adj = fraction1.numerator * fraction2.denominator;
            const num2Adj = fraction2.numerator * fraction1.denominator;
            answer = (num1Adj + num2Adj) / lcm;
            question = `${fraction1.numerator}/${fraction1.denominator} + ${fraction2.numerator}/${fraction2.denominator} = ?`;
          }
        } else {
          // Soustraction (toujours résultat positif)
          const maxFraction = fraction1.value > fraction2.value ? fraction1 : fraction2;
          const minFraction = fraction1.value > fraction2.value ? fraction2 : fraction1;
          
          if (maxFraction.denominator === minFraction.denominator) {
            answer = maxFraction.value - minFraction.value;
            question = `${maxFraction.numerator}/${maxFraction.denominator} - ${minFraction.numerator}/${minFraction.denominator} = ?`;
          } else {
            const lcm = maxFraction.denominator * minFraction.denominator;
            const num1Adj = maxFraction.numerator * minFraction.denominator;
            const num2Adj = minFraction.numerator * maxFraction.denominator;
            answer = (num1Adj - num2Adj) / lcm;
            question = `${maxFraction.numerator}/${maxFraction.denominator} - ${minFraction.numerator}/${minFraction.denominator} = ?`;
          }
        }
        
        // Arrondir la réponse pour les fractions
        answer = Math.round(answer * 100) / 100;
      }
      else {
        // Nombres négatifs et opérations complexes
        questionType = 'complex';
        num1 = getRandomInt(-25, 40);
        num2 = getRandomInt(-20, 30);
        num3 = getRandomInt(-10, 15);
        
        const operations: string[] = [];
        operations.push(Math.random() > 0.5 ? '+' : '-');
        
        // 50% de chance d'avoir une troisième opération
        if (Math.random() > 0.5) {
          operations.push(Math.random() > 0.3 ? '*' : (Math.random() > 0.5 ? '+' : '-'));
          answer = calculateExpression([num1, num2, num3], operations);
          question = `${num1} ${operations[0]} ${num2} ${operations[1]} ${num3} = ?`;
        } else {
          answer = calculateExpression([num1, num2], operations);
          question = `${num1} ${operations[0]} ${num2} = ?`;
        }
        
        // Nettoyer l'affichage des doubles signes
        question = question.replace(/(\d+) \+ -(\d+)/g, '$1 - $2')
                          .replace(/(\d+) - -(\d+)/g, '$1 + $2');
      }
      break;
  }

  return {
    id: problemId,
    question,
    answer,
    options: generateOptions(answer, numOptions, difficulty, questionType),
    baseXp: 0, // À définir ailleurs
    timeLimit,
  };
};

/**
 * Génère l'ensemble des problèmes pour un niveau.
 */
export const generateMathLevel = (difficulty: GameDifficulty, level: number): MathProblem[] => {
  // Nombre de problèmes adapté à la difficulté
  const baseProblems = {
    easy: 10,
    medium: 10,
    hard: 10,
    master: 10
  };
  
  const numProblems = baseProblems[difficulty];
  const problems: MathProblem[] = [];

  for (let i = 0; i < numProblems; i++) {
    // Augmenter légèrement la complexité avec le niveau
    const adjustedProblemId = i + (level * 2);
    problems.push(generateProblem(difficulty, adjustedProblemId));
  }

  return problems;
};

// Fonction utilitaire pour tester (optionnelle)
export const testMathGenerator = () => {
  console.log("=== TEST MATH GENERATOR AMÉLIORÉ ===");
  
  const difficulties: GameDifficulty[] = ['easy', 'medium', 'hard', 'master'];
  
  difficulties.forEach(difficulty => {
    console.log(`\n--- ${difficulty.toUpperCase()} ---`);
    const problems = generateMathLevel(difficulty, 1);
    
    problems.slice(0, 4).forEach(problem => {
      console.log(`Q: ${problem.question}`);
      console.log(`A: ${problem.answer} (${getAnswerType(problem.answer)})`);
      console.log(`Options: ${problem.options.map(opt => opt.toFixed(2)).join(', ')}`);
      console.log(`Time: ${problem.timeLimit}s\n`);
    });
  });
};