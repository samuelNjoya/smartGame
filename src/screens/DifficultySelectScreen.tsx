// src/screens/DifficultySelectScreen.tsx

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Dimensions,
  Animated
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameStackParamList } from '../navigation/types';
import { useSettings } from '../hooks/useSettings';
import { GameDifficulty, MAX_LEVELS } from '../constants/gameData';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<GameStackParamList, 'DifficultySelect'>;

const { width } = Dimensions.get('window');

// Palette de couleurs professionnelle
const PROFESSIONAL_COLORS = {
  primary: '#4361EE',    // Bleu professionnel
  secondary: '#3A0CA3',  // Violet foncé
  accent: '#4CC9F0',     // Cyan
  success: '#4CAF50',    // Vert
  warning: '#FF9800',    // Orange
  danger: '#F72585',     // Rose
  background: '#F8F9FA', // Gris très clair
  card: '#FFFFFF',       // Blanc
  text: '#2D3748',       // Gris foncé
  textLight: '#718096',  // Gris moyen
};

const difficulties: { 
  key: GameDifficulty; 
  label: string; 
  color: string;
  gradient: string[];
  icon: string;
  description: string;
}[] = [
  { 
    key: 'easy', 
    label: 'Facile', 
    color: PROFESSIONAL_COLORS.success,
    gradient: ['#4CAF50', '#66BB6A'],
    icon: 'leaf',
    description: 'Parfait pour débuter'
  },
  { 
    key: 'medium', 
    label: 'Moyen', 
    color: PROFESSIONAL_COLORS.warning,
    gradient: ['#FF9800', '#FFB74D'],
    icon: 'gauge',
    description: 'Un bon équilibre'
  },
  { 
    key: 'hard', 
    label: 'Difficile', 
    color: PROFESSIONAL_COLORS.danger,
    gradient: ['#F72585', '#F06292'],
    icon: 'fire',
    description: 'Pour les experts'
  },
];

const DifficultySelectScreen = ({ route, navigation }: Props) => {
  const { theme } = useSettings();
  const { gameId, gameName } = route.params;
  
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSelectDifficulty = (difficulty: GameDifficulty) => {
    navigation.navigate('LevelSelect', {
      gameId,
      gameName,
      difficulty,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: PROFESSIONAL_COLORS.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* En-tête avec icône */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.iconContainer}>
            <Icon name="chess-queen" size={40} color={PROFESSIONAL_COLORS.primary} />
          </View>
          <Text style={styles.title}>
            {gameName}
          </Text>
          <Text style={styles.subtitle}>
            Choisissez votre niveau de défi
          </Text>
        </Animated.View>

        {/* Cartes de difficulté */}
        <View style={styles.difficultiesContainer}>
          {difficulties.map((d, index) => (
            <Animated.View
              key={d.key}
              style={[
                styles.difficultyCardWrapper,
                {
                  opacity: fadeAnim,
                  transform: [
                    { 
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 50],
                        outputRange: [0, 30 * index],
                      })
                    }
                  ]
                }
              ]}
            >
              <TouchableOpacity
                style={styles.difficultyCard}
                onPress={() => handleSelectDifficulty(d.key)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={d.gradient}
                  style={styles.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* Icône de difficulté */}
                  <View style={styles.difficultyIconContainer}>
                    <Icon name={d.icon} size={32} color="#FFFFFF" />
                  </View>

                  {/* Contenu texte */}
                  <View style={styles.difficultyContent}>
                    <Text style={styles.difficultyLabel}>{d.label}</Text>
                    <Text style={styles.difficultyDescription}>
                      {d.description}
                    </Text>
                  </View>

                  {/* Nombre de niveaux */}
                  <View style={styles.levelInfo}>
                    <View style={styles.levelCountContainer}>
                      <Icon name="format-list-numbered" size={16} color="#FFFFFF" />
                      <Text style={styles.levelCountText}>
                        {MAX_LEVELS[d.key]} niveaux
                      </Text>
                    </View>
                    <Icon 
                      name="chevron-right" 
                      size={24} 
                      color="#FFFFFF" 
                      style={styles.chevron}
                    />
                  </View>

                  {/* Badge de difficulté */}
                  <View style={[styles.difficultyBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Text style={styles.badgeText}>
                      {index + 1}/3
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Section d'information */}
        <Animated.View 
          style={[
            styles.infoSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.infoCard}>
            <Icon name="information-outline" size={24} color={PROFESSIONAL_COLORS.primary} />
            <Text style={styles.infoText}>
              Chaque difficulté propose des défis uniques et adaptés à votre niveau
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 50,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: PROFESSIONAL_COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: PROFESSIONAL_COLORS.textLight,
    textAlign: 'center',
  },
  difficultiesContainer: {
    marginBottom: 30,
  },
  difficultyCardWrapper: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  difficultyCard: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 120,
  },
  gradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  difficultyIconContainer: {
    marginRight: 15,
  },
  difficultyContent: {
    flex: 1,
  },
  difficultyLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  difficultyDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 10,
  },
  levelCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  chevron: {
    opacity: 0.8,
  },
  difficultyBadge: {
    position: 'absolute',
    top: 15,
    right: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoSection: {
    marginTop: 10,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: PROFESSIONAL_COLORS.textLight,
    lineHeight: 20,
  },
});

export default DifficultySelectScreen;