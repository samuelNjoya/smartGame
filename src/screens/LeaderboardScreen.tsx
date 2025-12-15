import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { useSettings } from '../hooks/useSettings';
import { usePlayer } from '../hooks/usePlayer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { GameId } from '../constants/gameData';
import GameXpBarChart from '../components/Graphic/GameXpBarChart';
import WeeklyXpTrendChart from '../components/Graphic/WeeklyXpTrendChart';

const { width } = Dimensions.get('window');

// --- TYPES ---
type FilterType = 'All' | GameId;
type SortType = 'date' | 'score';
type ChartTab = 'progress' | 'ratio';

// --- COMPOSANT: Carte de Graphique (Performance) ---
const PerformanceCharts = ({ data, theme }: { data: any[], theme: any }) => {
  const [activeTab, setActiveTab] = useState<ChartTab>('progress');

  // 1. SÉCURITÉ : On nettoie les données pour ne garder que celles avec un score valide
  const validData = data.filter(item => 
    typeof item.score === 'number' && !isNaN(item.score)
  );

  if (data.length < 2) {
    return (
      <View style={[styles.chartCard, { backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center', height: 200 }]}>
        <MaterialCommunityIcons name="chart-line" size={50} color={theme.secondary} />
        <Text style={{ color: theme.textSecondary, marginTop: 10 }}>Jouez plus de parties pour voir vos stats !</Text>
      </View>
    );
  }

  const recentGames = [...validData].slice(0, 10).reverse();
  const scores = recentGames.map(d => d.score);
  const labels = recentGames.map((_, i) => (i + 1).toString());

  // Préparation des données pour le Pie Chart (Taux de victoire)
  const wins = validData.filter(d => d.isVictory).length;
  const losses = validData.length - wins;
  
  const pieData = [
    { name: 'Victoires', population: wins, color: theme.success, legendFontColor: theme.text, legendFontSize: 12 },
    { name: 'Défaites', population: losses, color: theme.error, legendFontColor: theme.text, legendFontSize: 12 },
  ];

  // Définition des onglets
  const tabs = [
    {
      id: 'progress' as ChartTab,
      title: 'Progression',
      icon: 'chart-line',
      color: theme.primary
    },
    {
      id: 'ratio' as ChartTab,
      title: 'Performance',
      icon: 'chart-pie',
      color: theme.secondary
    }
  ];

  return (
    <View style={styles.chartsWrapper}>
      {/* Onglets de navigation */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.card + '40' }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              activeTab === tab.id && [
                styles.activeTabButton,
                { backgroundColor: theme.card, borderColor: tab.color }
              ]
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <MaterialCommunityIcons
              name={tab.icon as any}
              size={16}
              //color={activeTab === tab.id ? tab.color : theme.textSecondary}
              color={theme.text}
              style={styles.tabIcon}
            />
            <Text style={[
              styles.tabText,
              //{ color: activeTab === tab.id ? theme.text : theme.textSecondary }
              { color: theme.text }
            ]}>
              {tab.title}
            </Text>
            {activeTab === tab.id && (
              <View style={[{ backgroundColor: tab.color }]} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Contenu des graphiques */}
      <View style={[styles.chartContent, { backgroundColor: theme.card }]}>
        {activeTab === 'progress' ? (
          <>
            <View style={styles.chartHeader}>
              <MaterialCommunityIcons name="chart-line" size={20} color={theme.primary} />
              <Text style={[styles.chartTitle, { color: theme.text }]}>
                 Progression du Score
              </Text>
            </View>
            <View style={styles.chartWrapper}>
              <LineChart
                data={{
                  labels: labels,
                  datasets: [{ data: scores }]
                }}
                width={width - 60}
                height={180}
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: theme.card,
                  backgroundGradientFrom: theme.card,
                  backgroundGradientTo: theme.card,
                  decimalPlaces: 0,
                  color: (opacity = 1) => theme.primary,
                  labelColor: (opacity = 1) => theme.text,
                  propsForDots: { r: "4", strokeWidth: "2", stroke: theme.accent }
                }}
                bezier
                style={{ borderRadius: 16 }}
              />
            </View>
            <Text style={[styles.chartSubtitle, { color: theme.text }]}>
              10 dernières parties
            </Text>
          </>
        ) : (
          <>
            <View style={styles.chartHeader}>
              <MaterialCommunityIcons name="chart-pie" size={20} color={theme.secondary} />
              <Text style={[styles.chartTitle, { color: theme.text }]}>
                Taux de Réussite
              </Text>
            </View>
            <View style={styles.chartWrapper}>
              <PieChart
                data={pieData}
                width={width - 60}
                height={180}
                chartConfig={{
                  color: (opacity = 1) => theme.text,
                }}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                center={[10, 0]}
              />
            </View>
            <View style={styles.statsContainer}>
              <View style={[styles.statItem, { borderRightWidth: 1, borderRightColor: theme.border }]}>
                <Text style={[styles.statLabel, { color: theme.text }]}>Victoires</Text>
                <Text style={[styles.statValue, { color: theme.success }]}>{wins}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: theme.text }]}>Défaites</Text>
                <Text style={[styles.statValue, { color: theme.error }]}>{losses}</Text>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
};


// --- ÉCRAN PRINCIPAL ---
const LeaderboardScreen = () => {
  const { theme } = useSettings();
  const { scoreHistory } = usePlayer();

  const [selectedGame, setSelectedGame] = useState<FilterType>('All');
  const [sortBy, setSortBy] = useState<SortType>('date');

  const filteredData = useMemo(() => {
    let data = [...scoreHistory];

    if (selectedGame !== 'All') {
      data = data.filter(item => item.gameId === selectedGame);
    }

    if (sortBy === 'score') {
      data.sort((a, b) => b.score - a.score);
    } else {
      data.sort((a, b) => b.date - a.date);
    }

    return data;
  }, [scoreHistory, selectedGame, sortBy]);

  const filterOptions: FilterType[] = ['All','Memory', 'NeuroPuzzle', 'WordScramble', 'MathRush'];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      
      <View style={styles.headerContainer}>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Tableau de Bord</Text>
      </View>

      <GameXpBarChart />

      <WeeklyXpTrendChart />

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filterOptions.map((game) => (
            <TouchableOpacity
              key={game}
              style={[
                styles.filterBadge,
                { 
                  backgroundColor: selectedGame === game ? theme.primary : theme.card,
                  borderColor: "#00FF00" 
                }
              ]}
              onPress={() => setSelectedGame(game)}
            >
              <Text style={{ 
                color: selectedGame === game ? '#FFF' : theme.text,
                fontWeight: selectedGame === game ? 'bold' : 'normal'
              }}>
                {game === 'All' ? 'Tous' : game}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <TouchableOpacity 
          style={[styles.sortButton, { backgroundColor: theme.card }]}
          onPress={() => setSortBy(prev => prev === 'date' ? 'score' : 'date')}
        >
          <MaterialCommunityIcons 
            name={sortBy === 'date' ? "calendar-clock" : "trophy-outline"} 
            size={20} 
            color={theme.accent} 
          />
          <Text style={{ color: theme.text, marginLeft: 5, fontSize: 12 }}>
            {sortBy === 'date' ? 'Récents' : 'Meilleurs'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal:10 }}>
        <PerformanceCharts data={filteredData} theme={theme} />
      </View>
      
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  // Styles pour les onglets
  chartsWrapper: {
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 15,
    // elevation: 1,
    // shadowColor: '#000',
    // shadowOpacity: 0.1,
    // shadowRadius: 5,
    // shadowOffset: { width: 0, height: 2 },
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    position: 'relative',
  },
  activeTabButton: {
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
 
  // Styles pour le contenu des graphiques
  chartContent: {
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
   // marginBottom:50,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  chartWrapper: {
    alignItems: 'center',
   // marginBottom: 0,
  },
  chartSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    //marginTop: 5,
    paddingTop: 15,
    borderTopWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Styles Filtres
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterScroll: {
    paddingRight: 10,
    alignItems: 'center',
  },
  filterBadge: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginLeft: 5,
  },
  // Styles Liste

  gameTitle: {
    fontSize: 16,
    fontWeight: '600',
  },

  chartCard: {
    borderRadius: 16,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
});

export default LeaderboardScreen;