// src/components/modals/GameEndModal.tsx

import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, Button, Alert } from 'react-native';
import { useSettings } from '../../hooks/useSettings';
import { usePlayer, } from '../../hooks/usePlayer';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GameStackParamList } from '../../navigation/types';
import ProgressionService from '../../services/ProgressionService';
import { BASE_XP_REWARDS, GameDifficulty, GameId, MAX_LEVELS } from '../../constants/gameData';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import RandomRewardModal from './RandomRewardModal'; // NOUVEL IMPORT
import { GameResult } from '../../contexts/PlayerContext';
// On crée un type partiel pour les stats pour les props
type GameStats = Partial<GameResult['stats']>;

type GameEndModalProps = {
  visible: boolean;
  gameId: GameId;
  difficulty: GameDifficulty;
  level: number;
  isVictory: boolean;

  score: number;             // <<-- NOUVEAU: Le score brut (XP de base)
  //stars?: number;           // <<-- NOUVEAU: Le nombre d'étoiles obtenues (0 à 3)
  gameStats: GameStats;      // <<-- NOUVEAU: Stats détaillées (temps, erreurs, etc.)
  // La navigation est passée en prop pour manipuler l'empilement
  navigation: NativeStackNavigationProp<GameStackParamList>;
  onClose: () => void;
};

