// src/games/mathRush/MathRushScreen.tsx
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
import GameScreenWrapper from '../../components/games/GameScreenWrapper';
import { useDailyChallenge } from '../../hooks/useDailyChallenge';

type Props = NativeStackScreenProps<GameStackParamList, 'MathRush'>;
const { width } = Dimensions.get('window');

interface GameState {
    totalPoints: number;
    errors: number;
    // ✅ MODIFICATION 1: Renommé en "succèsConsécutifs" au lieu de "comboStreak"
    succèsConsécutifs: number;
    isFeverMode: boolean;
    isGameOver: boolean;
    hasWonLevel: boolean;
}

// ✅ MODIFICATION 2: Interface pour le feedback visuel
interface FeedbackState {
    type: 'correct' | 'incorrect' | null;
    answer: number | null;
}

// ✅ MODIFICATION 2: Interface pour le système d'aide
interface HelpState {
    eliminationsLeft: number;
    eliminatedOptions: number[];
}

const MathRushScreen = ({ route, navigation }: Props) => {
    //const [modalVisible, setModalVisible] = useState(false); // <--- Utilisé mais pas en rendu
    const { isDailyChallenge } = useDailyChallenge();
    const { difficulty, level } = route.params; //, isDailyChallenge 
    const { theme } = useSettings();
    const { playSound, vibrate } = useSound();
    const { addXP, spendLife } = usePlayer();

    // ⭐⭐⭐ TOUS LES HOOKS EN PREMIER ⭐⭐⭐
    const [problems, setProblems] = useState<MathProblem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentState, setCurrentState] = useState<GameState>({
        totalPoints: 0,
        errors: 0,
        // ✅ MODIFICATION 1: Renommé en "succèsConsécutifs"
        succèsConsécutifs: 0,
        isFeverMode: false,
        isGameOver: false,
        hasWonLevel: false,
    });

    // ✅ MODIFICATION 2: État pour le système d'aide (2 utilisations par niveau)
    const [helpState, setHelpState] = useState<HelpState>({
        eliminationsLeft: 2,
        eliminatedOptions: [],
    });

    // ✅ MODIFICATION 3: État pour le feedback visuel
    const [feedback, setFeedback] = useState<FeedbackState>({
        type: null,
        answer: null,
    });

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const feverTimerRef = useRef<NodeJS.Timeout | null>(null);
    const timeProgress = useRef(new Animated.Value(0)).current;
    const shakeAnimation = useRef(new Animated.Value(0)).current;

    // ✅ MODIFICATION 3: Animation pour le feedback visuel
    const feedbackAnimation = useRef(new Animated.Value(0)).current;

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

    // ✅ MODIFICATION 3: Fonction pour afficher le feedback visuel
    const showFeedback = (type: 'correct' | 'incorrect', answer: number | null) => {
        setFeedback({ type, answer });

        feedbackAnimation.setValue(0);
        Animated.sequence([
            Animated.timing(feedbackAnimation, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false
            }),
            Animated.delay(1000), // Affiche pendant 1 seconde
            Animated.timing(feedbackAnimation, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false
            }),
        ]).start(() => {
            setFeedback({ type: null, answer: null });
        });
    };

    const startLevel = () => {
        const newProblems = generateMathLevel(difficulty, level);
        setProblems(newProblems);
        setCurrentIndex(0);
        setCurrentState({
            totalPoints: 0,
            errors: 0,
            // ✅ MODIFICATION 1: Réinitialisé à 0
            succèsConsécutifs: 0,
            isFeverMode: false,
            isGameOver: false,
            hasWonLevel: false,
        });
        // ✅ MODIFICATION 2: Réinitialisation du système d'aide
        setHelpState({
            eliminationsLeft: 2, // 2 utilisations par niveau
            eliminatedOptions: [],
        });
    };

    // Logique du Timer (inchangée)
    const startTimer = (duration: number) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        timeProgress.setValue(1);

        Animated.timing(timeProgress, {
            toValue: 0,
            duration: duration * 1000,
            useNativeDriver: false,
        }).start(({ finished }) => {
            if (finished && problems[currentIndex]) {
                handleAnswer(null);
            }
        });

        timerRef.current = setTimeout(() => {
            if (problems[currentIndex]) {
                handleAnswer(null);
            }
        }, duration * 1000 + 100);
    };

    // ✅ MODIFICATION 2: Fonction pour utiliser le système d'aide
    const useEliminationHelp = () => {
        if (helpState.eliminationsLeft <= 0 || !problems[currentIndex]) {
            return;
        }

        const problem = problems[currentIndex];
        // Trouver 2 mauvaises réponses (différentes de la bonne réponse)
        const wrongOptions = problem.options
            .map((option, index) => ({ option, index }))
            .filter(item => item.option !== problem.answer)
            .slice(0, 2);

        const wrongIndices = wrongOptions.map(item => item.index);

        setHelpState(prev => ({
            eliminationsLeft: prev.eliminationsLeft - 1,
            eliminatedOptions: [...wrongIndices],
        }));

        playSound('click');
    };

    const isAnswerProcessing = useRef(false);

    const handleAnswer = (answer: number | null) => {
        // ⭐⭐ EMPÊCHER LES APPELS MULTIPLES
        if (isAnswerProcessing.current) return;
        isAnswerProcessing.current = true;

        if (!problems[currentIndex]) {
            console.warn('Problème non disponible pour currentIndex:', currentIndex);
            return;
        }

        timeProgress.stopAnimation();

        const problem = problems[currentIndex];
        const isCorrect = answer === problem.answer;
        let newTotalPoints = currentState.totalPoints;
        let newErrors = currentState.errors;
        // ✅ MODIFICATION 1: Utilisation de "succèsConsécutifs" au lieu de "comboStreak"
        let newSuccèsConsécutifs = currentState.succèsConsécutifs;
        let newFeverMode = currentState.isFeverMode;

        if (isCorrect) {
            playSound('success');
            vibrate('success');

            const pointsGained = problem.baseXp;
            newTotalPoints += pointsGained;
            // ✅ MODIFICATION 1: Incrémenter les succès consécutifs
            newSuccèsConsécutifs += 1;

            newFeverMode = false;
            if (feverTimerRef.current) clearTimeout(feverTimerRef.current);

            // ✅ MODIFICATION 3: Afficher feedback correct
            showFeedback('correct', answer);
        } else {
            playSound('error');
            vibrate('error');
            newErrors += 1;
            // ✅ MODIFICATION 1: Réinitialiser les succès consécutifs à 0
            newSuccèsConsécutifs = 0;
            newFeverMode = false;
            if (feverTimerRef.current) clearTimeout(feverTimerRef.current);

            // ✅ MODIFICATION 3: Afficher feedback incorrect avec la bonne réponse
            showFeedback('incorrect', answer);
        }

        setCurrentState(prev => ({
            ...prev,
            totalPoints: newTotalPoints,
            errors: newErrors,
            // ✅ MODIFICATION 1: Mise à jour du nom
            succèsConsécutifs: newSuccèsConsécutifs,
            isFeverMode: newFeverMode
        }));

        // Réinitialiser les éliminations pour la prochaine question
        setHelpState(prev => ({
            ...prev,
            eliminatedOptions: []
        }));

        if (newErrors >= 3) {
            setCurrentState(prev => ({ ...prev, isGameOver: true, hasWonLevel: false }));
            //  spendLife(1);
            return;
        }

        // Prochaine question
        // setTimeout(() => setCurrentIndex(i => i + 1), 1500); // Augmenté pour laisser voir le feedback
        setTimeout(() => {
            if (!currentState.isGameOver) {
                setCurrentIndex(i => i + 1);
            }
            // ⭐⭐ RÉACTIVER POUR LA PROCHAINE QUESTION
            isAnswerProcessing.current = false;
        }, 1500);
    };

    const finishLevel = () => {
        const successRate = (problems.length - currentState.errors) / problems.length;
        const isVictory = successRate >= 0.8;

        let totalXp = currentState.totalPoints;

        if (currentState.errors === 0) {
            totalXp += 10;
        }

        if (isVictory) {
            addXP(totalXp);
        }
        // else {
        //     spendLife(1);
        // }

        //  setCurrentState(prev => ({ ...prev, isGameOver: true, hasWonLevel: isVictory }));
        // 2. Afficher le modal (MAINTENANT que le jeu est marqué comme terminé)
        // setModalVisible(true);
        // ⭐⭐⭐ DIRECTEMENT isGameOver, pas besoin de modalVisible ⭐⭐⭐
        setCurrentState(prev => ({
            ...prev,
            isGameOver: true,
            hasWonLevel: isVictory
        }));
    };

    // NOUVEAU: Fonction pour fermer le modal et réinitialiser l'état du jeu
    const handleCloseModal = () => {
        // 1. Cacher le modal
        //  setModalVisible(false);

        // 2. IMPORTANT: Réinitialiser isGameOver pour permettre le retour
        // Si nous ne faisons pas cela, l'écran reste en mode "isGameOver=true"
        setCurrentState(prev => ({ ...prev, isGameOver: false }));

        // Si le joueur veut rejouer/quitter le niveau, c'est le MODAL qui gère la navigation
        // C'est le rôle du modal de naviguer.
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

    // if (modalVisible) {
    // if (currentState.isGameOver) {
    //     return (
    //         <GameEndModal
    //            visible={currentState.isGameOver} 
    //           // visible={modalVisible}
    //             gameId="MathRush"
    //             difficulty={difficulty}
    //             level={level}
    //             isVictory={currentState.hasWonLevel}
    //             score={currentState.totalPoints}
    //             navigation={navigation}
    //             isDailyChallenge={isDailyChallenge} // 2. Passer au modal
    //             onClose={() => {
    //                 navigation.popToTop();
    //                 navigation.navigate('LevelSelect', {
    //                     gameId: 'MathRush',
    //                     gameName: 'Calcul Express',
    //                     difficulty
    //                 });
    //             }}
    //             // MODIFICATION CLÉ 1 : Utiliser la nouvelle fonction pour réinitialiser
    //         // onClose={handleCloseModal}
    //         />
    //     );
    // }

    // <GameEndModal
    //     visible={currentState.isGameOver} // ⭐⭐⭐ SUPPRIMEZ && modalVisible ⭐⭐⭐
    //     gameId="MathRush"
    //     difficulty={difficulty}
    //     level={level}
    //     isVictory={currentState.hasWonLevel}
    //     score={currentState.totalPoints}
    //     gameStats={{
    //         errors: currentState.errors,
    //         succèsConsécutifs: currentState.succèsConsécutifs,
    //     }}
    //     navigation={navigation}
    //     isDailyChallenge={isDailyChallenge}
    //     onClose={() => {
    //         // SUPPRIMEZ setModalVisible(false);
    //         setCurrentState(prev => ({
    //             ...prev,
    //             isGameOver: false,
    //             hasWonLevel: false
    //         }));

    //         // Pour les jeux normaux, réinitialiser
    //         if (!isDailyChallenge) {
    //             startLevel();
    //         }
    //     }}
    // />

    // PAR :
    if (!currentProblem && !currentState.isGameOver) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <Text style={{ color: theme.text }}>Chargement ...</Text>
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

    // ✅ MODIFICATION 3: Opacité animée pour le feedback
    const feedbackOpacity = feedbackAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.9],
    });

    return (
        <GameScreenWrapper gameId="MathRush">
            <View style={{ flex: 1 }}>
                {/* Interface du jeu - seulement si le jeu n'est pas terminé */}
                {!currentState.isGameOver && (
                    <Animated.View style={[styles.container, { backgroundColor: theme.background, transform: [{ translateX: shakeAnimation }] }]}>

                        {/* ✅ MODIFICATION 3: Overlay de feedback visuel */}
                        {feedback.type && (
                            <Animated.View
                                style={[
                                    styles.feedbackOverlay,
                                    {
                                        backgroundColor: feedback.type === 'correct' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)',
                                        opacity: feedbackOpacity
                                    }
                                ]}
                            >
                                <MotiView
                                    from={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring' }}
                                >
                                    <MaterialCommunityIcons
                                        name={feedback.type === 'correct' ? 'check-circle' : 'close-circle'}
                                        size={80}
                                        color="#FFFFFF"
                                    />
                                    <Text style={styles.feedbackText}>
                                        {feedback.type === 'correct' ? 'Correct ! 🎉' : 'Faux ! 😞'}
                                    </Text>
                                    {feedback.type === 'incorrect' && (
                                        <Text style={styles.correctAnswerText}>
                                            Réponse correcte: {currentProblem?.answer}
                                        </Text>
                                    )}
                                </MotiView>
                            </Animated.View>
                        )}

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
                            <Text style={[styles.statText, { color: theme.text }]}>{currentIndex + 1}/{problems.length}</Text>
                            <Text style={[styles.statText, { color: theme.error }]}>Erreurs: {currentState.errors}/3</Text>
                            <Text style={[styles.statText, { color: theme.primary }]}>Succès: {currentState.succèsConsécutifs}</Text>
                        </View>

                        {/* ✅ MODIFICATION 2: Bouton d'aide pour éliminer 2 mauvaises réponses */}
                        <TouchableOpacity
                            style={[
                                styles.helpButton,
                                {
                                    backgroundColor: helpState.eliminationsLeft > 0 ? theme.primary : '#CCCCCC',
                                    opacity: helpState.eliminationsLeft > 0 ? 1 : 0.5
                                }
                            ]}
                            onPress={useEliminationHelp}
                            disabled={helpState.eliminationsLeft === 0}
                        >
                            <MaterialCommunityIcons
                                name="filter-remove"
                                size={24}
                                color="#FFFFFF"
                            />
                            <Text style={styles.helpButtonText}>
                                Éliminer 2 mauvaises réponses ({helpState.eliminationsLeft})
                            </Text>
                        </TouchableOpacity>

                        {/* ZONE DE QUESTION */}
                        <View style={styles.questionContainer}>
                            <Text style={[styles.questionText, { color: theme.text }]}>
                                {currentProblem?.question}
                            </Text>
                        </View>

                        {/* OPTIONS DE RÉPONSE */}
                        <View style={styles.optionsContainer}>
                            <AnimatePresence initial={false}>
                                {currentProblem?.options.map((option, index) => {
                                    // ✅ MODIFICATION 2: Vérifier si cette option est éliminée
                                    const isEliminated = helpState.eliminatedOptions.includes(index);

                                    return (
                                        <MotiView
                                            key={option}
                                            from={{ opacity: 0, translateY: 50 }}
                                            animate={{
                                                opacity: isEliminated ? 0.3 : 1,
                                                translateY: 0
                                            }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            transition={{ type: 'timing', duration: 300, delay: index * 50 }}
                                        >
                                            <TouchableOpacity
                                                style={[
                                                    styles.optionButton,
                                                    {
                                                        backgroundColor: isEliminated ? '#666666' : theme.primary,
                                                        opacity: isEliminated ? 0.5 : 1
                                                    }
                                                ]}
                                                onPress={() => !isEliminated && handleAnswer(option)}
                                                disabled={isEliminated}
                                            >
                                                {isEliminated && (
                                                    <MaterialCommunityIcons
                                                        name="close"
                                                        size={24}
                                                        color="#FFFFFF"
                                                        style={styles.eliminatedIcon}
                                                    />
                                                )}
                                                <Text style={styles.optionText}>{option}</Text>
                                            </TouchableOpacity>
                                        </MotiView>
                                    );
                                })}
                            </AnimatePresence>
                        </View>

                        {/* Information du niveau */}
                        <Text style={[styles.levelInfo, { color: theme.secondary }]}>
                            Niveau {level} ({difficulty.toUpperCase()}) | Question {currentIndex + 1}/{problems.length}
                        </Text>
                    </Animated.View>
                )}

                {/* ⭐⭐⭐ MODAL DE FIN DE JEU - TOUJOURS PRÉSENT DANS L'ARBRE ⭐⭐⭐ */}
                <GameEndModal
                    visible={currentState.isGameOver} // ⭐⭐⭐ SUPPRIMEZ && modalVisible ⭐⭐⭐
                    gameId="MathRush"
                    difficulty={difficulty}
                    level={level}
                    isVictory={currentState.hasWonLevel}
                    score={currentState.totalPoints}
                    gameStats={{
                        errors: currentState.errors,
                        succèsConsécutifs: currentState.succèsConsécutifs,
                    }}
                    navigation={navigation}
                    isDailyChallenge={isDailyChallenge}
                    onClose={() => {
                        // SUPPRIMEZ setModalVisible(false);
                        setCurrentState(prev => ({
                            ...prev,
                            isGameOver: false,
                            hasWonLevel: false
                        }));

                        // Pour les jeux normaux, réinitialiser
                        if (!isDailyChallenge) {
                            startLevel();
                        }
                    }}
                />
            </View>
        </GameScreenWrapper>
    );
};

// ✅ AJOUT DES NOUVEAUX STYLES
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
        marginBottom: 20, // Réduit pour faire de la place au bouton d'aide
    },
    statText: {
        fontSize: 16,
        fontWeight: 'bold'
    },
    // ✅ MODIFICATION 2: Styles pour le bouton d'aide
    helpButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 25,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    helpButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 14,
    },
    questionContainer: {
        padding: 30,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginBottom: 40, // Réduit pour équilibrer l'espace
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
        position: 'relative', // Pour l'icône d'élimination
    },
    optionText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF'
    },
    // ✅ MODIFICATION 2: Style pour l'icône d'élimination
    eliminatedIcon: {
        position: 'absolute',
        top: 5,
        right: 5,
    },
    // ✅ MODIFICATION 3: Styles pour le feedback visuel
    feedbackOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000, // Au-dessus de tout
    },
    feedbackText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginTop: 20,
        paddingHorizontal: 20,
    },
    correctAnswerText: {
        fontSize: 22,
        color: '#FFFFFF',
        marginTop: 10,
        fontWeight: '600',
    },
    levelInfo: {
        fontSize: 14,
        marginBottom: 20
    }
});

export default MathRushScreen;