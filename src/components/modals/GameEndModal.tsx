// src/components/modals/GameEndModal.tsx

import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSettings } from '../../hooks/useSettings';
import { usePlayer, } from '../../hooks/usePlayer';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GameStackParamList } from '../../navigation/types';
import ProgressionService from '../../services/ProgressionService';
import { BASE_XP_REWARDS, GameDifficulty, GameId, MAX_LEVELS } from '../../constants/gameData';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import RandomRewardModal from './RandomRewardModal';
import { GameResult } from '../../contexts/PlayerContext';
import DailyChallengeService from '../../services/DailyChallengeService';
import DailyChallengeNavigation from '../../services/DailyChallengeNavigation';

type GameStats = Partial<GameResult['stats']>;

type GameEndModalProps = {
  visible: boolean;
  gameId: GameId;
  difficulty: GameDifficulty;
  level: number;
  isVictory: boolean;
  score: number;
  gameStats: GameStats;
  navigation: NativeStackNavigationProp<GameStackParamList>;
  onClose: () => void;
  isDailyChallenge?: boolean;
};

// ... (Le composant IconButton reste inchangé, je l'inclus pour que le code soit complet)
type IconButtonProps = {
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
  backgroundColor?: string;
};

const IconButton = ({ title, icon, color, onPress, disabled = false, backgroundColor }: IconButtonProps) => (
  <TouchableOpacity
    style={[
      styles.iconButton,
      { backgroundColor: backgroundColor || color + '20' },
      disabled && styles.disabledButton
    ]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
  >
    <Text style={[styles.buttonText, { color: disabled ? '#999' : color }]}>
      {title}
    </Text>
    <MaterialCommunityIcons
      name={icon as any}
      size={18}
      color={disabled ? '#999' : color}
      style={styles.buttonIcon}
    />
  </TouchableOpacity>
);

const GameEndModal = ({
  visible,
  gameId,
  difficulty,
  level,
  isVictory,
  score,
  gameStats,
  navigation,
  onClose,
  isDailyChallenge = false,
}: GameEndModalProps) => {
  const { theme } = useSettings();
  const { addXP, addGameResult } = usePlayer();

  // --- ÉTATS ---
  const [xpEarned, setXpEarned] = useState(0);
  
  // Gestion de l'affichage séquentiel
  const [showRandomRewardModal, setShowRandomRewardModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false); // Le modal principal de fin
  const [isLoading, setIsLoading] = useState(true); // Pour attendre la vérification "Déjà joué?"
  
  const [isNewLevelUnlocked, setIsNewLevelUnlocked] = useState(false);
  const [isFirstTimeBonus, setIsFirstTimeBonus] = useState(false); // Pour savoir si on affiche le texte "Bonus"

  const hasRecordedResult = useRef(false);

  const isMultipleOf5 = level % 5 === 0;
  const isMultipleOf10 = level % 10 === 0;
  const maxLevels = MAX_LEVELS[difficulty];

  // --- LOGIQUE PRINCIPALE ---
  useEffect(() => {
    // Si le modal global n'est pas visible, on reset tout
    if (!visible) {
      hasRecordedResult.current = false;
      setShowRandomRewardModal(false);
      setShowSummaryModal(false);
      setIsLoading(true);
      return;
    }

    // Protection contre double exécution
    if (hasRecordedResult.current) return;
    hasRecordedResult.current = true;

    const processGameResult = async () => {
      setIsLoading(true); // On commence le calcul

      // CAS 1 : DÉFI QUOTIDIEN
      if (isDailyChallenge) {
        const currentStatus = await DailyChallengeService.getStatus();
        if (currentStatus !== 'pending') {
          setIsLoading(false);
          setShowSummaryModal(true); // Afficher direct le résumé
          return;
        }
        
        await DailyChallengeService.completeChallenge(isVictory);
        
        if (isVictory) {
            const earned = DailyChallengeService.BONUS_XP;
            setXpEarned(earned);
            addXP(earned);
            saveResultToContext(earned, true);
        } else {
            setXpEarned(0);
            saveResultToContext(0, false);
        }
        
        setIsLoading(false);
        setShowSummaryModal(true);
        return;
      }

      // CAS 2 : MODE CARRIÈRE (C'est ici que la magie opère)
      if (isVictory) {
        // 1. Vérifier la progression (C'est cette fonction qui nous dit si c'est la PREMIÈRE fois)
        const isFirstTimeCompletion = await ProgressionService.saveLevelCompletion(gameId, difficulty, level);
        
        setIsNewLevelUnlocked(isFirstTimeCompletion);
        setIsFirstTimeBonus(isFirstTimeCompletion); // On garde l'info pour l'affichage

        // 2. Calcul de l'XP (Anti-Farming : Bonus seulement si first time)
        let baseXP = BASE_XP_REWARDS[difficulty];
        
        if (isMultipleOf5 && isFirstTimeCompletion) {
             baseXP *= 2; // Double XP seulement si première fois
        }
        
        setXpEarned(baseXP);
        addXP(baseXP);
        saveResultToContext(baseXP, true);

        // 3. Orchestration des Modales
        setIsLoading(false);

        if (isMultipleOf10 && isFirstTimeCompletion) {
            // Séquence A : D'abord le cadeau, puis le résumé
            setShowRandomRewardModal(true); 
            // Note: showSummaryModal reste false pour l'instant
        } else {
            // Séquence B : Directement le résumé
            setShowSummaryModal(true);
        }

      } else {
        // Défaite Carrière
        setXpEarned(0);
        saveResultToContext(0, false);
        setIsLoading(false);
        setShowSummaryModal(true);
      }
    };

    processGameResult();

  }, [visible, isVictory, gameId, difficulty, level, isDailyChallenge]);

  // Petite fonction utilitaire pour ne pas répéter le code
  const saveResultToContext = (xp: number, victory: boolean) => {
    addGameResult({
        gameId,
        difficulty,
        level,
        isVictory: victory,
        score: xp,
        stats: { ...gameStats, isDailyChallenge },
    });
  };

  // --- CALLBACK : Quand le coffre est fermé ---
  const handleRandomRewardClose = () => {
      setShowRandomRewardModal(false);
      // C'est ici qu'on déclenche l'affichage du résumé après le coffre
      setTimeout(() => {
          setShowSummaryModal(true);
      }, 300); // Petite pause pour la fluidité
  };


  // --- NAVIGATION ---
  const handleNavigation = (targetLevel: number) => {
    onClose(); // Ferme le GameEndModal (parent)
    if (targetLevel < 1 || targetLevel > maxLevels) return;
    // @ts-ignore
    navigation.replace(gameId, { difficulty, level: targetLevel });
  };

  const handleReplay = () => handleNavigation(level);
  const handleNext = () => handleNavigation(level + 1);
  
  const handleQuit = () => {
    onClose();
    navigation.popToTop();
    navigation.navigate('LevelSelect', { gameId, gameName: gameId, difficulty });
  };

  const handleChallengeQuit = () => {
    onClose();
    if (isDailyChallenge) {
      setTimeout(() => {
        DailyChallengeNavigation.exitChallenge(navigation);
      }, 100);
    }
  };

  const isChallengeFinished = isVictory && isDailyChallenge;
  const isChallengeFailed = !isVictory && isDailyChallenge;
  const showNextButton = level < maxLevels;

  // Si le modal parent n'est pas visible, on ne rend rien (ou vide)
  if (!visible) return null;

  return (
    <>
      {/* 1. MODAL DE RÉCOMPENSE ALÉATOIRE (Prioritaire) */}
      {/* Il s'affiche seul si showRandomRewardModal est true */}
      <RandomRewardModal
        visible={showRandomRewardModal}
        onClose={handleRandomRewardClose} // Appelle le résumé quand il se ferme
      />

      {/* 2. MODAL DE FIN DE JEU (RÉSUMÉ) */}
      {/* Il ne s'affiche que si showSummaryModal est true (après le chargement ou après le coffre) */}
      <Modal 
        visible={showSummaryModal} 
        transparent={true} 
        animationType="fade" 
        onRequestClose={onClose} // Fallback Android
      >
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: theme.card }]}>
            
            {/* Si c'est encore en train de calculer (très rapide normalement), on affiche un spinner */}
            {isLoading ? (
                <ActivityIndicator size="large" color={theme.primary} />
            ) : (
                <>
                    {/* Tête du modal */}
                    <MaterialCommunityIcons
                    name={isVictory ? "trophy-award" : "close-circle"}
                    size={60}
                    color={isVictory ? theme.success : theme.error}
                    />
                    <Text style={[styles.title, { color: theme.text }]}>
                    {isChallengeFinished ? "DÉFI ACCOMPLI !" : isChallengeFailed ? "DÉFI ÉCHOUÉ" : isVictory ? "NIVEAU TERMINÉ !" : "PARTIE TERMINÉE"}
                    </Text>

                    {/* Corps du modal */}
                    {isVictory ? (
                    <View style={styles.rewardBox}>
                        <Text style={[styles.rewardText, { color: theme.text }]}>
                        {`+${xpEarned} XP`}
                        </Text>
                        
                        {isChallengeFinished && (
                        <Text style={[styles.unlockText, { color: theme.success }]}>
                            ✅ Défi réussi !
                        </Text>
                        )}

                        {!isDailyChallenge && isNewLevelUnlocked && (
                        <Text style={[styles.unlockText, { color: theme.success }]}>
                            ✅ Niveau {level + 1} déverrouillé !
                        </Text>
                        )}

                        {/* Affiche le texte bonus UNIQUEMENT si c'était la première fois (isFirstTimeBonus) */}
                        {!isDailyChallenge && isMultipleOf5 && isFirstTimeBonus && (
                        <Text style={[styles.bonusText, { color: theme.primary }]}>
                            {isMultipleOf10 ? "🏆 DOUBLE XP + BONUS SPÉCIAL !" : "⭐️ DOUBLE BONUS XP (Première fois)!"}
                        </Text>
                        )}
                         {/* Petit message si le joueur refait un niveau déjà gagné */}
                         {!isDailyChallenge && isMultipleOf5 && !isFirstTimeBonus && (
                            <Text style={[styles.bonusText, { color: theme.secondary, fontSize: 12 }]}>
                                (Niveau déjà complété : XP standard)
                            </Text>
                        )}
                    </View>
                    ) : (
                    <Text style={[styles.defeatText, { color: theme.text }]}>
                        {isChallengeFailed ? "Réessaye demain !" : "Vous avez échoué. Réessayez !"}
                    </Text>
                    )}

                    {/* Pied du modal (Boutons) */}
                    <View style={styles.navContainer}>
                    {!isDailyChallenge ? (
                        <>
                        <IconButton
                            title="Rejouer"
                            icon="replay"
                            color={theme.primary}
                            onPress={handleReplay}
                        />
                        {showNextButton && isVictory && (
                            <IconButton
                            title="Suivant"
                            icon="arrow-right-circle"
                            color={theme.success}
                            onPress={handleNext}
                            // Le bouton suivant est actif si le niveau suivant est déjà débloqué OU si on vient de le débloquer
                            // Pour simplifier : actif si victoire. Le joueur peut aller au suivant s'il l'avait déjà débloqué avant.
                            disabled={false} 
                            />
                        )}
                        <IconButton
                            title="Quitter"
                            icon="exit-to-app"
                            color={theme.secondary}
                            onPress={handleQuit}
                        />
                        </>
                    ) : (
                        <IconButton
                        title="Terminer"
                        icon="check-circle"
                        color={theme.secondary}
                        backgroundColor={theme.success + '30'}
                        onPress={handleChallengeQuit}
                        />
                    )}
                    </View>
                </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    width: '90%',
    maxWidth: 380,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
  },
  rewardBox: {
    marginVertical: 15,
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  unlockText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
  },
  bonusText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 5,
    textAlign: 'center',
  },
  defeatText: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 15,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    minWidth: 90,
    marginHorizontal: 4,
  },
  buttonIcon: {
    marginRight: 4,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#eee',
  },
});

export default GameEndModal;