// src/screens/LevelSelectScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameStackParamList } from '../../navigation/types';
import { useSettings } from '../../hooks/useSettings';
import { usePlayer } from '../../hooks/usePlayer';
import { MAX_LEVELS } from '../../constants/gameData';
import ProgressionService from '../../services/ProgressionService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NoLivesModal from '../../components/layout/NoLivesModal';
import CustomAlert from '../../components/CustomAlert';

type Props = NativeStackScreenProps<GameStackParamList, 'LevelSelect'>;

// --- Composant d'un seul niveau (réutilisable) ---
const LevelItem = ({
  level,
  isUnlocked,
  isCompleted,
  isMultipleOf5,
  isMultipleOf10,
  theme,
  onPress,
}: any) => {

  // Style de base du niveau
  let cardStyle: any = [styles.levelCard, { backgroundColor: theme.card }];
  let iconName: string = isCompleted ? "check-circle" : "numeric";
  let textColor = theme.text;
  let iconColor = theme.primary;

  if (!isUnlocked) {
    // Verrouillé
    cardStyle.push(styles.lockedCard, { backgroundColor: theme.card, opacity: 0.5 });
    iconName = "lock";
    iconColor = theme.textSecondary;
  } else if (isMultipleOf10) {
    // Multiple de 10 (Double XP + Aléatoire)
    cardStyle.push(styles.superBonusCard, { borderColor: '#FFD700', borderWidth: 3 });
    iconColor = '#FFD700'; // Or
    textColor = '#FFD700';
  } else if (isMultipleOf5) {
    // Multiple de 5 (Double XP)
    cardStyle.push(styles.bonusCard, { borderColor: theme.primary, borderWidth: 2 });
  }

  return (
    <TouchableOpacity
      style={cardStyle}
      onPress={() => onPress(level, isUnlocked)}
      disabled={!isUnlocked}
    >
      <MaterialCommunityIcons name={iconName as any} size={20} color={iconColor} />
      <Text style={[styles.levelText, { color: textColor }]}>
        {level}
      </Text>
      {(isMultipleOf5 || isMultipleOf10) && (
        <MaterialCommunityIcons
          name={isMultipleOf10 ? "star-circle" : "medal"}
          size={12}
          color={isMultipleOf10 ? '#FFD700' : theme.primary}
          style={styles.bonusIcon}
        />
      )}
    </TouchableOpacity>
  );
};

// --- Composant Barre de Progression Animée ---
const ProgressBar = ({ progress, theme }: { progress: number, theme: any }) => {
  const [animatedProgress] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const widthInterpolate = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={[styles.progressText, { color: theme.text }]}>
          Progression globale
        </Text>
        <Text style={[styles.progressPercent, { color: theme.primary }]}>
          {Math.round(progress)}%
        </Text>
      </View>
      <View style={[styles.progressBarBackground, { backgroundColor: theme.card }]}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              backgroundColor: theme.primary,
              width: widthInterpolate
            }
          ]}
        />
      </View>
    </View>
  );
};

// --- Composant Indicateur de Vies ---
const LivesIndicator = ({ lives, maxLives = 5, theme }: { lives: number, maxLives?: number, theme: any }) => {

  // AJOUT : Accès à regenJobs pour le timer
  const { regenJobs } = usePlayer();
  const [timeLeft, setTimeLeft] = useState('00:00');  // AJOUT : State timer

  // AJOUT : formatTime (réutilisé du modal/HomeScreen)
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // AJOUT : useEffect pour le timer live
  useEffect(() => {
    if (regenJobs.length > 0) {
      const firstJob = regenJobs[0];
      const updateTimer = () => {
        const remaining = firstJob.endTime - Date.now();
        if (remaining <= 0) {
          setTimeLeft('00:00');
          // Optionnel : Trigger recharge via usePlayer si besoin
        } else {
          setTimeLeft(formatTime(remaining));
        }
      };

      updateTimer();  // Update immédiat
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);  // Cleanup pro !
    } else {
      setTimeLeft('00:00');  // Reset si pas de job
    }
  }, [regenJobs]);  // Dépendance : Re-run si jobs changent

  // AJOUT : Condition pour afficher le timer
  const showTimer = timeLeft !== '00:00';

  return (
    <View style={styles.livesContainer}>
      <Text style={[styles.livesText, { color: theme.text }]}>
        Vies disponibles:
      </Text>
      <View style={styles.heartsContainer}>
        {Array.from({ length: maxLives }, (_, index) => (
          <MaterialCommunityIcons
            key={index}
            name={index < lives ? "heart" : "heart-outline"}
            size={24}
            color={index < lives ? "#FF6B6B" : theme.textSecondary}
            style={styles.heartIcon}
          />
        ))}
      </View>
      <Text style={[styles.livesCount, { color: theme.primary }]}>
        {lives}/{maxLives}
      </Text>

      {/* AJOUT : Timer sous les cœurs */}
      {showTimer && (
        <Text style={[styles.timerText, { color: theme.primary }]}>
          Prochaine vie : {timeLeft}
        </Text>
      )}
    </View>
  );
};

