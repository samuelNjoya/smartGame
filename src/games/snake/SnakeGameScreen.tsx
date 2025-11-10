// src/games/snake/SnakeGameScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Alert } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { MotiView } from 'moti';
import { useSettings } from '../../hooks/useSettings';
import { usePlayer } from '../../hooks/usePlayer';
import { GameScreenProps } from '../../navigation/types';

type Props = GameScreenProps<'Snake'>;

// --- Config Snake ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SIZE = 15;
const CELL_SIZE = Math.floor(SCREEN_WIDTH * 0.9 / GRID_SIZE);
const BOARD_SIZE = CELL_SIZE * GRID_SIZE;

// --- Types ---
type Direction = 'up' | 'down' | 'left' | 'right';
type Coordinate = { x: number; y: number };

// --- Hook de Boucle de Jeu ---
const useGameLoop = (callback: () => void, interval: number) => {
  useEffect(() => {
    let frameId: number;
    let lastTime = 0;

    const loop = (time: number) => {
      if (time - lastTime >= interval) {
        callback();
        lastTime = time;
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [callback, interval]);
};

// --- Composant Snake ---
const SnakeGameScreen = ({ route }: Props) => {
  const { difficulty } = route.params;
  const { theme } = useSettings();
  const { spendLife, lives, addXP } = usePlayer();

  const [snake, setSnake] = useState<Coordinate[]>([{ x: 5, y: 5 }]);
  const [food, setFood] = useState<Coordinate>(getRandomCoordinate());
  const [direction, setDirection] = useState<Direction>('right');
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const gameSpeed = difficulty === 'easy' ? 200 : difficulty === 'medium' ? 120 : 70;

  // Initialisation
  useEffect(() => {
    if (lives <= 0) {
        Alert.alert("Plus de vies", "Vous n'avez plus de vies.");
        return;
    }
    spendLife();
    resetGame();
  }, []);

  const resetGame = () => {
    setSnake([{ x: 5, y: 5 }]);
    setFood(getRandomCoordinate());
    setDirection('right');
    setIsGameOver(false);
    setScore(0);
  };
  
  // La boucle de jeu
  useGameLoop(() => {
    if (isGameOver) return;

    // 1. Calculer la nouvelle tête
    const head = { ...snake[0] };
    switch (direction) {
      case 'up': head.y -= 1; break;
      case 'down': head.y += 1; break;
      case 'left': head.x -= 1; break;
      case 'right': head.x += 1; break;
    }

    // 2. Vérifier les collisions (murs et corps)
    if (
      head.x < 0 || head.x >= GRID_SIZE ||
      head.y < 0 || head.y >= GRID_SIZE ||
      snake.some(segment => segment.x === head.x && segment.y === head.y)
    ) {
      setIsGameOver(true);
      Alert.alert("Perdu !", `Score final: ${score}`);
      return;
    }

    const newSnake = [head, ...snake];

    // 3. Vérifier la nourriture
    if (head.x === food.x && head.y === food.y) {
      setScore(s => s + 1);
      setFood(getRandomCoordinate(newSnake)); // Nouvelle nourriture
      // Ne pas enlever la queue (le serpent grandit)
    } else {
      newSnake.pop(); // Enlever la queue
    }

    setSnake(newSnake);
  }, gameSpeed);
  
  // Gestures (Swipes)
  const swipeGesture = Gesture.Pan()
    .minDistance(20)
    .onEnd((e) => {
      const { translationX, translationY } = e;
      if (Math.abs(translationX) > Math.abs(translationY)) {
        if (translationX > 0 && direction !== 'left') setDirection('right');
        else if (translationX < 0 && direction !== 'right') setDirection('left');
      } else {
        if (translationY > 0 && direction !== 'up') setDirection('down');
        else if (translationY < 0 && direction !== 'down') setDirection('up');
      }
    });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.score, { color: theme.text }]}>Score: {score}</Text>
      
      <GestureDetector gesture={swipeGesture}>
        <View style={[styles.board, { width: BOARD_SIZE, height: BOARD_SIZE, backgroundColor: theme.card }]}>
          {/* Rendu du Serpent */}
          {snake.map((segment, index) => (
            <MotiView
              key={index}
              style={[
                styles.snakeSegment,
                {
                  left: segment.x * CELL_SIZE,
                  top: segment.y * CELL_SIZE,
                  backgroundColor: index === 0 ? theme.success : theme.primary,
                },
              ]}
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
          ))}
          {/* Rendu de la Nourriture */}
          <MotiView
            style={[
              styles.food,
              {
                left: food.x * CELL_SIZE,
                top: food.y * CELL_SIZE,
                backgroundColor: theme.error,
              },
            ]}
          />
        </View>
      </GestureDetector>
    </View>
  );
};

// --- Fonctions utilitaires ---
function getRandomCoordinate(snake: Coordinate[] = []): Coordinate {
  let newFood: Coordinate;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    // S'assurer que la nourriture n'est pas sur le serpent
    if (!snake.some(seg => seg.x === newFood.x && seg.y === newFood.y)) {
      break;
    }
  }
  return newFood;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  score: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  board: {
    borderWidth: 2,
    borderColor: '#555',
  },
  snakeSegment: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    position: 'absolute',
  },
  food: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    position: 'absolute',
    borderRadius: CELL_SIZE / 2,
  },
});

export default SnakeGameScreen;