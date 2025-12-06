import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useSettings } from '../../hooks/useSettings';
import { usePlayer } from '../../hooks/usePlayer';
import { useSound } from '../../hooks/useSound';
import { GameStackParamList } from '../../navigation/types';
import { NEURO_CONFIG, NeuroDifficulty } from '../../constants/neuroPuzzleConfig';
import { generateNeuroGrid, NeuroCell, generateLevelParams } from './neuroPuzzle.logic';
import GameEndModal from '../../components/modals/GameEndModal';

type Props = NativeStackScreenProps<GameStackParamList, 'NeuroPuzzle'>;

const { width } = Dimensions.get('window');

const NeuroPuzzleScreen = ({ route, navigation }: Props) => {
    const { difficulty, level, isDailyChallenge } = route.params;
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
    const [jokersLeft, setJokersLeft] = useState(3); // 3 jokers par partie
    const [isPeeking, setIsPeeking] = useState(false); // Est en train de regarder ?

    // Config actuelle
    const config = NEURO_CONFIG[difficulty as NeuroDifficulty];
    const cellSize = (width - 60) / config.gridSize; // Calcul dynamique de la taille des cases

    // NOUVEAU : État pour la progression fluide
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
        setSmoothProgress(1); // Reset progression ← NOUVEAU
        setPhase('memorize');
        setIsGameOver(false);
        setHasWon(false);
        // Sélectionner la première couleur par défaut
        setSelectedPaletteColor(config.availableColors[0]);
        setJokersLeft(3); // Reset jokers (ou garder entre les niveaux si vous préférez plus dur)
        setIsPeeking(false);

        // Arrêter toute animation en cours ← NOUVEAU
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
    };

    // Animation fluide ← FONCTION COMPLÈTEMENT NOUVELLE
    const animateProgress = (timestamp: number) => {
        if (!startTimeRef.current) {
            startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const totalDuration = initialTime * 1000;
        const progress = Math.max(0, 1 - elapsed / totalDuration);

        setSmoothProgress(progress);

        // Mettre à jour timeLeft pour l'affichage texte
        const remainingSeconds = Math.ceil(progress * initialTime);
        setTimeLeft(remainingSeconds);

        if (progress > 0) {
            animationRef.current = requestAnimationFrame(animateProgress);
        } else {
            // Fin du temps
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
            // Montrer le pattern pendant 2.0 secondes
            setTimeout(() => {
                setIsPeeking(false);
            }, 2000);
        }
    };

    // Timer de mémorisation
    // useEffect(() => {
    //     if (phase === 'memorize' && timeLeft > 0) {
    //         const timer = setInterval(() => {
    //             setTimeLeft((prev) => {
    //                 if (prev <= 1) {
    //                     clearInterval(timer);
    //                     setPhase('input'); // Passage automatique à la phase input
    //                     playSound('click'); // Petit son de transition
    //                     return 0;
    //                 }
    //                 return prev - 1;
    //             });
    //         }, 1000);
    //         return () => clearInterval(timer);
    //     }
    // }, [phase, timeLeft]);
    // Timer de mémorisation avec animation fluide ← COMPLÈTEMENT REMPLACÉ
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
            // Si on clique avec la même couleur, on efface (toggle)
            // Sinon on applique la couleur sélectionnée
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
        // Vérifier si la grille utilisateur correspond à la cible
        const isCorrect = grid.every((cell) => cell.userColor === cell.targetColor);

        if (isCorrect) {
            // VICTOIRE
            playSound('win');
            vibrate('success');
            setHasWon(true);
        } else {
            // DÉFAITE
            playSound('lose');
            vibrate('error');
            setHasWon(false);
        }

        setPhase('complete');
        setIsGameOver(true);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* HEADER & INFO */}
            <Text style={[styles.title, { color: theme.text }]}>
                NeuroPuzzle - Niv. {level}
            </Text>

            {phase === 'memorize' ? (
                <View style={styles.infoContainer}>
                    <Text style={[styles.phaseText, { color: theme.primary }]}>Mémorisez le motif !</Text>
                    <Text style={[styles.timerText, { color: theme.error }]}>{Math.ceil(timeLeft)}s</Text>
                    {/* <Text style={[styles.timerText, { color: theme.error }]}>{timeLeft}s</Text> */}
                    {/* Barre de progression du temps */}
                   
                    <View style={[styles.progressBarContainer, { backgroundColor: theme.card }]}>
                        <View
                            style={[
                                styles.progressBar,
                                {
                                    backgroundColor: theme.error,
                                   // width: `${(timeLeft / initialTime) * 100}%`
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
                    // Quelle couleur afficher ?
                    let displayColor = null;

                    if (phase === 'memorize' || isPeeking) { // AJOUT DE isPeeking
                        // Pendant la mémorisation, on affiche la cible
                        displayColor = cell.targetColor;
                    } else if (phase === 'input' || phase === 'complete') {
                        // Pendant l'input, on affiche ce que le joueur a mis
                        displayColor = cell.userColor;

                        // Si phase complete (résultat), on peut montrer les erreurs (optionnel, visuel avancé)
                        // Ici on reste simple pour le moment
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
                                    backgroundColor: displayColor || theme.card, // Couleur ou fond par défaut
                                    borderColor: theme.text,
                                    borderWidth: 1,
                                    borderRadius: difficulty === 'easy' ? 8 : 4,
                                }
                            ]}
                        >
                            {/* Animation d'apparition */}
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

            {/* joker pour plus voir */}
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

            {/* MODAL DE FIN DE PARTIE */}
            <GameEndModal
                visible={isGameOver}
                gameId="NeuroPuzzle" // Assurez-vous d'ajouter ça dans vos types GameId
                difficulty={difficulty}
                level={level}
                isVictory={hasWon}
                navigation={navigation}
                isDailyChallenge={isDailyChallenge} //  Passer au modal
                onClose={() => {
                    navigation.popToTop();
                    navigation.navigate('LevelSelect', {
                        gameId: 'NeuroPuzzle',
                        gameName: 'NeuroPuzzle',
                        difficulty
                    });
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    infoContainer: { width: '100%', marginBottom: 12, minHeight: 40 },
    phaseText: { fontSize: 18, textAlign: 'center', fontWeight: '600' },
    timerText: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },

    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignContent: 'center',
        // backgroundColor: 'rgba(0,0,0,0.05)',
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
    //style pour le joker
    toolsContainer: {
        marginTop: 15,
        alignItems: 'center',
    },
    jokerButton: {
        flexDirection: 'row',
        backgroundColor: '#F39C12', // Orange
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        alignItems: 'center',
        elevation: 3,
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
});

export default NeuroPuzzleScreen;