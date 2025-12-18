import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useSettings } from '../../hooks/useSettings';
import { usePlayer } from '../../hooks/usePlayer';
import { useSound } from '../../hooks/useSound';
import { GameStackParamList } from '../../navigation/types';
import { NEURO_CONFIG, NeuroDifficulty } from './neuroPuzzleConfig';
import { generateNeuroGrid, NeuroCell, generateLevelParams } from './neuroPuzzle.logic';
import GameEndModal from '../../components/modals/GameEndModal';
import GameScreenWrapper from '../../components/games/GameScreenWrapper'; // ⭐⭐⭐ AJOUT ⭐⭐⭐
import { useDailyChallenge } from '../../hooks/useDailyChallenge'; // ⭐⭐⭐ AJOUT ⭐⭐⭐

type Props = NativeStackScreenProps<GameStackParamList, 'NeuroPuzzle'>;

const { width } = Dimensions.get('window');

const NeuroPuzzleScreen = ({ route, navigation }: Props) => {
    const { difficulty, level } = route.params;
    const { isDailyChallenge } = useDailyChallenge(); // ⭐⭐⭐ UTILISEZ LE HOOK ⭐⭐⭐
    const { theme } = useSettings();
    const { playSound, vibrate } = useSound();

    // États du jeu
    const [grid, setGrid] = useState<NeuroCell[]>([]);
    const [phase, setPhase] = useState<'memorize' | 'input' | 'complete'>('memorize');
    const [selectedPaletteColor, setSelectedPaletteColor] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [initialTime, setInitialTime] = useState(0);

    // États de fin
    const [isGameOver, setIsGameOver] = useState(false);
    const [hasWon, setHasWon] = useState(false);

    // Ajoutez un état pour les Jokers
    const [jokersLeft, setJokersLeft] = useState(3);
    const [isPeeking, setIsPeeking] = useState(false);

    // Config actuelle
    const config = NEURO_CONFIG[difficulty as NeuroDifficulty];
    const cellSize = (width - 60) / config.gridSize;

    // État pour la progression fluide
    const [smoothProgress, setSmoothProgress] = useState(1);
    const animationRef = useRef<number>(null);
    const startTimeRef = useRef<number | null>(null);

    // Initialisation
    useEffect(() => {
        startLevel();
    }, [difficulty, level]);

    const startLevel = () => {
        const params = generateLevelParams(difficulty as NeuroDifficulty, level);
        const newGrid = generateNeuroGrid(difficulty as NeuroDifficulty, level);

        setGrid(newGrid);
        setInitialTime(params.memorizationTime);
        setTimeLeft(params.memorizationTime);
        setSmoothProgress(1);
        setPhase('memorize');
        setIsGameOver(false);
        setHasWon(false);
        setSelectedPaletteColor(config.availableColors[0]);
        setJokersLeft(3);
        setIsPeeking(false);

        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
    };

    // Animation fluide du timer
    const animateProgress = (timestamp: number) => {
        if (!startTimeRef.current) {
            startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const totalDuration = initialTime * 1000;
        const progress = Math.max(0, 1 - elapsed / totalDuration);

        setSmoothProgress(progress);

        const remainingSeconds = Math.ceil(progress * initialTime);
        setTimeLeft(remainingSeconds);

        if (progress > 0) {
            animationRef.current = requestAnimationFrame(animateProgress);
        } else {
            setPhase('input');
            playSound('click');
            setTimeLeft(0);
            setSmoothProgress(0);
        }
    };

    // Fonction pour utiliser le Joker
    const handleJoker = () => {
        if (jokersLeft > 0 && phase === 'input' && !isPeeking) {
            setJokersLeft(prev => prev - 1);
            setIsPeeking(true);
            setTimeout(() => {
                setIsPeeking(false);
            }, 2000);
        }
    };

    // Timer de mémorisation avec animation fluide
    useEffect(() => {
        if (phase === 'memorize' && initialTime > 0) {
            startTimeRef.current = undefined;
            animationRef.current = requestAnimationFrame(animateProgress);

            return () => {
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }
            };
        }
    }, [phase, initialTime]);

    // Gestion du clic sur une case
    const handleCellPress = (index: number) => {
        if (phase !== 'input' || isGameOver) return;
        if (!selectedPaletteColor) return;

        playSound('click');
        vibrate('default');

        setGrid((prevGrid) => {
            const newGrid = [...prevGrid];
            if (newGrid[index].userColor === selectedPaletteColor) {
                newGrid[index].userColor = null;
            } else {
                newGrid[index].userColor = selectedPaletteColor;
            }
            return newGrid;
        });
    };

    // Validation du résultat
    const handleValidate = () => {
        const isCorrect = grid.every((cell) => cell.userColor === cell.targetColor);

        if (isCorrect) {
            playSound('win');
            vibrate('success');
            setHasWon(true);
        } else {
            playSound('lose');
            vibrate('error');
            setHasWon(false);
        }

        setPhase('complete');
        setIsGameOver(true);
    };

    // Gestion du chargement
    if (grid.length === 0 && !isGameOver) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <Text style={{ color: theme.text }}>Chargement du puzzle...</Text>
            </View>
        );
    }

    return (
        <GameScreenWrapper gameId="NeuroPuzzle"> {/* ⭐⭐⭐ AJOUT DU WRAPPER ⭐⭐⭐ */}
            <View style={{ flex: 1 }}>
                {/* Interface du jeu - seulement si le jeu n'est pas terminé */}
                {!isGameOver && (
                    <View style={[styles.container, { backgroundColor: theme.background }]}>
                        {/* HEADER & INFO */}
                        <Text style={[styles.title, { color: theme.text }]}>
                            NeuroPuzzle - Niv. {level}
                        </Text>

                        {phase === 'memorize' ? (
                            <View style={styles.infoContainer}>
                                <Text style={[styles.phaseText, { color: theme.primary }]}>Mémorisez le motif !</Text>
                                <Text style={[styles.timerText, { color: theme.error }]}>{Math.ceil(timeLeft)}s</Text>
                                <View style={[styles.progressBarContainer, { backgroundColor: theme.card }]}>
                                    <View
                                        style={[
                                            styles.progressBar,
                                            {
                                                backgroundColor: theme.error,
                                                width: `${smoothProgress * 100}%`
                                            }
                                        ]}
                                    />
                                </View>
                            </View>
                        ) : (
                            <View style={styles.infoContainer}>
                                <Text style={[styles.phaseText, { color: theme.text }]}>Reproduisez le motif</Text>
                            </View>
                        )}

                        {/* GRILLE DE JEU */}
                        <View style={[
                            styles.gridContainer,
                            {
                                width: cellSize * config.gridSize,
                                height: cellSize * config.gridSize,
                                borderColor: theme.text,
                            }
                        ]}>
                            {grid.map((cell, index) => {
                                let displayColor = null;

                                if (phase === 'memorize' || isPeeking) {
                                    displayColor = cell.targetColor;
                                } else if (phase === 'input' || phase === 'complete') {
                                    displayColor = cell.userColor;
                                }

                                return (
                                    <TouchableOpacity
                                        key={cell.id}
                                        activeOpacity={0.8}
                                        onPress={() => handleCellPress(index)}
                                        style={[
                                            styles.cell,
                                            {
                                                width: cellSize - 4,
                                                height: cellSize - 4,
                                                backgroundColor: displayColor || theme.card,
                                                borderColor: theme.text,
                                                borderWidth: 1,
                                                borderRadius: difficulty === 'easy' ? 8 : 4,
                                            }
                                        ]}
                                    >
                                        {displayColor && (
                                            <MotiView
                                                from={{ opacity: 0, scale: 0.5 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ type: 'spring' }}
                                                style={StyleSheet.absoluteFill}
                                            />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* JOKER POUR REVOIR */}
                        {phase === 'input' && (
                            <View style={styles.toolsContainer}>
                                <TouchableOpacity
                                    style={[styles.jokerButton, { opacity: jokersLeft > 0 ? 1 : 0.5 }]}
                                    onPress={handleJoker}
                                    disabled={jokersLeft === 0 || isPeeking}
                                >
                                    <MaterialCommunityIcons name="eye" size={24} color="#FFF" />
                                    <Text style={{ color: '#FFF', fontWeight: 'bold', marginLeft: 5 }}>
                                        Voir ({jokersLeft})
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* PALETTE DE COULEURS (Uniquement en phase Input) */}
                        {phase === 'input' && (
                            <View style={styles.paletteContainer}>
                                {config.availableColors.map((color) => (
                                    <TouchableOpacity
                                        key={color}
                                        onPress={() => {
                                            playSound('click');
                                            setSelectedPaletteColor(color);
                                        }}
                                        style={[
                                            styles.paletteButton,
                                            { backgroundColor: color },
                                            selectedPaletteColor === color && {
                                                borderWidth: 3,
                                                borderColor: theme.text,
                                                transform: [{ scale: 1.1 }]
                                            }
                                        ]}
                                    />
                                ))}
                            </View>
                        )}

                        {/* BOUTON VALIDER */}
                        {phase === 'input' && (
                            <TouchableOpacity
                                style={[styles.validateButton, { backgroundColor: theme.primary }]}
                                onPress={handleValidate}
                            >
                                <Text style={styles.validateButtonText}>Valider</Text>
                                <MaterialCommunityIcons name="check" size={24} color="#FFF" />
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* ⭐⭐⭐ MODAL DE FIN DE PARTIE - TOUJOURS PRÉSENT ⭐⭐⭐ */}
                <GameEndModal
                    visible={isGameOver}
                    gameId="NeuroPuzzle"
                    difficulty={difficulty}
                    level={level}
                    isVictory={hasWon}
                  //  score={0} // ⭐⭐⭐ AJOUTEZ UN SCORE SI VOUS EN AVEZ UN ⭐⭐⭐
                    gameStats={{
                        timeLeft: timeLeft,
                        initialTime: initialTime,
                        jokersUsed: 3 - jokersLeft,
                        cellsCorrect: grid.filter(cell => cell.userColor === cell.targetColor).length,
                        totalCells: grid.length,
                    }}
                    navigation={navigation}
                    isDailyChallenge={isDailyChallenge}
                    onClose={() => {
                        setIsGameOver(false);
                        setHasWon(false);
                        
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

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        alignItems: 'center', 
        padding: 20 
    },
    title: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        marginBottom: 10 
    },
    infoContainer: { 
        width: '100%', 
        marginBottom: 12, 
        minHeight: 40 
    },
    phaseText: { 
        fontSize: 18, 
        textAlign: 'center', 
        fontWeight: '600' 
    },
    timerText: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        textAlign: 'center' 
    },
    progressBarContainer: {
        width: '100%',
        height: 8,
        borderRadius: 4,
        marginTop: 5,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignContent: 'center',
    },
    cell: {
        margin: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    paletteContainer: {
        flexDirection: 'row',
        marginTop: 15,
        justifyContent: 'center',
        gap: 10,
    },
    paletteButton: {
        width: 45,
        height: 45,
        borderRadius: 25,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    validateButton: {
        marginTop: 15,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        elevation: 5,
    },
    validateButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: 'bold',
        marginRight: 10,
    },
    toolsContainer: {
        marginTop: 15,
        alignItems: 'center',
    },
    jokerButton: {
        flexDirection: 'row',
        backgroundColor: '#F39C12',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        alignItems: 'center',
        elevation: 3,
    },
});

export default NeuroPuzzleScreen;