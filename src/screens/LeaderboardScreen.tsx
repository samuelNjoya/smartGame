import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { useSettings } from '../hooks/useSettings';
import { usePlayer } from '../hooks/usePlayer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { GameId, GameDifficulty } from '../constants/gameData';
import GameXpBarChart from '../components/Graphic/GameXpBarChart';
import WeeklyXpTrendChart from '../components/Graphic/WeeklyXpTrendChart';

const { width } = Dimensions.get('window');

// --- TYPES ---
type FilterType = 'All' | GameId;
type SortType = 'date' | 'score';

// --- COMPOSANT: Carte de Graphique (Performance) ---
const PerformanceCharts = ({ data, theme }: { data: any[], theme: any }) => {
  // 1. SÉCURITÉ : On nettoie les données pour ne garder que celles avec un score valide
  // Cela élimine les bugs causés par d'anciennes données de test corrompues
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

  // Préparation des données pour le Line Chart (10 dernières parties)
  // On inverse pour avoir l'ordre chronologique (ancien -> récent)

  // const recentGames = [...data].slice(0, 10).reverse();
  // const scores = recentGames.map(d => d.score);

  const recentGames = [...validData].slice(0, 10).reverse(); //1 ... 10 
  const scores = recentGames.map(d => d.score);

  const labels = recentGames.map((_, i) => (i + 1).toString()); // 1, 2, 3...
  

  // Préparation des données pour le Pie Chart (Taux de victoire)
  // utiliser validData au lieu de data
  const wins = validData.filter(d => d.isVictory).length;
  const losses = validData.length - wins;
  
  const pieData = [
    { name: 'Victoires', population: wins, color: theme.success, legendFontColor: theme.text, legendFontSize: 12 },
    { name: 'Défaites', population: losses, color: theme.error, legendFontColor: theme.text, legendFontSize: 12 },
  ];

  return (
    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
      {/* GRAPHIQUE 1 : Progression du Score 

[Image of a line chart showing score progression over time]
 */}
      <View style={[styles.chartCard, { backgroundColor: theme.card, width: width - 40 }]}>
        <Text style={[styles.chartTitle, { color: theme.text }]}>📈 Progression du Score (10 dernières)</Text>
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
            labelColor: (opacity = 1) => theme.textSecondary,
            propsForDots: { r: "4", strokeWidth: "2", stroke: theme.accent }
          }}
          bezier
          style={{ borderRadius: 16 }}
        />
      </View>

      {/* GRAPHIQUE 2 : Ratio Victoire/Défaite 

[Image of a bar chart showing success rate by game type]
 */}
      <View style={[styles.chartCard, { backgroundColor: theme.card, width: width - 40 }]}>
        <Text style={[styles.chartTitle, { color: theme.text }]}>🏆 Taux de Réussite</Text>
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
          absolute
        />
      </View>
    </ScrollView>
  );
};

// --- COMPOSANT: Ligne de Score (Liste) ---
const ScoreItem = ({ item, index, theme }: any) => {
  // Couleur du rang
  const getRankColor = (rank: number) => {
    if (rank === 0) return '#FFD700'; // Or (1er)
    if (rank === 1) return '#C0C0C0'; // Argent (2ème)
    if (rank === 2) return '#CD7F32'; // Bronze (3ème)
    return theme.textSecondary;
  };

  const formattedDate = new Date(item.date).toLocaleDateString();

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300, delay: index * 50 }}
      style={[styles.scoreRow, { backgroundColor: theme.card, borderLeftColor: item.isVictory ? theme.success : theme.error }]}
    >
      {/* Rang & Icône */}
      <View style={styles.rankCol}>
        <MaterialCommunityIcons 
          name={index < 3 ? "trophy" : "numeric"} 
          size={24} 
          color={getRankColor(index)} 
        />
        <Text style={[styles.rankText, { color: theme.text }]}>{index + 1}</Text>
      </View>

      {/* Détails du Jeu */}
      <View style={styles.infoCol}>
        <Text style={[styles.gameTitle, { color: theme.text }]}>
          {item.gameId} <Text style={{ fontSize: 12, color: theme.secondary }}>({item.difficulty})</Text>
        </Text>
        <Text style={[styles.dateText, { color: theme.textSecondary }]}>
          Niveau {item.level} • {formattedDate}
        </Text>
      </View>

      {/* Score */}
      <View style={styles.scoreCol}>
        <Text style={[styles.scoreValue, { color: theme.primary }]}>{item.score}</Text>
        <Text style={[styles.xpLabel, { color: theme.textSecondary }]}>XP</Text>
      </View>
    </MotiView>
  );
};

// --- ÉCRAN PRINCIPAL ---
const LeaderboardScreen = () => {
  const { theme } = useSettings();
  const { scoreHistory } = usePlayer(); // Récupération de l'historique depuis le contexte

  // États pour les filtres
  const [selectedGame, setSelectedGame] = useState<FilterType>('All');
  const [sortBy, setSortBy] = useState<SortType>('date'); // 'date' ou 'score'

  // Filtrage et Tri des données (Memoized pour la performance)
  const filteredData = useMemo(() => {
    let data = [...scoreHistory];

    // 1. Filtrer par jeu
    if (selectedGame !== 'All') {
      data = data.filter(item => item.gameId === selectedGame);
    }

    // 2. Trier
    if (sortBy === 'score') {
      data.sort((a, b) => b.score - a.score); // Score décroissant
    } else {
      data.sort((a, b) => b.date - a.date); // Date décroissante (plus récent d'abord)
    }

    return data;
  }, [scoreHistory, selectedGame, sortBy]);

  // Liste des jeux disponibles pour le filtre (Dynamique ou statique)
  const filterOptions: FilterType[] = ['All','Memory', 'NeuroPuzzle', 'WordScramble', 'MathRush' ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* --- En-tête --- */}
      <View style={styles.headerContainer}>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Tableau de Bord</Text>
      </View>

         {/* --- NOUVEAU : Graphique XP par Jeu --- */}
      <GameXpBarChart />

      {/* NOUVEAU : Graphique Progression Hebdo (courbe) */}
      <WeeklyXpTrendChart />

      {/* --- Graphiques --- */}
      <View style={{ height: 230 }}> 
        <PerformanceCharts data={filteredData} theme={theme} />
      </View>

     

      {/* --- Filtres --- */}
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
        
        {/* Bouton de Tri */}
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

      {/* --- Liste des Scores --- */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <ScoreItem item={item} index={index} theme={theme} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="ghost" size={40} color={theme.secondary} />
            <Text style={{ color: theme.secondary, marginTop: 10 }}>Aucune partie jouée pour le moment.</Text>
          </View>
        }
      />
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
  // Styles Graphiques
  chartScroll: {
    paddingLeft: 20,
    marginBottom: 10,
  },
  chartCard: {
    borderRadius: 16,
    padding: 15,
    marginRight: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4, // Indicateur Victoire/Défaite
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  rankCol: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 50,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  infoCol: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    marginTop: 2,
  },
  scoreCol: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  xpLabel: {
    fontSize: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  }
});

export default LeaderboardScreen;