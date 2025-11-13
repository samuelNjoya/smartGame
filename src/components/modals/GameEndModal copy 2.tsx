// src/components/modals/GameEndModal.tsx

import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Alert } from 'react-native'; // Utilisation de TouchableOpacity au lieu de Button
import { useSettings } from '../../hooks/useSettings';
import { usePlayer } from '../../hooks/usePlayer';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GameStackParamList } from '../../navigation/types';
import ProgressionService from '../../services/ProgressionService';
import { BASE_XP_REWARDS, GameDifficulty, GameId, MAX_LEVELS } from '../../constants/gameData';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import RandomRewardModal from './RandomRewardModal';

// ... (GameEndModalProps type reste inchangé)
type GameEndModalProps = {
  visible: boolean;
  gameId: GameId;
  difficulty: GameDifficulty;
  level: number;
  isVictory: boolean;
  // La navigation est passée en prop pour manipuler l'empilement
  navigation: NativeStackNavigationProp<GameStackParamList>; 
  onClose: () => void;
};


// --- NOUVEAU COMPOSANT : Bouton de Navigation avec Icône ---
const NavButton = ({ title, icon, color, onPress, disabled = false }: any) => {
  return (
    <TouchableOpacity
      style={[styles.navButton, { backgroundColor: color, opacity: disabled ? 0.6 : 1 }]}
      onPress={onPress}
      disabled={disabled}
    >
      <MaterialCommunityIcons name={icon} size={20} color="#FFFFFF" />
      <Text style={styles.navButtonText}>{title}</Text>
    </TouchableOpacity>
  );
};
// --------------------------------------------------------

const GameEndModal = ({
  visible,
  gameId,
  difficulty,
  level,
  isVictory,
  navigation,
  onClose,
}: GameEndModalProps) => {
  const { theme } = useSettings();
  const { addXP } = usePlayer();
  
  const [xpEarned, setXpEarned] = useState(0);
  const [showRandomRewardModal, setShowRandomRewardModal] = useState(false);
  const [isNewLevelUnlocked, setIsNewLevelUnlocked] = useState(false);
  
  const isMultipleOf5 = level % 5 === 0;
  const isMultipleOf10 = level % 10 === 0;
  const maxLevels = MAX_LEVELS[difficulty];

  // --- Logique de Récompense et Progression (inchangée) ---
  React.useEffect(() => {
    if (!visible || !isVictory) return;
    // ... (Logique de calcul XP et déverrouillage)
    let baseXP = BASE_XP_REWARDS[difficulty];
    
    if (isMultipleOf5) {
      baseXP *= 2;
    }
    
    setXpEarned(baseXP);
    addXP(baseXP);

    const checkProgression = async () => {
      const unlocked = await ProgressionService.saveLevelCompletion(gameId, difficulty, level);
      setIsNewLevelUnlocked(unlocked);
      
      if (isMultipleOf10) {
        setTimeout(() => setShowRandomRewardModal(true), 500); 
      }
    };
    
    checkProgression();
  }, [visible, isVictory, gameId, difficulty, level, isMultipleOf5, isMultipleOf10, addXP]); // ajout de addXP dans dépendances

  
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
    // Utiliser popToTop pour garantir de sortir de la boucle de jeu
    // et revenir à l'écran de LevelSelect
    navigation.popToTop(); 
    navigation.navigate('LevelSelect', { gameId, gameName: gameId, difficulty }); 
  };
  
  const showPrevButton = level > 1; 
  const canGoNext = isVictory && isNewLevelUnlocked && level < maxLevels;
  const showNextButton = level < maxLevels; // On montre le bouton "Suivant" s'il existe

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
            {/* ... (Affichage des récompenses inchangé) */}
            {isVictory ? (
              <View style={styles.rewardBox}>
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
              {/* Bouton Quitter */}
              <NavButton 
                title="Quitter" 
                icon="exit-to-app" 
                onPress={handleQuit} 
                color={theme.secondary}
              />
              
              {/* Bouton Précédent */}
              {showPrevButton && (
                <NavButton 
                  title="Précédent" 
                  icon="arrow-left-bold-circle" 
                  onPress={handlePrev} 
                  color={theme.accent}
                />
              )}
              
              {/* Bouton Rejouer */}
              <NavButton 
                title="Rejouer" 
                icon="reload" 
                onPress={handleReplay} 
                color={theme.primary}
              />
              
              {/* Bouton Suivant */}
              {showNextButton && (
                <NavButton 
                  title="Suivant" 
                  icon="arrow-right-bold-circle" 
                  onPress={handleNext} 
                  color={theme.success}
                  disabled={!canGoNext} // Désactivé si on n'a pas gagné le niveau actuel
                />
              )}
            </View>
            
          </View>
        </View>
      </Modal>
      
      {/* Modal de récompense aléatoire (inchangé) */}
      <RandomRewardModal
        visible={showRandomRewardModal}
        onClose={() => {
          setShowRandomRewardModal(false);
          onClose(); 
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  // ... (Styles inchangés pour overlay, modal, title, rewardBox, etc.)
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
    flexWrap: 'wrap', // Permet de gérer le débordement
    justifyContent: 'center',
    width: '100%',
    marginTop: 20,
  },
  // NOUVEAUX STYLES POUR LES BOUTONS
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    margin: 4, // Espace entre les boutons
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default GameEndModal;