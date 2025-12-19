// src/components/modals/RandomRewardModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated
} from 'react-native';
import { useSettings } from '../../hooks/useSettings';
import { usePlayer } from '../../hooks/usePlayer';
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { RANDOM_XP_REWARDS } from '../../constants/gameData';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Reward = {
  label: string;
  value: number;
  id: number;
  icon?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

// Fonction pour générer des récompenses avec des icônes
const generateRandomRewards = (): Reward[] => {
  // Icônes pour différentes récompenses
  const rewardIcons = [
    'gift', 'diamond', 'star', 'crown', 'rocket', 'trophy',
    'coin', 'lightning-bolt', 'heart', 'shield', 'fire', 'medal'
  ];

  const shuffledRewards = [...RANDOM_XP_REWARDS]
    .sort(() => 0.5 - Math.random())
    .slice(0, 6)
    .map((reward, index) => ({
      ...reward,
      id: index,
      label: reward.value > 0 ? `+${reward.value} XP` : reward.label,
      icon: rewardIcons[index % rewardIcons.length]
    }));

  while (shuffledRewards.length < 6) {
    const randomIndex = Math.floor(Math.random() * shuffledRewards.length);
    shuffledRewards.push({ ...shuffledRewards[randomIndex], id: shuffledRewards.length });
  }

  return shuffledRewards.slice(0, 6);
};

// Couleurs pour les différents montants de récompense
const getRewardColor = (value: number, theme: any) => {
  if (value <= 0) return theme.secondary;
  if (value <= 50) return '#4CAF50'; // Vert
  if (value <= 100) return '#2196F3'; // Bleu
  if (value <= 200) return '#9C27B0'; // Violet
  return '#FF9800'; // Orange pour les grosses récompenses
};

const RandomRewardModal = ({ visible, onClose }: Props) => {
  const { theme } = useSettings();
  const { addXP } = usePlayer();
  const [rewards] = useState<Reward[]>(generateRandomRewards);
  const [isClaimed, setIsClaimed] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Animation de pulsation pour les boîtes
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const handleClaimReward = async (reward: Reward) => {
    if (isClaimed) return;

    // Feedback haptique
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setSelectedReward(reward);
    setIsClaimed(true);

    // Animation de sélection
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Ajouter l'XP
    addXP(reward.value);

    // Feedback visuel amélioré
    setTimeout(() => {
      // Animation de victoire
      if (reward.value > 100) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Fermer automatiquement après 3 secondes
      // setTimeout(() => {
      //   Animated.timing(scaleAnim, {
      //     toValue: 0,
      //     duration: 300,
      //     useNativeDriver: true,
      //   }).start(onClose);
      // }, 3000);
    }, 500);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              backgroundColor: theme.background || 'rgba(255, 255, 255, 0.95)',
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 20,
            }
          ]}
        >
          {/* En-tête avec effet de dégradé */}
          <View style={[styles.header, {
            backgroundColor: theme.primary,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }]}>
            <View style={styles.headerContent}>
              <MaterialCommunityIcons name="crown" size={30} color="#FFD700" />
              <Text style={styles.headerTitle}>BONUS SPÉCIAL</Text>
              <MaterialCommunityIcons name="crown" size={30} color="#FFD700" />
            </View>
            <Text style={styles.subTitle}>Niveau Multiple de 10 Débloqué !</Text>
          </View>

          <View style={styles.content}>
            {/* Icône centrale animée */}
            <MotiView
              from={{ rotate: '0deg' }}
              animate={{ rotate: '360deg' }}
              transition={{ type: 'timing', duration: 20000, loop: true }}
              style={styles.centralIconContainer}
            >
              <FontAwesome5 name="gift" size={40} color={theme.accent} />
            </MotiView>

            {/* Message principal */}
            <Text style={[styles.message, { color: theme.text }]}>
              🎉 Félicitations ! Vous avez débloqué un bonus spécial.
            </Text>
            <Text style={[styles.instructions, { color: theme.text }]}>
              Choisissez une boîte mystère pour révéler votre récompense XP !
            </Text>

            {/* Grille des récompenses */}
            <View style={styles.rewardGrid}>
              {rewards.map((reward, index) => {
                const isSelected = selectedReward?.id === reward.id;
                const rewardColor = getRewardColor(reward.value, theme);

                return (
                  <Animated.View
                    key={reward.id}
                    style={[
                      styles.rewardContainer,
                      {
                        transform: [{ scale: isClaimed && !isSelected ? 0.9 : pulseAnim }],
                        opacity: isClaimed && !isSelected ? 0.4 : 1,
                      }
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.rewardBox,
                        {
                          backgroundColor: isClaimed
                            ? (isSelected ? rewardColor : theme.card)
                            : theme.primary,
                          borderColor: isSelected ? '#FFD700' : 'transparent',
                          borderWidth: isSelected ? 2 : 0,
                          shadowColor: isSelected ? '#FFD700' : theme.primary,
                          shadowOffset: { width: 0, height: isSelected ? 6 : 4 },
                          shadowOpacity: isSelected ? 0.6 : 0.3,
                          shadowRadius: isSelected ? 15 : 8,
                          elevation: isSelected ? 15 : 8,
                        }
                      ]}
                      onPress={() => handleClaimReward(reward)}
                      disabled={isClaimed}
                      activeOpacity={0.7}
                    >
                      {isClaimed && isSelected ? (
                        <View style={styles.rewardRevealed}>
                          <MaterialCommunityIcons
                            name={reward.icon as any || 'gift'}
                            size={12}
                            color="#FFFFFF"
                          />
                          <Text style={styles.rewardValue}>
                            {reward.label}
                          </Text>
                          {reward.value > 100 && (
                            <View style={styles.starBadge}>
                              <Ionicons name="star" size={10} color="#FFD700" />
                            </View>
                          )}
                        </View>
                      ) : (
                        <View style={styles.rewardHidden}>
                          <MaterialCommunityIcons
                            name="cube-outline"
                            size={32}
                            color={theme.background}
                          />
                          <Text style={styles.questionMark}>?</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Indicateur de sélection */}
                    {isSelected && (
                      <MotiView
                        from={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={styles.selectionIndicator}
                      >
                        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                      </MotiView>
                    )}
                  </Animated.View>
                );
              })}
            </View>

            {/* Statut */}
            <View style={styles.statusContainer}>
              <MaterialCommunityIcons
                name={isClaimed ? "check-circle" : "information"}
                size={20}
                color={isClaimed ? theme.success : theme.secondary}
              />
              <Text style={[styles.statusText, { color: isClaimed ? theme.success : theme.secondary }]}>
                {isClaimed
                  ? `+${selectedReward?.value} XP ajoutés cliquer sur CONTINUER !`
                  : 'Cliquez sur une boîte pour révéler votre récompense'}
              </Text>
            </View>

            {/* Bouton de fermeture */}

            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500 }}
            >
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: isClaimed ? theme.accent : theme.secondary,
                    opacity: isClaimed ? 1 : 0.5
                  }
                ]}
                onPress={() => {
                  if (!isClaimed) return; // Ne rien faire si pas de récompense choisie

                  Animated.timing(scaleAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                  }).start(onClose);
                }}
                disabled={!isClaimed} // Désactivé si pas de récompense
              >
                <Text style={styles.closeButtonText}>
                  {isClaimed ? 'CONTINUER' : 'CHOISISSEZ UNE RÉCOMPENSE'}
                </Text>
                <MaterialCommunityIcons
                  name={isClaimed ? "arrow-right" : "alert-circle-outline"}
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </MotiView>

            {/* Note en bas */}
            <Text style={[styles.footerNote, { color: theme.text }]}>
              <Ionicons name="sparkles" size={12} color={theme.accent} />
              Les bonus apparaissent à chaque niveau multiple de 10
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 450,
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
    textAlign: 'center',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  centralIconContainer: {
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 5,
  },
  instructions: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 15,
  },
  rewardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 10,
    width: '100%',
  },
  rewardContainer: {
    position: 'relative',
    width: '30%',
    aspectRatio: 1,
    maxWidth: 60,
  },
  rewardBox: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  rewardHidden: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionMark: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  rewardRevealed: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  rewardValue: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 5,
    textAlign: 'center',
  },
  starBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  // closeButton: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   gap: 10,
  //   paddingHorizontal: 30,
  //   paddingVertical: 12,
  //   borderRadius: 25,
  //   marginBottom: 15,
  //   minWidth: 200,
  // },
  // closeButtonText: {
  //   color: '#FFFFFF',
  //   fontSize: 16,
  //   fontWeight: '700',
  //   letterSpacing: 1,
  // },

  closeButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  paddingHorizontal: 30,
  paddingVertical: 10,
  borderRadius: 25,
  marginBottom: 10,
  minWidth: 200,
},
closeButtonDisabled: {
  opacity: 0.5, // Visuellement désactivé
},
closeButtonText: {
  color: '#FFFFFF',
  fontSize: 12,
  fontWeight: '700',
  letterSpacing: 1,
},

  footerNote: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    fontStyle: 'italic',
  },
});

export default RandomRewardModal;