// --- Composant Légende des Bonus ---
const BonusLegend = ({ theme }: { theme: any }) => {
  return (
    <View style={[styles.legendContainer, { backgroundColor: theme.card }]}>
      <Text style={[styles.legendTitle, { color: theme.text }]}>
        🎯 Légende des Super Bonus
      </Text>
      <View style={styles.legendItems}>
        <View style={styles.legendItem}>
          <MaterialCommunityIcons name="medal" size={16} color={theme.primary} />
          <Text style={[styles.legendText, { color: theme.text }]}>
            Niveau 5/10/15/20...: Double XP
          </Text>
        </View>
        <View style={styles.legendItem}>
          <MaterialCommunityIcons name="star-circle" size={16} color="#FFD700" />
          <Text style={[styles.legendText, { color: theme.text }]}>
            Niveau 10/20/30/40...: Double XP + Bonus Aléatoire
          </Text>
        </View>
        <View style={styles.legendItem}>
          <MaterialCommunityIcons name="lock" size={16} color={theme.textSecondary} />
          <Text style={[styles.legendText, { color: theme.text }]}>
            Niveau verrouillé
          </Text>
        </View>
        <View style={styles.legendItem}>
          <MaterialCommunityIcons name="check-circle" size={16} color={theme.primary} />
          <Text style={[styles.legendText, { color: theme.text }]}>
            Niveau complété
          </Text>
        </View>
      </View>
    </View>
  );
};

