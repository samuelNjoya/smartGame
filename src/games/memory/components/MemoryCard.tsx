// src/games/memory/components/MemoryCard.tsx
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { MotiView } from 'moti'; // Pour l'animation de flip
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSettings } from '../../../hooks/useSettings';

type Props = {
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
  onPress: () => void;
  isDisabled: boolean;
};

const MemoryCard = ({ icon, isFlipped, isMatched, onPress, isDisabled }: Props) => {
  const { theme } = useSettings();

  return (
    <Pressable onPress={onPress} disabled={isDisabled || isFlipped || isMatched}>
      <MotiView
        style={[styles.card, { backgroundColor: isMatched ? theme.success : theme.card }]}
        animate={{ rotateY: isFlipped || isMatched ? '0deg' : '180deg' }}
        transition={{ type: 'timing', duration: 300 }}>
        
        {/* Face avant (cachée) */}
        <MotiView
          style={[styles.face, styles.frontFace, { backgroundColor: theme.primary }]}
          animate={{ rotateY: isFlipped || isMatched ? '-180deg' : '0deg' }}
          transition={{ type: 'timing', duration: 300 }}>
          <MaterialCommunityIcons name="help" size={40} color={theme.card} />
        </MotiView>
        
        {/* Face arrière (visible) */}
        <MotiView
          style={[styles.face, styles.backFace]}
          animate={{ rotateY: isFlipped || isMatched ? '0deg' : '180deg' }}
          transition={{ type: 'timing', duration: 300 }}>
          <MaterialCommunityIcons name={icon as any} size={40} color={isMatched ? theme.card : theme.primary} />
        </MotiView>
        
      </MotiView>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 75,
    height: 100,
    margin: 5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden', // Requis pour le flip
  },
  face: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backfaceVisibility: 'hidden',
  },
  frontFace: {},
  backFace: {
    transform: [{ rotateY: '180deg' }], // Commence retourné
  },
});

export default MemoryCard;