import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
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
    <Pressable
      onPress={onPress}
      disabled={isDisabled || isFlipped || isMatched}
      style={{ opacity: isDisabled ? 0.5 : 1 }} // Ajout d'un indicateur visuel pour l'état désactivé
    >
      <MotiView
        style={[
          styles.card,
          {
            backgroundColor: isMatched ? theme.success : theme.card,
            borderColor: isDisabled ? theme.secondary : 'transparent',
            borderWidth: isDisabled ? 1 : 0,
          }
        ]}
        animate={{ rotateY: isFlipped || isMatched ? '0deg' : '180deg' }}
        transition={{ type: 'timing', duration: 250 }} // Durée légèrement réduite
      >
        {/* Face avant (cachée) */}
        <MotiView
          style={[
            styles.face,
            styles.frontFace,
            { backgroundColor: theme.primary }
          ]}
          animate={{ rotateY: isFlipped || isMatched ? '-180deg' : '0deg' }}
          transition={{ type: 'timing', duration: 250 }}
        >
          <MaterialCommunityIcons
            name="help"
            size={40}
            color={theme.card} // Assurez-vous que theme.card a un bon contraste avec theme.primary
          />
        </MotiView>

        {/* Face arrière (visible) */}
        <MotiView
          style={[styles.face, styles.backFace]}
          animate={{ rotateY: isFlipped || isMatched ? '0deg' : '180deg' }}
          transition={{ type: 'timing', duration: 250 }}
        >
          <MaterialCommunityIcons
            name={icon as any}
            size={40}
            color={isMatched ? theme.card : theme.primary} // Amélioration du contraste
          />
        </MotiView>
      </MotiView>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  // card: {
  //   width: 75,
  //   height: 100,
  //   margin: 5,
  //   borderRadius: 8,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   backfaceVisibility: 'hidden',
  //   shadowColor: '#000',
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.1,
  //   shadowRadius: 4,
  //   elevation: 2, // Ajout d'une légère ombre pour mieux distinguer les cartes
  // },
  card: {
    width: 70, // 👈 taille fixe
    height: 70,
    margin: 4,
    borderWidth: 1, // 👈 visible
    borderColor: '#aaa',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
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
    transform: [{ rotateY: '180deg' }],
  },
});

export default MemoryCard;