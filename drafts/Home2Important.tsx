// src/screens/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useSettings } from '../hooks/useSettings';
import { usePlayer } from '../hooks/usePlayer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GAME_CONFIG } from '../constants/config';
import HomeCarousel from '../components/HomeCarousel';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';

const { width } = Dimensions.get('window');

// Formatage du temps
const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Composant pour afficher les cœurs avec timer
const LifeHearts = () => {
  const { lives, regenJobs } = usePlayer();
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
  for (let i = 0; i < GAME_CONFIG.MAX_LIVES; i++) {
    hearts.push(
      <MaterialCommunityIcons
        key={i}
        name={i < lives ? 'heart' : 'heart-outline'}
        size={28}
        color={i < lives ? theme.error : theme.text}
        style={styles.heartIcon}
      />
    );
  }

  const showTimer = timeLeft !== '00:00';

  return (
    <MotiView
      from={{ opacity: 0, translateY: -10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300 }}
    >
      <View style={styles.heartsContainer}>
        <View style={styles.heartsRow}>
          <MaterialCommunityIcons name="heart" size={20} color={theme.error} />
          <Text style={[styles.heartsLabel, { color: theme.text }]}>
            {lives}/{GAME_CONFIG.MAX_LIVES}
          </Text>
        </View>
        
        <View style={styles.heartsVisual}>
          {hearts}
        </View>
        
        {showTimer && (
          <View style={styles.timerContainer}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={theme.primary} />
            <Text style={[styles.timerText, { color: theme.primary }]}>
              {timeLeft}
            </Text>
          </View>
        )}
      </View>
    </MotiView>
  );
};

// Carte de statistique
const StatCard = ({ title, value, icon, color, suffix = '' }: any) => (
  <MotiView
    from={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: 'spring', delay: 100 }}
    style={[styles.statCard, { backgroundColor: color + '15' }]}
  >
    <View style={[styles.statIconContainer, { backgroundColor: color + '30' }]}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.statValue} numberOfLines={1}>
      {value}{suffix}
    </Text>
    <Text style={styles.statLabel} numberOfLines={1}>
      {title}
    </Text>
  </MotiView>
);

