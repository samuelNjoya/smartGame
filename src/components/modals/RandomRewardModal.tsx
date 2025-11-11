// src/components/modals/RandomRewardModal.tsx

import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSettings } from '../../hooks/useSettings';
import { usePlayer } from '../../hooks/usePlayer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RANDOM_XP_REWARDS } from '../../constants/gameData';
import { MotiView } from 'moti';

type Reward = { label: string; value: number; id: number };

type Props = {
  visible: boolean;
  onClose: () => void;
};

// Fonction pour mélanger et sélectionner 6 récompenses
const generateRandomRewards = (): Reward[] => {
  // Garantir 6 choix
  const shuffledRewards = [...RANDOM_XP_REWARDS]
    .sort(() => 0.5 - Math.random()) // Mélange
    .slice(0, 6) // Prend les 6 premiers (si moins de 6 types existent, ça prend tout)
    .map((reward, index) => ({ 
      ...reward, 
      id: index, // Ajoute un ID pour l'affichage
      label: reward.value > 0 ? `+${reward.value} XP` : reward.label,
    }));
    
  // S'assurer d'avoir exactement 6 éléments (en dupliquant si nécessaire)
  while (shuffledRewards.length < 6) {
      shuffledRewards.push(shuffledRewards[Math.floor(Math.random() * shuffledRewards.length)]);
  }
  return shuffledRewards.slice(0, 6); // Rétrécir à 6
};

const RandomRewardModal = ({ visible, onClose }: Props) => {
  const { theme } = useSettings();
  const { addXP } = usePlayer();
  const [rewards] = useState<Reward[]>(generateRandomRewards);
  const [isClaimed, setIsClaimed] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  const handleClaimReward = (reward: Reward) => {
    if (isClaimed) return;
    
    setSelectedReward(reward);
    setIsClaimed(true);

    // Incrémenter l'XP de l'utilisateur
    addXP(reward.value);

    // Afficher un message de succès après un petit délai
    setTimeout(() => {
      Alert.alert(
        "Récompense Réclamée !",
        reward.value > 0 
          ? `Vous avez gagné ${reward.value} XP supplémentaires !`
          : "Dommage, mais vous avez tenté votre chance !",
        [{ text: "Super !", onPress: onClose }]
      );
    }, 500);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={isClaimed ? onClose : () => {}}>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.card }]}>
          <Text style={[styles.title, { color: theme.primary }]}>
            Bonus Spécial Niveau {selectedReward ? "" : "Multiple de 10"} !
          </Text>
          <MaterialCommunityIcons name="gift-outline" size={50} color={theme.accent} style={{ marginBottom: 10 }} />
          
          <Text style={[styles.message, { color: theme.text }]}>
            Choisissez l'une des six boîtes pour gagner une récompense XP aléatoire !
          </Text>

          <View style={styles.rewardGrid}>
            {rewards.map((reward, index) => (
              <MotiView
                key={reward.id}
                from={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', delay: index * 100 }}
              >
                <TouchableOpacity
                  style={[
                    styles.rewardBox, 
                    { 
                      backgroundColor: isClaimed ? (selectedReward?.id === reward.id ? theme.success : theme.secondary) : theme.primary,
                      borderColor: isClaimed && selectedReward?.id === reward.id ? '#FFD700' : 'transparent',
                      borderWidth: isClaimed ? 2 : 0,
                      opacity: isClaimed && selectedReward?.id !== reward.id ? 0.7 : 1,
                    }
                  ]}
                  onPress={() => handleClaimReward(reward)}
                  disabled={isClaimed}
                >
                  {isClaimed ? (
                    <Text style={[styles.rewardTextClaimed, { color: selectedReward?.id === reward.id ? theme.card : theme.background }]}>
                      {reward.label}
                    </Text>
                  ) : (
                    <MaterialCommunityIcons name="cube" size={30} color={theme.background} />
                  )}
                </TouchableOpacity>
              </MotiView>
            ))}
          </View>
          
          <Text style={[styles.footerText, { color: theme.secondary }]}>
            {isClaimed ? 'Fermez la boîte d’alerte pour continuer.' : 'Vous ne pouvez choisir qu\'une seule fois.'}
          </Text>
        </View>
      </View>
    </Modal>
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
    maxWidth: 400,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  rewardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  rewardBox: {
    width: '30%', // Pour 3 par ligne avec espace
    aspectRatio: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },
  rewardTextClaimed: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 12,
    padding: 5,
  },
  footerText: {
    fontSize: 12,
  }
});

export default RandomRewardModal;