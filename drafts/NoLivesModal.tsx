// src/components/layout/NoLivesModal.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  Animated,
 // Easing
} from 'react-native';
import { Easing } from 'react-native-reanimated'
import { useSettings } from '../../hooks/useSettings';
import { usePlayer } from '../../hooks/usePlayer';
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  visible: boolean;
  onClose: () => void;
};

// Fonction pour formater le temps
const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const NoLivesModal = ({ visible, onClose }: Props) => {
  const { theme } = useSettings();
  const { lives, regenJobs, rechargeLivesWithGame, rechargeLivesWithXP, isRecharging, xp } = usePlayer();
  const [timeLeft, setTimeLeft] = useState('00:00');
  const [scaleAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [heartsAnim] = useState(new Animated.Value(0));

  // Animation des cœurs qui tombent
  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Animation de pulsation du timer
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Animation des cœurs
      Animated.timing(heartsAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
      heartsAnim.setValue(0);
    }
  }, [visible]);

  useEffect(() => {
    if (visible && regenJobs.length > 0) {
      const firstJob = regenJobs[0];
      const updateTimer = () => {
        const remaining = firstJob.endTime - Date.now();
        if (remaining <= 0) {
          setTimeLeft('00:00');
          onClose();
        } else {
          setTimeLeft(formatTime(remaining));
        }
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [visible, regenJobs, onClose]);
  
  const canRecharge = lives < 5;
  const hasEnoughXP = xp >= 450;
  const remainingLives = 5 - lives;

  const handleRechargeWithXP = async () => {
    if (!hasEnoughXP) {
      // Feedback pour XP insuffisant
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    rechargeLivesWithXP();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        {/* Cœurs qui tombent en arrière-plan */}
        <Animated.View 
          style={[
            styles.heartsBackground,
            {
              opacity: heartsAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.3]
              })
            }
          ]}
        >
          {[...Array(8)].map((_, i) => (
            <MotiView
              key={i}
              from={{ translateY: -100, opacity: 0 }}
              animate={{ translateY: 800, opacity: 1 }}
              transition={{ 
                type: 'timing', 
                duration: 2000 + i * 200,
                delay: i * 100,
                loop: true 
              }}
              style={styles.fallingHeart}
            >
              <MaterialCommunityIcons 
                name="heart" 
                size={24} 
                color={theme.error} 
                style={{ opacity: 0.7 }}
              />
            </MotiView>
          ))}
        </Animated.View>

        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              backgroundColor: theme.card,
              shadowColor: theme.error,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
              elevation: 20,
            }
          ]}
        >

          <View style={styles.content}>
            {/* Icône centrale */}
            <View style={styles.heartContainer}>
              <MaterialCommunityIcons 
                name="heart-off" 
                size={80} 
                color={theme.error} 
                style={styles.mainHeart}
              />
            </View>

            {/* Message principal */}
            <Text style={[styles.message, { color: theme.text }]}>
              ❌ Oups ! Vous avez utilisé toutes vos vies.
            </Text>
            
            <Text style={[styles.description, { color: theme.text }]}>
              Attendez que vos vies se rechargent automatiquement ou rechargez-les instantanément.
            </Text>

            {/* Timer avec animation */}
            <Animated.View 
              style={[
                styles.timerContainer,
                {
                  transform: [{ scale: pulseAnim }],
                  backgroundColor: theme.background,
                  borderColor: theme.primary,
                }
              ]}
            >
              <View style={styles.timerHeader}>
                <MaterialCommunityIcons name="clock-outline" size={20} color={theme.primary} />
                <Text style={[styles.timerLabel, { color: theme.text }]}>
                  Prochaine vie dans
                </Text>
              </View>
              
              <Text style={[styles.timer, { color: theme.primary }]}>
                {timeLeft}
              </Text>
              
              <View style={styles.progressBar}>
                <MotiView
                  from={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ 
                    type: 'timing', 
                    duration: regenJobs[0] ? regenJobs[0].endTime - Date.now() : 300000,
                    easing: Easing.linear 
                  }}
                  style={[styles.progressFill, { backgroundColor: theme.primary }]}
                />
              </View>
            </Animated.View>

            {/* Section recharge */}
            <View style={styles.rechargeSection}>
              <Text style={[styles.rechargeTitle, { color: theme.text }]}>
                ⚡ Recharge instantanée
              </Text>
              
              {/* Option 1: Recharge complète avec XP */}
              <TouchableOpacity
                style={[
                  styles.rechargeOption,
                  { 
                    backgroundColor: hasEnoughXP ? theme.success + '20' : theme.error + '20',
                    borderColor: hasEnoughXP ? theme.success : theme.error,
                  }
                ]}
                onPress={handleRechargeWithXP}
                disabled={!hasEnoughXP}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionIcon}>
                    <MaterialCommunityIcons 
                      name="lightning-bolt" 
                      size={24} 
                      color={hasEnoughXP ? theme.success : theme.error} 
                    />
                  </View>
                  
                  <View style={styles.optionTexts}>
                    <Text style={[styles.optionTitle, { color: theme.text }]}>
                      Recharge complète
                    </Text>
                    <Text style={[styles.optionSubtitle, { color: theme.text }]}>
                      {remainingLives} vie{remainingLives > 1 ? 's' : ''} restante{remainingLives > 1 ? 's' : ''}
                    </Text>
                  </View>
                  
                  <View style={styles.optionPrice}>
                    <MaterialCommunityIcons name="star" size={18} color="#FFD700" />
                    <Text style={[
                      styles.priceText, 
                      { color: hasEnoughXP ? '#FFD700' : theme.error }
                    ]}>
                      {hasEnoughXP ? '450 XP' : 'XP insuffisant'}
                    </Text>
                  </View>
                </View>
                
                {!hasEnoughXP && (
                  <Text style={[styles.insufficientText, { color: theme.error }]}>
                    Vous avez {xp} XP (il en faut 450)
                  </Text>
                )}
              </TouchableOpacity>

              {/* Option 2: Attendre (gratuit) */}
              <TouchableOpacity
                style={[
                  styles.waitOption,
                  { 
                    backgroundColor: theme.primary + '10',
                    borderColor: theme.primary,
                  }
                ]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionIcon}>
                    <MaterialCommunityIcons 
                      name="clock" 
                      size={24} 
                      color={theme.primary} 
                    />
                  </View>
                  
                  <View style={styles.optionTexts}>
                    <Text style={[styles.optionTitle, { color: theme.text }]}>
                      Attendre gratuitement
                    </Text>
                    <Text style={[styles.optionSubtitle, { color: theme.text }]}>
                      Vos vies se rechargent automatiquement
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Bouton fermer */}
            <TouchableOpacity
              style={[styles.closeButton, { borderColor: theme.secondary }]}
              onPress={onClose}
              activeOpacity={0.6}
            >
              <Text style={[styles.closeButtonText, { color: theme.secondary }]}>
                Revenir plus tard
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  heartsBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  fallingHeart: {
    position: 'absolute',
    left: `${Math.random() * 100}%`,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 450,
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 1,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  content: {
    padding: 25,
    alignItems: 'center',
  },
  heartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mainHeart: {
    marginBottom: 5,
  },
  message: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  timerContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  timer: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 15,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  rechargeSection: {
    width: '100%',
    marginBottom: 20,
  },
  rechargeTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
  },
  rechargeOption: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 15,
    marginBottom: 12,
  },
  waitOption: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 15,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: 15,
  },
  optionTexts: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 12,
  },
  optionPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
  },
  insufficientText: {
    fontSize: 11,
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  closeButton: {
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 12,
    marginBottom: 15,
    minWidth: 200,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default NoLivesModal;