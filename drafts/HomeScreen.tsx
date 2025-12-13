// src/screens/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
  Image
} from 'react-native';
import { useSettings } from '../hooks/useSettings';
import { usePlayer } from '../hooks/usePlayer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GAME_CONFIG } from '../constants/config';
import HomeCarousel from '../components/HomeCarousel';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Fonction formatTime
const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Composant pour afficher les coeurs avec timer
const LifeHearts = () => {
  const { lives, regenJobs, maxLives } = usePlayer();
  const { theme } = useSettings();
  const [timeLeft, setTimeLeft] = useState('00:00');

  useEffect(() => {
    if (regenJobs.length > 0) {
      const firstJob = regenJobs[0];
      const updateTimer = () => {
        const remaining = firstJob.endTime - Date.now();
        if (remaining <= 0) {
          setTimeLeft('00:00');
        } else {
          setTimeLeft(formatTime(remaining));
        }
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeLeft('00:00');
    }
  }, [regenJobs]);

  const hearts = [];
  for (let i = 0; i < maxLives; i++) {
    hearts.push(
      <MaterialCommunityIcons
        key={i}
        name={i < lives ? 'heart' : 'heart-outline'}
        size={28}
        color={i < lives ? theme.error : theme.textSecondary}
        style={styles.heartIcon}
      />
    );
  }
  const showTimer = timeLeft !== '00:00' && lives < maxLives;

  return (
    <View style={styles.lifeContainer}>
      <LinearGradient
        colors={[theme.card, theme.card + '80']}
        style={styles.lifeCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.lifeHeader}>
          <MaterialCommunityIcons name="heart-pulse" size={20} color={theme.error} />
          <Text style={[styles.lifeTitle, { color: theme.text }]}>Vies</Text>
        </View>
        <View style={styles.heartsRow}>{hearts}</View>
        {showTimer && (
          <View style={styles.timerContainer}>
            <MaterialCommunityIcons name="timer" size={14} color={theme.primary} />
            <Text style={[styles.timerText, { color: theme.primary }]}>
              {timeLeft}
            </Text>
          </View>
        )}
        {!showTimer && lives < maxLives && (
          <Text style={[styles.fullLifeText, { color: theme.success }]}>
            Plein de vie !
          </Text>
        )}
      </LinearGradient>
    </View>
  );
};

// Composant pour afficher les stats du joueur
const PlayerStats = () => {
  const { xp, level, gamesPlayed, totalScore } = usePlayer();
  const { theme } = useSettings();
  
  const xpForNextLevel = level * 1000;
  const progress = Math.min((xp % 1000) / xpForNextLevel * 100, 100);

  return (
    <View style={styles.statsContainer}>
      <LinearGradient
        colors={[theme.primary + '20', theme.primary + '05']}
        style={styles.statsCard}
      >
        <View style={styles.statsHeader}>
          <MaterialCommunityIcons name="trophy" size={24} color={theme.primary} />
          <Text style={[styles.statsTitle, { color: theme.text }]}>Vos Statistiques</Text>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.primary + '20' }]}>
              <MaterialCommunityIcons name="star" size={20} color={theme.primary} />
            </View>
            <View>
              <Text style={[styles.statValue, { color: theme.text }]}>{xp}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Points XP</Text>
            </View>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.success + '20' }]}>
              <MaterialCommunityIcons name="numeric" size={20} color={theme.success} />
            </View>
            <View>
              <Text style={[styles.statValue, { color: theme.text }]}>{level}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Niveau</Text>
            </View>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.secondary + '20' }]}>
              <MaterialCommunityIcons name="gamepad-variant" size={20} color={theme.secondary} />
            </View>
            <View>
              <Text style={[styles.statValue, { color: theme.text }]}>{gamesPlayed || 0}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Parties</Text>
            </View>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.accent + '20' }]}>
              <MaterialCommunityIcons name="chart-bar" size={20} color={theme.accent} />
            </View>
            <View>
              <Text style={[styles.statValue, { color: theme.text }]}>{totalScore || 0}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Score Total</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
            Progression Niveau {level}
          </Text>
          <View style={[styles.progressBar, { backgroundColor: theme.card }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${progress}%`,
                  backgroundColor: theme.primary 
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: theme.textSecondary }]}>
            {xp % 1000} / {xpForNextLevel} XP
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

// Composant Défi du Jour
const DailyChallenge = () => {
  const { theme } = useSettings();
  const [challengeProgress, setChallengeProgress] = useState(65);
  const [challengeTimeLeft, setChallengeTimeLeft] = useState('08:24:15');

  return (
    <TouchableOpacity activeOpacity={0.9}>
      <LinearGradient
        colors={['#8B5CF6', '#6366F1']}
        style={styles.dailyChallengeCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.challengeHeader}>
          <View style={styles.challengeBadge}>
            <MaterialCommunityIcons name="crown" size={20} color="#FFF" />
            <Text style={styles.challengeBadgeText}>DÉFI DU JOUR</Text>
          </View>
          <View style={styles.challengeTimer}>
            <MaterialCommunityIcons name="clock-outline" size={14} color="#FFF" />
            <Text style={styles.challengeTimerText}>{challengeTimeLeft}</Text>
          </View>
        </View>
        
        <View style={styles.challengeContent}>
          <View style={styles.challengeIconContainer}>
            <MaterialCommunityIcons name="lightning-bolt" size={32} color="#FFF" />
          </View>
          <View style={styles.challengeTextContainer}>
            <Text style={styles.challengeTitle}>Terminez 5 parties en moins de 10min</Text>
            <Text style={styles.challengeDescription}>Gagnez 500 XP bonus + Badge exclusif</Text>
          </View>
        </View>
        
        <View style={styles.challengeProgress}>
          <Text style={styles.challengeProgressText}>Progression: {challengeProgress}%</Text>
          <View style={styles.challengeProgressBar}>
            <View 
              style={[
                styles.challengeProgressFill, 
                { width: `${challengeProgress}%` }
              ]} 
            />
          </View>
          <Text style={styles.challengeProgressHint}>3/5 parties complétées</Text>
        </View>
        
        <TouchableOpacity style={styles.challengeButton}>
          <Text style={styles.challengeButtonText}>Commencer le Défi</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Composant Catégories de Jeux
const GameCategories = () => {
  const { theme } = useSettings();
  
  const categories = [
    {
      id: 'memory',
      name: 'Mémoire',
      icon: 'brain',
      color: '#8B5CF6',
      games: 3,
      description: 'Testez votre mémoire'
    },
    {
      id: 'logic',
      name: 'Logique',
      icon: 'puzzle',
      color: '#10B981',
      games: 4,
      description: 'Résolvez des énigmes'
    },
    {
      id: 'math',
      name: 'Maths',
      icon: 'calculator',
      color: '#F59E0B',
      games: 2,
      description: 'Calcul rapide'
    },
    {
      id: 'language',
      name: 'Langue',
      icon: 'alphabetical',
      color: '#EC4899',
      games: 2,
      description: 'Vocabulaire & lettres'
    }
  ];

  return (
    <View style={styles.categoriesContainer}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="apps" size={22} color={theme.primary} />
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Catégories de Jeux</Text>
      </View>
      
      <View style={styles.categoriesGrid}>
        {categories.map((category) => (
          <TouchableOpacity key={category.id} style={styles.categoryCard}>
            <LinearGradient
              colors={[category.color + '40', category.color + '10']}
              style={[styles.categoryIconContainer, { borderColor: category.color + '30' }]}
            >
              <MaterialCommunityIcons 
                name={category.icon as any} 
                size={24} 
                color={category.color} 
              />
            </LinearGradient>
            <Text style={[styles.categoryName, { color: theme.text }]}>{category.name}</Text>
            <Text style={[styles.categoryDescription, { color: theme.textSecondary }]}>
              {category.description}
            </Text>
            <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
              <Text style={[styles.categoryBadgeText, { color: category.color }]}>
                {category.games} jeux
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Composant Récompenses Quotidiennes
const DailyRewards = () => {
  const { theme } = useSettings();
  const [streak, setStreak] = useState(7);
  const [todayClaimed, setTodayClaimed] = useState(false);

  const rewards = [
    { day: 1, reward: '50 XP', claimed: true },
    { day: 2, reward: '75 XP', claimed: true },
    { day: 3, reward: '100 XP', claimed: true },
    { day: 4, reward: '1 Vie', claimed: true },
    { day: 5, reward: '150 XP', claimed: true },
    { day: 6, reward: '200 XP', claimed: true },
    { day: 7, reward: '500 XP', claimed: false },
  ];

  return (
    <View style={styles.rewardsContainer}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="gift" size={22} color={theme.success} />
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Récompenses Quotidiennes</Text>
      </View>
      
      <View style={styles.streakContainer}>
        <View style={styles.streakInfo}>
          <MaterialCommunityIcons name="fire" size={24} color="#FF6B6B" />
          <Text style={[styles.streakText, { color: theme.text }]}>
            Série de <Text style={{ color: '#FF6B6B', fontWeight: 'bold' }}>{streak} jours</Text>
          </Text>
        </View>
        <Text style={[styles.streakSubtext, { color: theme.textSecondary }]}>
          Revenez demain pour continuer !
        </Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.rewardsScroll}
        contentContainerStyle={styles.rewardsContent}
      >
        {rewards.map((item, index) => (
          <View key={item.day} style={styles.rewardCard}>
            <View style={[
              styles.rewardCircle,
              { 
                backgroundColor: item.claimed ? theme.success + '20' : theme.card,
                borderColor: item.claimed ? theme.success : theme.border
              }
            ]}>
              {item.claimed && (
                <MaterialCommunityIcons name="check" size={16} color={theme.success} />
              )}
              <Text style={[
                styles.rewardDay, 
                { color: item.claimed ? theme.success : theme.textSecondary }
              ]}>
                J{item.day}
              </Text>
            </View>
            <Text style={[
              styles.rewardValue, 
              { color: item.claimed ? theme.text : theme.textSecondary }
            ]}>
              {item.reward}
            </Text>
            <View style={styles.rewardConnector} />
          </View>
        ))}
      </ScrollView>
      
      <TouchableOpacity 
        style={[
          styles.claimButton,
          { backgroundColor: todayClaimed ? theme.success : theme.primary }
        ]}
        disabled={todayClaimed}
      >
        <MaterialCommunityIcons 
          name={todayClaimed ? "check-circle" : "gift-open"} 
          size={18} 
          color="#FFF" 
        />
        <Text style={styles.claimButtonText}>
          {todayClaimed ? 'Récompense réclamée' : 'Réclamer la récompense'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const HomeScreen = () => {
  const { theme } = useSettings();

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header avec vies et XP */}
      <View style={styles.header}>
        <LifeHearts />
        <PlayerStats />
      </View>
      
      {/* Défi du Jour */}
      <DailyChallenge />
      
      {/* Carousel */}
      <HomeCarousel />
      
      {/* Catégories de Jeux */}
      <GameCategories />
      
      {/* Récompenses Quotidiennes */}
      <DailyRewards />
      
      {/* Section Jeux Rapides */}
      <View style={styles.quickGamesContainer}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="rocket-launch" size={22} color={theme.accent} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Jeux Rapides</Text>
        </View>
        
        <View style={styles.quickGamesGrid}>
          <TouchableOpacity style={[styles.quickGameCard, { backgroundColor: theme.primary + '15' }]}>
            <MaterialCommunityIcons name="timer-sand" size={28} color={theme.primary} />
            <Text style={[styles.quickGameTitle, { color: theme.text }]}>60 Secondes</Text>
            <Text style={[styles.quickGameDesc, { color: theme.textSecondary }]}>
              Défi de rapidité
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.quickGameCard, { backgroundColor: theme.success + '15' }]}>
            <MaterialCommunityIcons name="target" size={28} color={theme.success} />
            <Text style={[styles.quickGameTitle, { color: theme.text }]}>Défi Cible</Text>
            <Text style={[styles.quickGameDesc, { color: theme.textSecondary }]}>
              Précision & réflexes
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Bouton Jouer Principal */}
      <TouchableOpacity style={styles.playButton}>
        <LinearGradient
          colors={[theme.primary, theme.secondary]}
          style={styles.playButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <MaterialCommunityIcons name="gamepad-variant" size={24} color="#FFF" />
          <Text style={styles.playButtonText}>JOUER MAINTENANT</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  // Life Hearts Styles
  lifeContainer: {
    flex: 1,
    marginRight: 8,
  },
  lifeCard: {
    padding: 12,
    borderRadius: 16,
    minWidth: 120,
  },
  lifeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  lifeTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  heartsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  heartIcon: {
    marginHorizontal: 2,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  fullLifeText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  // Player Stats Styles
  statsContainer: {
    flex: 2,
    marginLeft: 8,
  },
  statsCard: {
    padding: 16,
    borderRadius: 16,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
  // Daily Challenge Styles
  dailyChallengeCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  challengeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  challengeBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  challengeTimer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  challengeTimerText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  challengeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  challengeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  challengeTextContainer: {
    flex: 1,
  },
  challengeTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  challengeDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  challengeProgress: {
    marginBottom: 16,
  },
  challengeProgressText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  challengeProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 3,
  },
  challengeProgressHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  challengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 14,
    borderRadius: 12,
  },
  challengeButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },
  // Categories Styles
  categoriesContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Rewards Styles
  rewardsContainer: {
    marginBottom: 24,
  },
  streakContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  streakText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  streakSubtext: {
    fontSize: 12,
  },
  rewardsScroll: {
    marginHorizontal: -16,
  },
  rewardsContent: {
    paddingHorizontal: 16,
  },
  rewardCard: {
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  rewardCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  rewardDay: {
    fontSize: 12,
    fontWeight: '600',
  },
  rewardValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  rewardConnector: {
    position: 'absolute',
    right: -12,
    top: 28,
    width: 12,
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  claimButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  // Quick Games Styles
  quickGamesContainer: {
    marginBottom: 24,
  },
  quickGamesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickGameCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  quickGameTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  quickGameDesc: {
    fontSize: 12,
    textAlign: 'center',
  },
  // Play Button Styles
  playButton: {
    marginBottom: 30,
  },
  playButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  playButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
});

export default HomeScreen;