// --- Écran Principal ---
const LevelSelectScreen = ({ route, navigation }: Props) => {
  const { theme } = useSettings();
  const { lives, spendLife } = usePlayer();
  const { gameId, gameName, difficulty } = route.params;

  const [lastCompletedLevel, setLastCompletedLevel] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);

  // États pour gérer les CustomAlert
  const [lockedAlertVisible, setLockedAlertVisible] = useState(false);
  const [startAlertVisible, setStartAlertVisible] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  const maxLevels = MAX_LEVELS[difficulty];
  const levelsArray = Array.from({ length: maxLevels }, (_, i) => i + 1);

  // Calcul de la progression globale en pourcentage
  const progressPercentage = (lastCompletedLevel / maxLevels) * 100;

  // Charger la progression au montage
  useEffect(() => {
    const loadProgress = async () => {
      const completed = await ProgressionService.getLastCompletedLevel(gameId as any, difficulty);
      setLastCompletedLevel(completed);
    };
    loadProgress();

    // Ajouter un listener de focus pour recharger la progression si l'utilisateur
    // revient après avoir terminé un niveau
    const unsubscribe = navigation.addListener('focus', loadProgress);
    return unsubscribe;

  }, [gameId, difficulty, navigation]);




  const handleLevelPress = (level: number, isUnlocked: boolean) => {
    if (!isUnlocked) {
      // Affiche l'alerte de niveau verrouillé
      setLockedAlertVisible(true);
      return;
    }

    // Vérification des vies
    if (lives <= 0) {
      setModalVisible(true);
      return;
    }

    // Sauvegarde le niveau sélectionné et affiche l'alerte de confirmation
    setSelectedLevel(level);
    setStartAlertVisible(true);
  };

  const handleStartGame = () => {
    if (selectedLevel) {
      spendLife(); // Dépense la vie avant de naviguer
      // Navigue vers l'écran de jeu correspondant
      // @ts-ignore
      navigation.navigate(gameId, { difficulty, level: selectedLevel });
    }
  };

  // Configuration des boutons pour l'alerte de confirmation
   type AlertButton = { text: string; onPress: () => void; style?: string; textColor?: string };  //type alert button
  const startGameButtons: AlertButton[] = [
    {
      text: "Annuler",
      onPress: () => setStartAlertVisible(false),
      style: 'cancel'
    },
    {
      text: "Jouer",
      onPress: handleStartGame,
      textColor: '#4361EE'
    }
  ];

  const renderLevel = ({ item: level }: { item: number }) => {
    const isCompleted = level <= lastCompletedLevel;
    // Le niveau est déverrouillé s'il est le niveau suivant le dernier complété (lastCompletedLevel + 1)
    // OU s'il a déjà été complété (rejouabilité)
    const isUnlocked = level <= lastCompletedLevel + 1;

    return (
      <LevelItem
        level={level}
        isUnlocked={isUnlocked}
        isCompleted={isCompleted}
        isMultipleOf5={level % 5 === 0}
        isMultipleOf10={level % 10 === 0}
        theme={theme}
        onPress={handleLevelPress}
      />
    );
  };

  const getDifficultyTitle = () => {
    if (difficulty === 'easy') return 'Facile (1-250)';
    if (difficulty === 'medium') return 'Moyen (1-200)';
    if (difficulty === 'hard') return 'Difficile (1-150)';
    return 'Maitre (1-100)';
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      {/* En-tête avec titre et indicateur de vies */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.text }]}>
            {gameName}
          </Text>
          <Text style={[styles.difficulty, { color: theme.secondary }]}>
            {getDifficultyTitle()}
          </Text>
        </View>

        {/* Indicateur de vies */}
        <LivesIndicator lives={lives} theme={theme} />
      </View>

      {/* Barre de progression animée */}
      <ProgressBar progress={progressPercentage} theme={theme} />

      <Text style={[styles.info, { color: theme.secondary }]}>
        Déverrouillé jusqu'au niveau {lastCompletedLevel + 1} / {maxLevels}
      </Text>
      {/* Grille des niveaux */}
      <FlatList
        data={levelsArray}
        keyExtractor={(item) => item.toString()}
        renderItem={renderLevel}
        numColumns={4} // 4 niveaux par ligne
        contentContainerStyle={styles.listContainer}
      />

      {/* Légende explicative des bonus */}
      <BonusLegend theme={theme} />

      {/* Modal pour quand l'utilisateur n'a plus de vies */}
      <NoLivesModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />

      {/* 🔥 NOUVEAU : Alerte pour niveau verrouillé */}
      <CustomAlert
        visible={lockedAlertVisible}
        title="Niveau Verrouillé 🔒"
        message={`Vous devez compléter le niveau ${selectedLevel ? selectedLevel - 1 : 'précédent'} avant de pouvoir jouer à celui-ci.`}
        type="warning"
        buttons={[
          {
            text: "Compris",
            onPress: () => setLockedAlertVisible(false),
            textColor: '#FF9800'
          }
        ]}
        onClose={() => setLockedAlertVisible(false)}
      />

      {/* 🔥 NOUVEAU : Alerte de confirmation de lancement */}
      <CustomAlert
        visible={startAlertVisible}
        title="Lancement du Niveau 🚀"
        message={`Niveau ${selectedLevel} de ${gameName} en mode ${difficulty}.\n\nUne vie sera dépensée.`}
        type="info"
        buttons={startGameButtons}
        onClose={() => setStartAlertVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  difficulty: {
    fontSize: 14,
    fontWeight: '500',
  },
  info: {
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  levelCard: {
    flex: 1,
    aspectRatio: 1,
    margin: 5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    position: 'relative',
  },
  lockedCard: {
    backgroundColor: '#333',
  },
  bonusCard: {
    borderColor: 'orange',
  },
  superBonusCard: {
    borderColor: '#FFD700',
  },
  levelText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  bonusIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  // Styles pour la barre de progression
  progressContainer: {
    marginBottom: 15,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  // Styles pour l'indicateur de vies
  livesContainer: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  livesText: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'right',
  },
  heartsContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  heartIcon: {
    marginHorizontal: 1,
  },
  livesCount: {
    fontSize: 12,
    fontWeight: 'bold',
  },
    // AJOUT : Style pour le timer (discret, aligné à droite)
  timerText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'right',
  },
  // Styles pour la légende des bonus
  legendContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    marginHorizontal: 10,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  legendItems: {
    flexDirection: 'column',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
});

export default LevelSelectScreen;