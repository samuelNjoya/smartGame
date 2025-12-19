// src/screens/GameListScreen.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
  ImageBackground,
  Platform,
} from 'react-native';
import { useSettings } from '../hooks/useSettings';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameStackParamList } from '../navigation/types';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { GAMES } from '../constants/gameData';
import { LinearGradient } from 'expo-linear-gradient';
//import { BlurView } from 'expo-blur';

type Props = NativeStackScreenProps<GameStackParamList, 'GameList'>;

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.44;
const CARD_HEIGHT = CARD_WIDTH * 1.2;

// Catégories pour organiser les jeux
const GAME_CATEGORIES = [
  { id: 'all', name: 'Tous les jeux', icon: 'apps' },
  { id: 'math', name: 'Mathématiques', icon: 'calculator' },
  { id: 'word', name: 'Mots & Lettres', icon: 'alphabetical' },
  { id: 'puzzle', name: 'Réflexion', icon: 'puzzle' },
  { id: 'fast', name: 'Action Rapide', icon: 'lightning-bolt' },
];

const GameListScreen = ({ navigation }: Props) => {
  const { theme, isDark } = useSettings();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const scrollY = useRef(new Animated.Value(0)).current;

  // Animation de parallax pour l'en-tête
const headerScaleY = scrollY.interpolate({
  inputRange: [0, 100],
  outputRange: [1, 0.54], // 0.15/0.28 ≈ 0.54
  extrapolate: 'clamp',
});

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0.7],
    extrapolate: 'clamp',
  });

  // Filtrer les jeux par catégorie
  const filteredGames = GAMES.filter(game => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'math') return game.id.includes('Math');
    if (selectedCategory === 'word') return game.id.includes('Word');
    if (selectedCategory === 'puzzle') return game.id.includes('Memory') || game.id.includes('Neuro');
    if (selectedCategory === 'fast') return game.timeBased;
    return true;
  });

  const GameCard = ({ game, index }: { game: any; index: number }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    const handlePress = () => {
      // Petite rotation au clic
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        navigation.navigate('DifficultySelect', {
          gameId: game.id,
          gameName: game.name,
        });
      }, 300);
    };

    const rotate = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '10deg'],
    });

    // Couleurs de gradient en fonction du jeu
    const getGameGradient = () => {
      const gradients = [
        ['#667eea', '#764ba2'], // Violet
        ['#f093fb', '#f5576c'], // Rose-Rouge
        ['#4facfe', '#00f2fe'], // Bleu
        ['#43e97b', '#38f9d7'], // Vert
        ['#fa709a', '#fee140'], // Orange-Rose
        ['#30cfd0', '#330867'], // Bleu-Violet
      ];
      return gradients[index % gradients.length];
    };

    return (
      <Animated.View
        style={[
          styles.gameCardContainer,
          {
            transform: [{ scale: scaleAnim }, { rotate }],
            opacity: scrollY.interpolate({
              inputRange: [0, 100, 200],
              outputRange: [1, 0.9, 0.8],
              extrapolate: 'clamp',
            }),
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          style={styles.gameCardTouchable}
        >
          <LinearGradient
            colors={getGameGradient()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gameCard}
          >
            {/* Effet de brillance animé */}
            <Animated.View
              style={[
                styles.cardShine,
                {
                  transform: [
                    {
                      translateX: scrollY.interpolate({
                        inputRange: [0, 1000],
                        outputRange: [-200, 200],
                      }),
                    },
                  ],
                },
              ]}
            />

            {/* Icone principale */}
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name={game.icon}
                size={CARD_WIDTH * 0.3}
                color="#FFFFFF"
                style={styles.gameIcon}
              />
            </View>

            {/* Badge de difficulté */}
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>
                {game.difficulty === 'hard' ? '🔥' : '⭐'} {game.name || 'VARIABLE'}
              </Text>
            </View>

            {/* Nom du jeu */}
            <Text style={styles.gameTitle} numberOfLines={2}>
              {game.name}
            </Text>

            {/* Description courte */}
            <Text style={styles.gameDescription} numberOfLines={2}>
              {game.description || 'Testez vos compétences'}
            </Text>

            {/* Stats rapides */}
            <View style={styles.cardStats}>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={14} color="#FFFFFF" />
                <Text style={styles.statText}>{game.timeLimit || '∞'}s</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="trophy-outline" size={14} color="#FFFFFF" />
                <Text style={styles.statText}>{game.maxLevel || '700'} lvls</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const CategoryButton = ({ category }: { category: any }) => {
    const isActive = selectedCategory === category.id;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePress = () => {
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
      ]).start();
      setSelectedCategory(category.id);
    };

    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <Animated.View
          style={[
            styles.categoryButton,
            {
              backgroundColor: isActive ? theme.primary : 'transparent',
              borderColor: isActive ? theme.primary : theme.secondary,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <MaterialCommunityIcons
            name={category.icon}
            size={20}
            color={isActive ? '#FFFFFF' : theme.text}
          />
          <Text
            style={[
              styles.categoryText,
              { color: isActive ? '#FFFFFF' : theme.text },
            ]}
          >
            {category.name}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header animé avec gradient */}
      <Animated.View
        style={[
          styles.header,
          {
            height: height * 0.2, // Hauteur fixe
            opacity: headerOpacity,
          },
        ]}
      >
        <LinearGradient
          colors={isDark ? ['#0f0c29', '#302b63', '#24243e'] : ['#667eea', '#764ba2', '#667eea']}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Pattern de fond */}
        <View style={styles.headerPattern}>
          {[...Array(20)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.patternDot,
                {
                  backgroundColor: `rgba(255,255,255,${0.1 + Math.random() * 0.2})`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Text style={styles.welcomeText}>BIENVENUE</Text>
            <TouchableOpacity style={styles.profileButton}>
              <MaterialCommunityIcons name="account" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.mainTitle}>ARCADE DE JEUX</Text>
          <Text style={styles.subtitle}>Sélectionnez votre aventure</Text>
        </View>
      </Animated.View>

      {/* Contenu principal avec FlatList */}
      <Animated.FlatList
        data={filteredGames}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <GameCard game={item} index={index} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Barre de catégories */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            >
              {GAME_CATEGORIES.map((category) => (
                <CategoryButton key={category.id} category={category} />
              ))}
            </ScrollView>

            {/* Titre des jeux */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Jeux Disponibles ({filteredGames.length})
              </Text>
            </View>
          </>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <MaterialCommunityIcons
              name="gamepad-variant"
              size={40}
              color={theme.secondary}
            />
            <Text style={[styles.footerText, { color: theme.secondary }]}>
              Plus de jeux bientôt disponibles !
            </Text>
          </View>
        }
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    width: '100%',
    paddingHorizontal: 20,
  //  paddingTop: Platform.OS === 'ios' ? 30 : 20,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1000,
    overflow: 'hidden',
  },
  headerPattern: {
    ...StyleSheet.absoluteFillObject,
  },
  patternDot: {
    position: 'absolute',
    width: 60,
    height: 60, //hauteur des bulbles
    borderRadius: 30,
    opacity: 0.3,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    marginBottom: 20,
  },
  categoriesContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 25,
    borderWidth: 2,
    marginRight: 12,
  },
  categoryText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContent: {
    paddingTop: height * 0.2,
   // paddingBottom: 100,
    paddingHorizontal: 15,
  },
  gameCardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginHorizontal: (width - CARD_WIDTH * 2) / 6,
    marginVertical: 12,
  },
  gameCardTouchable: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  gameCard: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  cardShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '200%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    transform: [{ skewY: '-20deg' }],
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  gameIcon: {
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  difficultyBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  difficultyText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  gameTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    textAlign: 'center',
  },
  gameDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 14,
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#FFFFFF',
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '600',
  },
  playIcon: {
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default GameListScreen;