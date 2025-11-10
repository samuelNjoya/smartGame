// src/games/quiz/QuizGameScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { useSettings } from '../../hooks/useSettings';
import { usePlayer } from '../../hooks/usePlayer';
import { GameScreenProps } from '../../navigation/types';
import { QuizQuestion, getQuizQuestions } from './quiz.data';
import { GAME_CONFIG } from '../../constants/config';

type Props = GameScreenProps<'Quiz'>;

const QuizGameScreen = ({ route, navigation }: Props) => {
  const { difficulty } = route.params;
  const { theme } = useSettings();
  const { addXP, spendLife, lives } = usePlayer();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  
  const currentQuestion = questions[currentQuestionIndex];

  // Chargement et début du jeu
  useEffect(() => {
    if (lives <= 0) {
      Alert.alert("Plus de vies", "Vous n'avez plus de vies pour jouer.", [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      return;
    }
    spendLife();
    setQuestions(getQuizQuestions(difficulty));
    setCurrentQuestionIndex(0);
    setScore(0);
    setIsFinished(false);
  }, [difficulty]);

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null) return; // Déjà répondu

    setSelectedAnswer(answerIndex);
    const correct = answerIndex === currentQuestion.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      setScore(s => s + 1);
    }
    
    // Délai avant de passer à la question suivante
    setTimeout(() => {
      goToNextQuestion();
    }, 1500);
  };

  const goToNextQuestion = () => {
    setSelectedAnswer(null);
    setIsCorrect(null);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Fin du quiz
      finishGame();
    }
  };
  
  const finishGame = () => {
    setIsFinished(true);
    const xpWon = score * GAME_CONFIG.DEFAULT_XP_PER_WIN;
    addXP(xpWon);
    Alert.alert(
      "Quiz Terminé !",
      `Votre score : ${score}/${questions.length}\nVous gagnez ${xpWon} XP !`
    );
  };
  
  // Gérer la couleur du bouton
  const getButtonColor = (index: number) => {
    if (selectedAnswer === null) return theme.card; // Défaut
    if (index === currentQuestion.correctAnswer) return theme.success; // Bonne réponse
    if (index === selectedAnswer && !isCorrect) return theme.error; // Mauvaise réponse
    return theme.card; // Autres
  };

  if (isFinished) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Quiz Terminé !</Text>
        <Text style={[styles.score, { color: theme.text }]}>
          Score final : {score} / {questions.length}
        </Text>
        {/* TODO: Boutons Précédent, Rejouer, Suivant */}
      </View>
    );
  }

  if (!currentQuestion) {
    return <View style={[styles.container, { backgroundColor: theme.background }]}><Text style={{ color: theme.text }}>Chargement...</Text></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.progress, { color: theme.text }]}>
        Question {currentQuestionIndex + 1} / {questions.length}
      </Text>
      
      <AnimatePresence>
        <MotiView
          key={currentQuestionIndex} // Clé unique pour forcer l'animation
          from={{ opacity: 0, translateX: 300 }}
          animate={{ opacity: 1, translateX: 0 }}
          exit={{ opacity: 0, translateX: -300 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.questionContainer}>
          <Text style={[styles.questionText, { color: theme.text }]}>
            {currentQuestion.question}
          </Text>
        </MotiView>
      </AnimatePresence>

      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.optionButton, { backgroundColor: getButtonColor(index) }]}
            onPress={() => handleAnswer(index)}
            disabled={selectedAnswer !== null}>
            <Text style={[styles.optionText, { color: theme.text }]}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  score: { fontSize: 20, textAlign: 'center', marginVertical: 10 },
  progress: { fontSize: 16, color: 'grey', textAlign: 'right', marginBottom: 10 },
  questionContainer: {
    marginVertical: 20,
    padding: 15,
  },
  questionText: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  optionsContainer: {
    marginTop: 20,
  },
  optionButton: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  optionText: { fontSize: 18, textAlign: 'center' },
});

export default QuizGameScreen;