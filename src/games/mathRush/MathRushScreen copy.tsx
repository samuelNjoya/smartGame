/// src/games/mathRush/MathRushScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Alert } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useSettings } from '../../hooks/useSettings';
import { usePlayer } from '../../hooks/usePlayer';
import { useSound } from '../../hooks/useSound';
import { GameStackParamList } from '../../navigation/types';
import { GameDifficulty } from '../../constants/gameData';
import { generateMathLevel, MathProblem } from './mathGenerator';
import GameEndModal from '../../components/modals/GameEndModal';

type Props = NativeStackScreenProps<GameStackParamList, 'MathRush'>;
const { width } = Dimensions.get('window');

interface GameState {
    totalPoints: number; // Score accumulé qui sera converti en XP
    errors: number;
    comboStreak: number; // Maintenu pour le suivi de la difficulté, mais non utilisé pour le score
    isFeverMode: boolean; // Maintenu, mais la logique est supprimée
    isGameOver: boolean;
    hasWonLevel: boolean;
}

const MathRushScreen = ({ route, navigation }: Props) => {
    const { difficulty, level } = route.params;
    const { theme } = useSettings();
    const { playSound, vibrate } = useSound();
    const { addXP, spendLife } = usePlayer();

    // ⭐⭐⭐ TOUS LES HOOKS EN PREMIER ⭐⭐⭐
    const [problems, setProblems] = useState<MathProblem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentState, setCurrentState] = useState<GameState>({
        totalPoints: 0,
        errors: 0,
        comboStreak: 0,
        isFeverMode: false,
        isGameOver: false,
        hasWonLevel: false,
    });

    const [showFeedback, setShowFeedback] = useState<{
        type: 'correct' | 'incorrect' | null;
        answer: number | null;
    }>({ type: null, answer: null });

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const feverTimerRef = useRef<NodeJS.Timeout | null>(null);
    const timeProgress = useRef(new Animated.Value(0)).current;
    const shakeAnimation = useRef(new Animated.Value(0)).current;

    // Fonction pour l'animation de secousse
    const triggerShake = () => {
        shakeAnimation.setValue(0);
        Animated.sequence([
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const startLevel = () => {
        const newProblems = generateMathLevel(difficulty, level);
        setProblems(newProblems);
        setCurrentIndex(0);
        setCurrentState({
            totalPoints: 0,
            errors: 0,
            comboStreak: 0,
            isFeverMode: false,
            isGameOver: false,
            hasWonLevel: false,
        });
    };

    // Logique du Timer
    const startTimer = (duration: number) => {
        // Nettoyage préalable
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        timeProgress.setValue(1);

        Animated.timing(timeProgress, {
            toValue: 0,
            duration: duration * 1000, // durée en millisecondes
            useNativeDriver: false,
        }).start(({ finished }) => {
            if (finished && problems[currentIndex]) {
                handleAnswer(null); // temps expire automatiquementfausse reponse
            }
        });

        timerRef.current = setTimeout(() => {
            if (problems[currentIndex]) {
                handleAnswer(null);
            }
        }, duration * 1000 + 100);
    };

    const handleAnswer = (answer: number | null) => {
        // VÉRIFICATION CRITIQUE
        if (!problems[currentIndex]) {
            console.warn('Problème non disponible pour currentIndex:', currentIndex);
            return;
        }
        

        timeProgress.stopAnimation();

        const problem = problems[currentIndex];
        const isCorrect = answer === problem.answer;
        let newTotalPoints = currentState.totalPoints;
        let newErrors = currentState.errors;
        let newStreak = currentState.comboStreak;
        let newFeverMode = currentState.isFeverMode;

        if (isCorrect) {
            playSound('success');
            vibrate('success');

            // ⭐ MODIFICATION 1: Ajout des points (pas de l'XP) à chaque bonne réponse, sans multiplier par Fever Mode
            const pointsGained = problem.baseXp;
            newTotalPoints += pointsGained; // Ajout au score interne de la partie (Points)
            newStreak += 1;

            // ⭐ MODIFICATION 2: Suppression de la logique de Fever Mode (alertes et gestion du timer)
            newFeverMode = false;
            if (feverTimerRef.current) clearTimeout(feverTimerRef.current);
        } else {
            playSound('error');
            vibrate('error');
            newErrors += 1;
            newStreak = 0;
            newFeverMode = false;
            if (feverTimerRef.current) clearTimeout(feverTimerRef.current);
        }

        // Mise à jour de l'état
        setCurrentState(prev => ({
            ...prev,
            totalPoints: newTotalPoints,
            errors: newErrors,
            comboStreak: newStreak,
            isFeverMode: newFeverMode
        }));

        // Vérification de la défaite
        if (newErrors >= 3) {
            setCurrentState(prev => ({ ...prev, isGameOver: true, hasWonLevel: false }));
            spendLife(1); //perte d'une vie
            return;
        }

        // Prochaine question
        setTimeout(() => setCurrentIndex(i => i + 1), 500);
    };

    const finishLevel = () => {
        const successRate = (problems.length - currentState.errors) / problems.length;
        const isVictory = successRate >= 0.8; //victoire 80% au moins

        let totalXp = currentState.totalPoints;

        //  MODIFICATION 3: Suppression de l'alerte de bonus et ajout d'XP uniquement si victoire
        if (currentState.errors === 0) {
            totalXp += 10; // Ajout du bonus d'XP si 0 erreur
        }

        if (isVictory) {
            addXP(totalXp); // L'XP est donné à la fin du niveau, uniquement si victoire
        } else {
            spendLife(1);
        }

        setCurrentState(prev => ({ ...prev, isGameOver: true, hasWonLevel: isVictory }));
    };

    // ⭐⭐⭐ USEFFECT APRÈS TOUTES LES FONCTIONS ⭐⭐⭐

    // Initialisation du niveau
    useEffect(() => {
        startLevel();
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (feverTimerRef.current) clearTimeout(feverTimerRef.current);
        };
    }, [difficulty, level]);

    // Gestion du changement de problème
    useEffect(() => {
        if (problems.length > 0 &&
            currentIndex < problems.length &&
            !currentState.isGameOver &&
            problems[currentIndex]) {
            startTimer(problems[currentIndex].timeLimit);
        } else if (currentIndex >= problems.length && problems.length > 0) {
            finishLevel();
        }
    }, [currentIndex, problems.length, currentState.isGameOver]);

    // Animation de secousse en cas d'erreur
    useEffect(() => {
        if (currentState.errors > 0 && !currentState.isGameOver) {
            triggerShake();
        }
    }, [currentState.errors, currentState.isGameOver]);

    // ⭐⭐⭐ LOGIQUE DE RENDU ⭐⭐⭐

    const currentProblem = problems[currentIndex];

    // Correction de l'ordre de rendu : le Modal d'abord, le chargement ensuite
    if (currentState.isGameOver) {
        return (
            <GameEndModal
                visible={currentState.isGameOver}
                gameId="MathRush"
                difficulty={difficulty}
                level={level}
                isVictory={currentState.hasWonLevel}
                score={currentState.totalPoints}
                navigation={navigation}
                onClose={() => {
                    navigation.popToTop();
                    navigation.navigate('LevelSelect', {
                        gameId: 'MathRush',
                        gameName: 'Calcul Express',
                        difficulty
                    });
                }}
            />
        );
    }

    // VÉRIFICATION SUPPLÉMENTAIRE POUR ÉVITER LE CRASH
    if (!currentProblem) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <Text style={{ color: theme.text }}>Chargement du problème...</Text>
            </View>
        );
    }

    // Largeur de la barre de temps
    const timeBarWidth = timeProgress.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    // Couleur de la barre de temps
    const getTimeBarColor = () => {
        const currentValue = timeProgress.__getValue();
        if (currentState.isFeverMode) return '#FFD700';
        if (currentValue < 0.3) return theme.error;
        return theme.success;
    };

    return (
        <Animated.View style={[styles.container, { backgroundColor: theme.background, transform: [{ translateX: shakeAnimation }] }]}>

            {/* Barre de Progression / Timer */}
            <View style={styles.timeBarContainer}>
                <Animated.View
                    style={[
                        styles.timeBar,
                        {
                            width: timeBarWidth,
                            backgroundColor: getTimeBarColor()
                        }
                    ]}
                />
            </View>

            {/* Statistiques (Score, Erreurs, Vies) */}
            <View style={styles.statsRow}>
                <Text style={[styles.statText, { color: theme.text }]}>Score: {currentState.totalPoints}</Text>
                <Text style={[styles.statText, { color: theme.error }]}>Erreurs: {currentState.errors}/3</Text>
                <Text style={[styles.statText, { color: theme.primary }]}>Combo: {currentState.comboStreak}</Text>
            </View>

            {/* ZONE DE QUESTION */}
            <View style={styles.questionContainer}>
                <Text style={[styles.questionText, { color: theme.text }]}>
                    {currentProblem.question}
                </Text>
            </View>

            {/* OPTIONS DE RÉPONSE */}
            <View style={styles.optionsContainer}>
                <AnimatePresence initial={false}>
                    {currentProblem.options.map((option, index) => (
                        <MotiView
                            key={option}
                            from={{ opacity: 0, translateY: 50 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ type: 'timing', duration: 300, delay: index * 50 }}
                        >
                            <TouchableOpacity
                                style={[styles.optionButton, { backgroundColor: theme.primary }]}
                                onPress={() => handleAnswer(option)}
                            >
                                <Text style={styles.optionText}>{option}</Text>
                            </TouchableOpacity>
                        </MotiView>
                    ))}
                </AnimatePresence>
            </View>

            {/* ⭐ MODIFICATION 4: Affichage clair du nombre total de questions (déjà fait, mais confirmé) */}
            <Text style={[styles.levelInfo, { color: theme.secondary }]}>
                Niveau {level} ({difficulty.toUpperCase()}) | Opération {currentIndex + 1}/{problems.length}
            </Text>
        </Animated.View>
    );
};

// ... (Styles inchangés)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    timeBarContainer: {
        width: '95%',
        height: 15,
        borderRadius: 8,
        backgroundColor: '#333333',
        overflow: 'hidden',
        marginTop: 20,
        marginBottom: 10,
    },
    timeBar: {
        height: '100%',
    },
    statsRow: {
        flexDirection: 'row',
        width: '90%',
        justifyContent: 'space-between',
        marginBottom: 40
    },
    statText: {
        fontSize: 16,
        fontWeight: 'bold'
    },
    questionContainer: {
        padding: 30,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginBottom: 50,
    },
    questionText: {
        fontSize: 48,
        fontWeight: '900',
        textAlign: 'center'
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%',
        paddingBottom: 50,
        gap: 15,
    },
    optionButton: {
        width: width * 0.4,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    optionText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF'
    },
    levelInfo: {
        fontSize: 14,
        marginBottom: 20
    }
});

export default MathRushScreen;