// src/screens/LevelSelectScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameStackParamList } from '../navigation/types';
import { useSettings } from '../hooks/useSettings';
import { usePlayer } from '../hooks/usePlayer';
import { MAX_LEVELS } from '../constants/gameData';
import ProgressionService from '../services/ProgressionService'; // NOUVEL IMPORT
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NoLivesModal from '../components/layout/NoLivesModal'; // NOUVEL IMPORT

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


// --- Écran Principal ---
const LevelSelectScreen = ({ route, navigation }: Props) => {
  const { theme } = useSettings();
  const { lives, spendLife } = usePlayer();
  const { gameId, gameName, difficulty } = route.params;
  
  const [lastCompletedLevel, setLastCompletedLevel] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  
  const maxLevels = MAX_LEVELS[difficulty];
  const levelsArray = Array.from({ length: maxLevels }, (_, i) => i + 1);

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
      Alert.alert("Niveau Verrouillé", `Vous devez compléter le niveau ${level - 1} avant de pouvoir jouer à celui-ci.`);
      return;
    }
    
    // Vérification des vies
    if (lives <= 0) {
      setModalVisible(true);
      return;
    }
    
    // Lancement du jeu
    Alert.alert("Lancement du niveau", `Niveau ${level} de ${gameName} en mode ${difficulty}. Une vie a été dépensée.`, [
      { 
        text: "Jouer", 
        onPress: () => {
          spendLife(); // Dépense la vie avant de naviguer
          // Navigue vers l'écran de jeu correspondant
          // @ts-ignore
          navigation.navigate(gameId, { difficulty, level });
        }
      },
      {
        text: "Annuler",
        style: 'cancel'
      }
    ]);
  };


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
    if (difficulty === 'easy') return 'Facile (1-100)';
    if (difficulty === 'medium') return 'Moyen (1-75)';
    return 'Difficile (1-50)';
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        {gameName} - {getDifficultyTitle()}
      </Text>
      
      <Text style={[styles.info, { color: theme.secondary }]}>
        Déverrouillé jusqu'au niveau {lastCompletedLevel + 1}
      </Text>
      
      <FlatList
        data={levelsArray}
        keyExtractor={(item) => item.toString()}
        renderItem={renderLevel}
        numColumns={4} // 4 niveaux par ligne
        contentContainerStyle={styles.listContainer}
      />
      
      {/* Modal pour quand l'utilisateur n'a plus de vies */}
      <NoLivesModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  info: {
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 10,
  },
  levelCard: {
    flex: 1,
    aspectRatio: 1, // Assure que la carte est carrée
    margin: 5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
  lockedCard: {
    backgroundColor: '#333',
  },
  bonusCard: {
    borderColor: 'orange', // Pour les multiples de 5
  },
  superBonusCard: {
    borderColor: '#FFD700', // Pour les multiples de 10
  },
  levelText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bonusIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
});

export default LevelSelectScreen;