const GameEndModal = ({
  visible,
  gameId,
  difficulty,
  level,
  isVictory,
  score,              // <-- NOUVELLE PROP
  //stars = 0,          // <-- NOUVELLE PROP
  gameStats,          // <-- NOUVELLE PROP
  navigation,
  onClose,
}: GameEndModalProps) => {
  const { theme } = useSettings();
  //pourquoi addGameResult et spendLife
  const { addXP, addGameResult, spendLife } = usePlayer();

  const [xpEarned, setXpEarned] = useState(0);
  const [showRandomRewardModal, setShowRandomRewardModal] = useState(false);
  const [isNewLevelUnlocked, setIsNewLevelUnlocked] = useState(false);

  const isMultipleOf5 = level % 5 === 0;
  const isMultipleOf10 = level % 10 === 0;
  const maxLevels = MAX_LEVELS[difficulty];

  // --- Logique de Récompense et Progression ---
  // React.useEffect(() => {
  //   if (!visible || !isVictory) return;

  //   let baseXP = BASE_XP_REWARDS[difficulty];

  //   // Multiples de 5 donnent un double bonus
  //   if (isMultipleOf5) {
  //     baseXP *= 2;
  //   }

  //   setXpEarned(baseXP);
  //   addXP(baseXP);

  //   // Vérifier et enregistrer la progression
  //   const checkProgression = async () => {
  //     const unlocked = await ProgressionService.saveLevelCompletion(gameId, difficulty, level);
  //     setIsNewLevelUnlocked(unlocked);

  //     // Multiples de 10 déclenchent le modal de récompense aléatoire
  //     if (isMultipleOf10) {
  //       // Afficher le modal aléatoire après le gain initial
  //       setTimeout(() => setShowRandomRewardModal(true), 500); 
  //     }
  //   };

  //   checkProgression();
  // }, [visible, isVictory, gameId, difficulty, level, isMultipleOf5, isMultipleOf10]);

  // --- Logique de Récompense et Progression ---
  React.useEffect(() => {
    if (!visible) return;

    // --- 1. Enregistrement des statistiques (Indépendant de la victoire) ---
    // Nous enregistrons le résultat seulement si le niveau est terminé (visible est true)
    // Le score brut est passé en prop (score), l'XP gagné sera calculé ci-dessous.

    // Le `score` passé en prop est le score de base de la partie (ex: score de 1250 pour Snake)
    // L'XP gagné (xpEarned) est la récompense finale qui sera ajoutée à l'XP total du joueur.

    let baseXP = 0;

    if (isVictory) {
      // Calcul de l'XP à donner
      baseXP = BASE_XP_REWARDS[difficulty];

      // Multiples de 5 donnent un double bonus
      if (isMultipleOf5) {
        baseXP *= 2;
      }
      // Application de l'XP au joueur (ce qui monte son niveau global)
      setXpEarned(baseXP);
      addXP(baseXP);

      // --- ENREGISTREMENT DANS LE CONTEXTE (Victoire) ---
      addGameResult({
        gameId,
        difficulty,
        level,
        isVictory: true,
        score: baseXP, // Xp gagné
        //  stars: stars,
        stats: gameStats,
      });


      // Vérifier et enregistrer la progression
      const checkProgression = async () => {
        const unlocked = await ProgressionService.saveLevelCompletion(gameId, difficulty, level); // , stars <-- MODIFIÉ pour inclure les étoiles
        setIsNewLevelUnlocked(unlocked);

        // Multiples de 10 déclenchent le modal de récompense aléatoire
        if (isMultipleOf10) {
          setTimeout(() => setShowRandomRewardModal(true), 500);
        }
      };
      checkProgression();

    } else {
      // --- ENREGISTREMENT DANS LE CONTEXTE (Défaite) ---
      // Optionnel : Enregistrer la défaite pour les stats globales (taux de réussite)
      // La perte de vie est gérée dans le composant de jeu ou par un appel direct à spendLife, 
      // pas ici pour éviter la double déduction.
      addGameResult({
        gameId,
        difficulty,
        level,
        isVictory: false,
        score: 0, // Score nul en cas de défaite
        // stars: 0,
        stats: gameStats,
      });
      setXpEarned(0); // Pas d'XP gagné en cas de défaite
    }

  }, [visible, isVictory, gameId, difficulty, level, isMultipleOf5, isMultipleOf10, score, gameStats]); //, stars,
  // ...

  // --- Fonctions de Navigation ---
  const handleNavigation = (targetLevel: number) => {
    onClose();
    if (targetLevel < 1 || targetLevel > maxLevels) return;

    // Remplace l'écran de jeu actuel par le nouvel écran de jeu
    // @ts-ignore
    navigation.replace(gameId, { difficulty, level: targetLevel });
  };

  const handleReplay = () => handleNavigation(level);
  const handleNext = () => handleNavigation(level + 1);
  const handlePrev = () => handleNavigation(level - 1);
  // NOUVELLE FONCTION : Quitter et retourner à la liste des niveaux
  const handleQuit = () => {
    onClose();
    // Utiliser popToTop pour garantir de sortir de la boucle de jeu  et revenir à l'écran de LevelSelect
    navigation.popToTop();
    navigation.navigate('LevelSelect', { gameId, gameName: gameId, difficulty });
  };

  // On ne peut pas revenir avant le niveau 1
  //const showPrevButton = level > 1; 
  // On ne peut pas aller au-delà du dernier niveau
  const showNextButton = level < maxLevels;


  return (
    <>
      <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: theme.card }]}>

            {/* Tête du modal (Victoire/Défaite) */}
            <MaterialCommunityIcons
              name={isVictory ? "trophy-award" : "close-circle"}
              size={60}
              color={isVictory ? theme.success : theme.error}
            />
            <Text style={[styles.title, { color: theme.text }]}>
              {isVictory ? "NIVEAU TERMINÉ !" : "PARTIE TERMINÉE"}
            </Text>

            {/* Corps du modal (Récompenses) */}
            {isVictory ? (
              <View style={styles.rewardBox}>
                {/* SCORE BRUT DU JEU */}
                {/* <Text style={[styles.scoreTextDetail, { color: theme.secondary }]}>
                  Score de la partie : {score} points
                </Text> */}
                <Text style={[styles.rewardText, { color: theme.text }]}>
                  {`+${xpEarned} XP`}
                </Text>
                {isNewLevelUnlocked && (
                  <Text style={[styles.unlockText, { color: theme.success }]}>
                    ✅ Niveau {level + 1} déverrouillé !
                  </Text>
                )}
                {isMultipleOf5 && (
                  <Text style={[styles.bonusText, { color: theme.primary }]}>
                    {isMultipleOf10 ? "🏆 DOUBLE BONUS XP + SPÉCIAL MULTIPLE DE 10 !" : "⭐️ DOUBLE BONUS XP (Multiple de 5)!"}
                  </Text>
                )}
              </View>
            ) : (
              <Text style={[styles.defeatText, { color: theme.text }]}>
                Vous avez échoué. Réessayez pour progresser !
              </Text>
            )}

            {/* Pied du modal (Navigation) */}
            <View style={styles.navContainer}>
              {/* {showPrevButton && (
                <Button 
                  title="Précédent" 
                  onPress={handlePrev} 
                  color={theme.accent}
                />
              )} */}
              <Button
                title="Rejouer"
                onPress={handleReplay}
                color={theme.primary}
              />
              {showNextButton && isVictory && (
                <Button
                  title="Suivant"
                  onPress={handleNext}
                  color={theme.success}
                  disabled={!isNewLevelUnlocked && level >= maxLevels}
                />
              )}
              <Button
                title="Quitter"
                onPress={handleQuit}
                color={theme.secondary}
              />
              {!showNextButton && <Button title="Liste des niveaux" onPress={onClose} color={theme.text} />}
            </View>

          </View>
        </View>
      </Modal>

      {/* Modal de récompense aléatoire (s'affiche après le premier) */}
      <RandomRewardModal
        visible={showRandomRewardModal}
        onClose={() => {
          setShowRandomRewardModal(false);
          // Permettre de fermer le modal principal après les deux
          onClose();
        }}
      />
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
    padding: 25,
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
});

export default GameEndModal;