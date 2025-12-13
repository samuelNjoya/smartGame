import React, { useState, useEffect } from 'react';
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

// Définition des couleurs par jeu
const GAME_COLORS: Record<string, string> = {
  'Memory': '#FF6B6B',
  'NeuroPuzzle': '#4ECDC4',
  'WordScramble': '#FFD166',
  'MathRush': '#06D6A0',
};

const GameXpBarChart = () => {
  const { theme } = useSettings();
  const { scoreHistory } = usePlayer();
  const [animatedValues, setAnimatedValues] = useState<number[]>([]);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Agrégation des données par jeu
  const gameXpData = React.useMemo(() => {
    const gamesMap: Record<string, { totalXp: number, count: number }> = {};

    scoreHistory.forEach((item) => {
      const gameId = item.gameId;
      
      if (!gamesMap[gameId]) {
        gamesMap[gameId] = { totalXp: 0, count: 0 };
      }
      
      gamesMap[gameId].totalXp += item.score || 0;
      gamesMap[gameId].count += 1;
    });

    const data: GameXpData[] = Object.entries(gamesMap).map(([gameId, data]) => ({
      gameId,
      totalXp: data.totalXp,
      gameCount: data.count,
      color: GAME_COLORS[gameId] || theme.primary,
    }));

    return data.sort((a, b) => b.totalXp - a.totalXp);
  }, [scoreHistory, theme.primary]);

  // Initialiser et animer les valeurs
  useEffect(() => {
    if (gameXpData.length === 0) {
      setAnimatedValues([]);
      return;
    }

    // Démarre toutes les valeurs à 0
    setAnimatedValues(gameXpData.map(() => 0));
    
    // Si première fois ou données changées significativement
    if (!hasAnimated) {
      // Anime chaque barre avec un délai en cascade
      gameXpData.forEach((game, index) => {
        setTimeout(() => {
          setAnimatedValues(prev => {
            const newValues = [...prev];
            newValues[index] = game.totalXp;
            return newValues;
          });
        }, index * 200); // Délai de 200ms entre chaque barre
      });

      // Marque comme animé
      setTimeout(() => {
        setHasAnimated(true);
      }, gameXpData.length * 200 + 500);
    } else {
      // Si déjà animé, met directement les valeurs finales
      setAnimatedValues(gameXpData.map(g => g.totalXp));
    }
  }, [gameXpData]);

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

  // Utilise les valeurs animées pour le graphique
  const currentData = hasAnimated 
    ? gameXpData.map(g => g.totalXp)  // Après animation: valeurs finales
    : animatedValues;                  // Pendant animation: valeurs qui montent

  // Préparation des données pour le BarChart
  const chartData = {
    labels: gameXpData.map(g => g.gameId),
    datasets: [
      {
        data: currentData,
        colors: gameXpData.map((g, index) => (opacity = 1) => {
          // Pendant l'animation, on peut rendre la couleur un peu plus claire
          const isAnimating = !hasAnimated && animatedValues[index] < g.totalXp;
          return isAnimating ? `${g.color}DD` : g.color;
        }),
      },
    ],
  };

  // Trouver le jeu le plus et moins joué
  const mostPlayed = gameXpData[0];
  const leastPlayed = gameXpData.length > 1 ? gameXpData[gameXpData.length - 1] : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        📊 XP par Jeu (Tous Niveaux)
      </Text>
      
      {/* SEULEMENT LE GRAPHIQUE EST ANIMÉ */}
      <BarChart
        data={chartData}
        width={width - 55}
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
          propsForLabels: {
            fontSize: 10,
          },
        }}
        style={styles.chart}
        verticalLabelRotation={-0} //important
      />

      {/* LES TEXTS EN DESSOUS RESTENT STATIQUES */}
      <View style={styles.insightsContainer}>
        <View style={styles.insightRow}>
          <View style={[styles.colorDot, { backgroundColor: mostPlayed.color }]} />
          <Text style={[styles.insightText, { color: theme.text }]}>
            <Text style={{ fontWeight: 'bold' }}>Max XP</Text> : {mostPlayed.gameId} 
            ({mostPlayed.totalXp.toLocaleString()} XP - {mostPlayed.gameCount} parties)
          </Text>
        </View>
        
        {leastPlayed && (
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