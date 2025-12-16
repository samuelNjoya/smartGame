// src/components/modals/GameEndModal.tsx

import React, { useRef, useState } from 'react';
import { View, Text, Modal, StyleSheet, Button, Alert, TouchableOpacity } from 'react-native';
import { useSettings } from '../../hooks/useSettings';
import { usePlayer, } from '../../hooks/usePlayer';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GameStackParamList } from '../../navigation/types';
import ProgressionService from '../../services/ProgressionService';
import { BASE_XP_REWARDS, GameDifficulty, GameId, MAX_LEVELS } from '../../constants/gameData';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import RandomRewardModal from './RandomRewardModal'; // NOUVEL IMPORT
import { GameResult } from '../../contexts/PlayerContext';
import DailyChallengeService from '../../services/DailyChallengeService';
import DailyChallengeNavigation from '../../services/DailyChallengeNavigation';
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
  isDailyChallenge?: boolean; // pour les défis quotidiens
};

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
  score,              // <-- NOUVELLE PROP
  //stars = 0,          // <-- NOUVELLE PROP
  gameStats,          // <-- NOUVELLE PROP
  navigation,
  onClose,

  isDailyChallenge = false, // Valeur par défaut
}: GameEndModalProps) => {
  const { theme } = useSettings();
  //pourquoi addGameResult et spendLife
  const { addXP, addGameResult, spendLife } = usePlayer();

  const [xpEarned, setXpEarned] = useState(0);
  const [showRandomRewardModal, setShowRandomRewardModal] = useState(false);
  const [isNewLevelUnlocked, setIsNewLevelUnlocked] = useState(false);
  // ⭐⭐⭐ AJOUT : Ref pour suivre si l'enregistrement a déjà été fait ⭐⭐⭐
  const hasRecordedResult = useRef(false);

  const isMultipleOf5 = level % 5 === 0;
  const isMultipleOf10 = level % 10 === 0;
  const maxLevels = MAX_LEVELS[difficulty];


  // --- Logique de Récompense et Progression ---
  React.useEffect(() => {
    //if (!visible) return;
    // ⭐⭐⭐ CORRECTION : Réinitialiser quand le modal devient invisible ⭐⭐⭐
    if (!visible) {
      hasRecordedResult.current = false;
      return;
    }
    // ⭐⭐⭐ CORRECTION : Ne pas enregistrer si déjà fait ⭐⭐⭐
    if (hasRecordedResult.current) {
      return;
    }

    hasRecordedResult.current = true;

    // --- 1. Enregistrement des statistiques (Indépendant de la victoire) ---
    // Nous enregistrons le résultat seulement si le niveau est terminé (visible est true)
    // Le score brut est passé en prop (score), l'XP gagné sera calculé ci-dessous.

    // Le `score` passé en prop est le score de base de la partie (ex: score de 1250 pour Snake)
    // L'XP gagné (xpEarned) est la récompense finale qui sera ajoutée à l'XP total du joueur.

    let baseXP = 0;

    const processGameResult = async () => {
      // Si c'est un Défi Quotidien, marquer le défi comme joué immédiatement
      if (isDailyChallenge) {
        const currentStatus = await DailyChallengeService.getStatus(); //await 

        // Si le défi n'est plus "pending", ça veut dire qu'il a déjà été traité
        if (currentStatus !== 'pending') {
          console.log('⚠️ Défi déjà traité, pas de nouvel enregistrement');
          return; // On arrête ici, pas d'enregistrement double
        }
        // Sinon, on marque comme complété
        DailyChallengeService.completeChallenge(isVictory); // <-- CORRECTION 3: Joué, qu'on gagne ou perde isVictory
      }

      if (isVictory) {

        if (isDailyChallenge) {
          baseXP = DailyChallengeService.BONUS_XP;
          // Pas d'appel à ProgressionService.saveLevelCompletion() ici (CORRECTION 2)
        } else {
          baseXP = BASE_XP_REWARDS[difficulty];
          if (isMultipleOf5) baseXP *= 2;

          // Vérifier et enregistrer la progression (Uniquement en mode CARRIÈRE)
          const checkProgression = async () => {
            // CORRECTION 2: ON N'APPELE CECI QUE SI CE N'EST PAS UN DÉFI
            const unlocked = await ProgressionService.saveLevelCompletion(gameId, difficulty, level);
            setIsNewLevelUnlocked(unlocked);

            if (isMultipleOf10) {
              setTimeout(() => setShowRandomRewardModal(true), 500);
            }
          };
          checkProgression();
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
          //  stats: gameStats,
          // Ajoutez un marqueur dans les stats pour le retrouver plus tard si voulu
          stats: { ...gameStats, isDailyChallenge },
        });

      } else {
        // --- ENREGISTREMENT DANS LE CONTEXTE (Défaite) ---
        // Optionnel : Enregistrer la défaite pour les stats globales (taux de réussite)
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
    };
    processGameResult();

  }, [visible, isVictory, gameId, difficulty, level, isMultipleOf5, isMultipleOf10, score, gameStats, isDailyChallenge]); //, stars,
  // ...

  // Remplacer TOUT le useEffect actuel (lignes 65 à 166) par : le pb de navigation reaparais apres ça et pour le haut pb de doublon

  // ⭐⭐⭐ CORRECTION SIMPLE ET EFFICACE ⭐⭐⭐
  // React.useEffect(() => {
  //   // Ne rien faire si le modal n'est pas visible
  //   if (!visible) {
  //     hasRecordedResult.current = false;
  //     return;
  //   }

  //   // Si on a déjà enregistré le résultat, ne rien faire
  //   if (hasRecordedResult.current) {
  //     return;
  //   }

  //   // Marquer immédiatement que l'enregistrement est en cours
  //   hasRecordedResult.current = true;

  //   const processGameResult = async () => {
  //     // ⭐⭐⭐ CORRECTION CRITIQUE : Pour les défis quotidiens, vérifier d'abord l'état actuel ⭐⭐⭐
  //     if (isDailyChallenge) {
  //       const currentStatus = await DailyChallengeService.getStatus();

  //       // Si le défi n'est plus "pending", ça veut dire qu'il a déjà été traité
  //       if (currentStatus !== 'pending') {
  //         console.log('⚠️ Défi déjà traité, pas de nouvel enregistrement');
  //         return; // On arrête ici, pas d'enregistrement double
  //       }

  //       // Sinon, on marque comme complété
  //       DailyChallengeService.completeChallenge(isVictory);
  //     }

  //     if (isVictory) {
  //       let baseXP = 0;

  //       if (isDailyChallenge) {
  //         baseXP = DailyChallengeService.BONUS_XP;
  //         // Pour les défis, ne pas enregistrer dans la progression normale
  //       } else {
  //         baseXP = BASE_XP_REWARDS[difficulty];
  //         if (isMultipleOf5) baseXP *= 2;

  //         // Enregistrer la progression (Uniquement en mode CARRIÈRE)
  //         const unlocked = await ProgressionService.saveLevelCompletion(gameId, difficulty, level);
  //         setIsNewLevelUnlocked(unlocked);

  //         if (isMultipleOf10) {
  //           setTimeout(() => setShowRandomRewardModal(true), 500);
  //         }
  //       }

  //       // Application de l'XP au joueur
  //       setXpEarned(baseXP);
  //       addXP(baseXP);

  //       // Enregistrement dans le contexte
  //       addGameResult({
  //         gameId,
  //         difficulty,
  //         level,
  //         isVictory: true,
  //         score: baseXP,
  //         stats: { ...gameStats, isDailyChallenge },
  //       });

  //     } else {
  //       // Pour la défaite
  //       addGameResult({
  //         gameId,
  //         difficulty,
  //         level,
  //         isVictory: false,
  //         score: 0,
  //         stats: gameStats,
  //       });
  //       setXpEarned(0);
  //     }
  //   };

  //   processGameResult();
  // }, [visible, isVictory, gameId, difficulty, level, isMultipleOf5, isMultipleOf10,score,gameStats, isDailyChallenge]);

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
  //   const handleQuit = () => {
  //     onClose(); // Ferme le modal (et réinitialise l'état isGameOver dans MathRushScreen)
  //     // Tente de revenir à l'écran de sélection de niveau/jeu
  //     navigation.navigate('LevelSelect' as any); 
  //     // Si LevelSelect n'est pas l'écran parent direct, vous devrez peut-être ajuster:
  //     // navigation.popToTop(); 
  //     // navigation.navigate('LevelSelect', { gameId, gameName: gameId, difficulty }); 
  // };

  // NOUVELLE FONCTION de sortie pour le Défi
  // const handleChallengeQuit = () => {
  //   onClose();
  //   navigation.navigate('DailyChallenge' as any);
  // };

  // NOUVELLE FONCTION de sortie pour le Défi (CORRECTION 1)

  // const handleChallengeQuit = () => {
  //     onClose(); // 1. Fermer le modal
  //     // 2. Tenter de revenir en arrière dans la pile actuelle (sortir du jeu)
  //     // Cela fonctionne si le jeu est l'écran au sommet de la pile GameStack.
  //    navigation.goBack(); 
  //     // 3. Naviguer vers l'écran DailyChallenge (le tab)
  //     // On utilise la navigation du tab (MainTabs), qui est accessible depuis n'importe quel enfant.
  //     // Assurez-vous que le nom de l'onglet est bien 'DailyChallenge' dans MainTabs.tsx
  //     navigation.navigate('DailyChallenge' as any); 
  // };

  const handleChallengeQuit = () => {
    onClose(); // Fermer le modal

    if (isDailyChallenge) {
      // Attendre un peu pour éviter les conflits
      setTimeout(() => {
        // Utiliser notre service de navigation
        //  DailyChallengeNavigation.getInstance().exitChallenge(navigation);
        DailyChallengeNavigation.exitChallenge(navigation);
      }, 100);
    }
  };
  // AJOUTER cet effet pour nettoyer quand le modal se ferme
  React.useEffect(() => {
    return () => {
      // Quand le modal se démonte, vérifier si c'était un défi
      if (isDailyChallenge) {
        DailyChallengeNavigation.clearChallenge();
      }
    };
  }, [isDailyChallenge]);

  // On ne peut pas revenir avant le niveau 1
  //const showPrevButton = level > 1; 
  // On ne peut pas aller au-delà du dernier niveau
  const showNextButton = level < maxLevels;

  const isChallengeFinished = isVictory && isDailyChallenge;
  const isChallengeFailed = !isVictory && isDailyChallenge;


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
            {/* <Text style={[styles.title, { color: theme.text }]}>
              {isVictory ? "NIVEAU TERMINÉ !" : "PARTIE TERMINÉE"}
            </Text> */}
            <Text style={[styles.title, { color: theme.text }]}>
              {isChallengeFinished ? "DÉFI ACCOMPLI !" : isChallengeFailed ? "DÉFI ÉCHOUÉ" : isVictory ? "NIVEAU TERMINÉ !" : "PARTIE TERMINÉE"}
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
                {isChallengeFinished && (
                  // CORRECTION 3 (MESSAGE DE FIN)
                  <Text style={[styles.unlockText, { color: theme.success }]}>
                    ✅ Défi réussi ! Reviens demain pour un nouveau challenge.
                  </Text>
                )}
                {!isDailyChallenge && isNewLevelUnlocked && (
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
              // <Text style={[styles.defeatText, { color: theme.text }]}>
              //   Vous avez échoué. Réessayez pour progresser !
              // </Text>
              <Text style={[styles.defeatText, { color: theme.text }]}>
                {isChallengeFailed ?
                  "Tu as échoué le Défi du Jour. Réessaye demain !" :
                  "Vous avez échoué. Réessayez pour progresser !"
                }
              </Text>
            )}


            {/* Pied du modal (Navigation - CORRECTION 2 & 4) */}
            <View style={styles.navContainer}>

              {/* Boutons de Carrière (UNIQUEMENT si ce n'est PAS un défi quotidien) */}
              {!isDailyChallenge ? (
                <>
                  {/* <Button
                    title="Rejouer"
                    onPress={handleReplay}
                    color={theme.primary}
                  /> */}
                  <IconButton
                    title="Rejouer"
                    icon="replay"
                    color={theme.primary}
                    onPress={handleReplay}
                  />
                  {showNextButton && isVictory && (
                    // <Button
                    //   title="Suivant"
                    //   onPress={handleNext}
                    //   color={theme.success}
                    //   disabled={!isNewLevelUnlocked && level >= maxLevels}
                    // />
                    <IconButton
                      title="Suivant"
                      icon="arrow-right-circle"
                      color={theme.success}
                      onPress={handleNext}
                      disabled={!isNewLevelUnlocked && level >= maxLevels}
                    />
                  )}
                  {/* <Button
                    title="Quitter"
                    onPress={handleQuit} // Quitter vers LevelSelect
                    color={theme.secondary}
                  /> */}
                  <IconButton
                    title="Quitter"
                    icon="exit-to-app"
                    color={theme.secondary}
                    onPress={handleQuit}
                  />
                </>
              ) : (
                // Bouton Unique pour le Défi Quotidien
                // <Button
                //   title="Terminer et Quitter"
                //   onPress={handleChallengeQuit} // Quitter vers DailyChallengeScreen
                //   color={theme.secondary}
                // />
                <IconButton
                  title="Terminer et Quitter"
                  icon="check-circle"
                  color={theme.secondary}
                  backgroundColor={theme.success + '30'}
                  onPress={handleChallengeQuit}
                />
              )}
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
    //justifyContent: 'space-around',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },

  //style pour les nouveaux boutons
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