// Section titre avec animation
const SectionHeader = ({ title, icon, onPress }: any) => {
  const { theme } = useSettings();
  
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleContainer}>
        <MaterialCommunityIcons name={icon} size={22} color={theme.primary} />
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {title}
        </Text>
      </View>
      {onPress && (
        <TouchableOpacity onPress={onPress}>
          <Text style={[styles.seeAllText, { color: theme.primary }]}>
            Voir tout
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const HomeScreen = () => {
  const { theme, isDark,  } = useSettings();
  const { xp, } = usePlayer();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [stats, setStats] = useState({
    totalGames: 0,
    winRate: 0,
    bestStreak: 0,
    totalPlayTime: 0,
  });



  return (
    <LinearGradient
      colors={isDark ? ['#0f0c29', '#302b63'] : ['#f8f9fa', '#e9ecef']}
      style={styles.container}
    >
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header avec XP et Vies */}
        <View style={styles.header}>
          <View style={styles.playerInfo}>
            <MotiView
              from={{ rotate: '0deg' }}
              animate={{ rotate: '360deg' }}
              transition={{ loop: true, type: 'timing', duration: 20000 }}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.levelBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.levelText}>SG.</Text>
              </LinearGradient>
            </MotiView>
            
            <View style={styles.xpContainer}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.xpGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                
              </LinearGradient>
              <View style={styles.xpTextContainer}>
                <MaterialCommunityIcons name="star-four-points" size={20} color="#FFD700" />
                <Text style={[styles.xpText, { color: '#FFFFFF' }]}>
                  {xp} XP
                </Text>
              </View>
            </View>
          </View>
          
          <LifeHearts />
        </View>

        {/* Titre principal */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 200 }}
        >
          <Text style={[styles.welcomeTitle, { color: theme.text }]}>
            Bienvenue sur
          </Text>
          <Text style={[styles.appTitle, { color: theme.primary }]}>
            Smart Game
          </Text>
          <Text style={[styles.subtitle, { color: theme.secondary }]}>
            Entraînez votre cerveau, un jeu à la fois 🎯
          </Text>
        </MotiView>

        {/* Section Statistiques */}
        <SectionHeader title="Vos Statistiques" icon="chart-box" />
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScroll}
        >
          <StatCard
            title="Parties jouées"
            value={stats.totalGames}
            icon="gamepad-variant"
            color="#4CAF50"
          />
          <StatCard
            title="Taux de victoire"
            value={stats.winRate}
            icon="trophy"
            color="#FF9800"
            suffix="%"
          />
          <StatCard
            title="Meilleur streak"
            value={stats.bestStreak}
            icon="fire"
            color="#F44336"
          />
          <StatCard
            title="Temps total"
            value={stats.totalPlayTime}
            icon="clock"
            color="#2196F3"
            suffix=" min"
          />
        </ScrollView>

        {/* Section Récompenses du jour */}
        <SectionHeader 
          title="Récompenses disponibles" 
          icon="gift"
          onPress={() => navigation.navigate('DailyChallenge')}
        />
        
        <View style={[styles.dailyRewardCard, { backgroundColor: theme.card }]}>
          <View style={styles.dailyRewardHeader}>
            <MaterialCommunityIcons name="calendar-star" size={24} color="#FFD700" />
            <Text style={[styles.dailyRewardTitle, { color: theme.text }]}>
              Défi Quotidien
            </Text>
          </View>
          <Text style={[styles.dailyRewardText, { color: theme.secondary }]}>
            Terminez le défi d'aujourd'hui pour obtenir un bonus spécial et débloquer des récompenses exclusives !
          </Text>
          
          <View style={styles.rewardBadges}>
            <View style={[styles.rewardBadge, { backgroundColor: '#4CAF50' + '20' }]}>
              <MaterialCommunityIcons name="star" size={16} color="#4CAF50" />
              <Text style={[styles.rewardBadgeText, { color: '#4CAF50' }]}>
                +500 XP
              </Text>
            </View>
            <View style={[styles.rewardBadge, { backgroundColor: '#2196F3' + '20' }]}>
              <MaterialCommunityIcons name="crown" size={16} color="#2196F3" />
              <Text style={[styles.rewardBadgeText, { color: '#2196F3' }]}>
                Badge exclusif
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.dailyButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('DailyChallenge')}
          >
            <Text style={styles.dailyButtonText}>Voir le défi du jour</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Section Jeux populaires */}
        <SectionHeader title="Continuez votre aventure" icon="compass" />
        
        {/* Carousel des jeux */}
        <HomeCarousel />

        {/* Footer */}
        <View style={styles.footer}>
          <MaterialCommunityIcons name="brain" size={40} color={theme.secondary} />
          <Text style={[styles.footerText, { color: theme.secondary }]}>
            Chaque partie vous rapproche de l'excellence cognitive !
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  playerInfo: {
    alignItems: 'flex-start',
    gap: 10,
  },
  levelBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  levelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  xpContainer: {
    width: width * 0.5,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    elevation: 3,
  },
  xpGradient: {
    flex: 1,
    justifyContent: 'center',
  },
  xpProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  xpTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  xpText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  heartsContainer: {
    alignItems: 'flex-end',
    gap: 6,
  },
  heartsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heartsLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  heartsVisual: {
    flexDirection: 'row',
  },
  heartIcon: {
    marginHorizontal: 2,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  timerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  welcomeTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
    opacity: 0.8,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    marginTop: 5,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsScroll: {
    paddingVertical: 8,
    gap: 12,
    paddingRight: 16,
  },
  statCard: {
    width: 110,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.8,
  },
  dailyRewardCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dailyRewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  dailyRewardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dailyRewardText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  rewardBadges: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  rewardBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dailyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  dailyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  goalsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  goalProgressBar: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  goalProgressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
});

export default HomeScreen;