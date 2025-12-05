import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useSettings } from '../../hooks/useSettings';
import { usePlayer } from '../../hooks/usePlayer';

const { width } = Dimensions.get('window');

// Type pour les données agrégées
type GameXpData = {
  gameId: string;
  totalXp: number;
  gameCount: number;
  color: string;
};

// Définition des couleurs par jeu (peut être externalisé dans les constantes)
const GAME_COLORS: Record<string, string> = {
  'Memory': '#FF6B6B',      // Rouge
  'NeuroPuzzle': '#4ECDC4', // Turquoise
  'WordScramble': '#FFD166', // Jaune
  'MathRush': '#06D6A0',    // Vert
  // Ajoutez d'autres jeux au besoin
};

const GameXpBarChart = () => {
  const { theme } = useSettings();
  const { scoreHistory } = usePlayer();

  // Agrégation des données par jeu
  const gameXpData = React.useMemo(() => {
    // Structure temporaire pour accumuler les données
    const gamesMap: Record<string, { totalXp: number, count: number }> = {};

    // Parcours de l'historique
    scoreHistory.forEach((item) => {
      const gameId = item.gameId;
      
      if (!gamesMap[gameId]) {
        gamesMap[gameId] = { totalXp: 0, count: 0 };
      }
      
      // Accumulation de l'XP (score) et du nombre de parties
      gamesMap[gameId].totalXp += item.score || 0;
      gamesMap[gameId].count += 1;
    });

    // Transformation en tableau trié par XP décroissant
    const data: GameXpData[] = Object.entries(gamesMap).map(([gameId, data]) => ({
      gameId,
      totalXp: data.totalXp,
      gameCount: data.count,
      color: GAME_COLORS[gameId] || theme.primary, // Couleur par défaut si jeu non défini
    }));

    // Tri par XP décroissant
    return data.sort((a, b) => b.totalXp - a.totalXp);
  }, [scoreHistory, theme.primary]);

  // Si pas assez de données
  if (gameXpData.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.card }]}>
        <Text style={[styles.title, { color: theme.text }]}>
          📊 XP par Jeu
        </Text>
        <View style={styles.emptyState}>
          <Text style={{ color: theme.secondary, textAlign: 'center' }}>
            Jouez à plusieurs jeux pour voir vos statistiques !
          </Text>
        </View>
      </View>
    );
  }

  // Préparation des données pour le BarChart
  const chartData = {
    labels: gameXpData.map(g => g.gameId),
    datasets: [
      {
        data: gameXpData.map(g => g.totalXp),
        colors: gameXpData.map((g, index) => (opacity = 1) => 
          g.color || `rgba(134, 65, 244, ${opacity})`
        ),
      },
    ],
  };

  // Trouver le jeu le plus et moins joué
  const mostPlayed = gameXpData[0]; // Premier car trié par XP décroissant
  const leastPlayed = gameXpData[gameXpData.length - 1];

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        📊 XP par Jeu (Tous Niveaux)
      </Text>
      
      <BarChart
        data={chartData}
        width={width - 40}
        height={220}
        yAxisLabel=""
        yAxisSuffix=" XP"
        fromZero
        showValuesOnTopOfBars
        chartConfig={{
          backgroundColor: theme.card,
          backgroundGradientFrom: theme.card,
          backgroundGradientTo: theme.card,
          decimalPlaces: 0,
          color: (opacity = 1) => theme.secondary,
          labelColor: (opacity = 1) => theme.text,
          barPercentage: 0.6,
          propsForBackgroundLines: {
            strokeWidth: 0.5,
            stroke: theme.secondary + '30',
          },
        }}
        style={styles.chart}
        verticalLabelRotation={-30} // Pour éviter le chevauchement des labels
      />

      {/* Légendes et insights */}
      <View style={styles.insightsContainer}>
        <View style={styles.insightRow}>
          <View style={[styles.colorDot, { backgroundColor: mostPlayed.color }]} />
          <Text style={[styles.insightText, { color: theme.text }]}>
            <Text style={{ fontWeight: 'bold' }}>Jeu préféré</Text> : {mostPlayed.gameId} 
            ({mostPlayed.totalXp.toLocaleString()} XP - {mostPlayed.gameCount} parties)
          </Text>
        </View>
        
        {gameXpData.length > 1 && (
          <View style={styles.insightRow}>
            <View style={[styles.colorDot, { backgroundColor: leastPlayed.color }]} />
            <Text style={[styles.insightText, { color: theme.text }]}>
              <Text style={{ fontWeight: 'bold' }}>À explorer</Text> : {leastPlayed.gameId} 
              ({leastPlayed.totalXp.toLocaleString()} XP - {leastPlayed.gameCount} parties)
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 8,
    marginVertical: 5,
  },
  emptyState: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  insightText: {
    fontSize: 12,
    flex: 1,
  },
});

export default GameXpBarChart;