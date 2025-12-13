import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useSettings } from '../../hooks/useSettings';
import { usePlayer } from '../../hooks/usePlayer';

const { width } = Dimensions.get('window');

// Fonction pour obtenir les 7 derniers jours (dynamiques)
const getLast7Days = () => {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const today = new Date();
  const result = [];
  
  // Générer les 7 derniers jours
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dayIndex = date.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
    result.push({
      label: days[dayIndex],
      date: date.toDateString(),
      dateObj: new Date(date.getFullYear(), date.getMonth(), date.getDate()), // Sans heures
    });
  }
  
  return result;
};

// Fonction pour formater une date sans heures
const formatDateWithoutTime = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const WeeklyXpTrendChart = () => {
  const { theme } = useSettings();
  const { scoreHistory } = usePlayer();

  // Obtenir les 7 derniers jours dynamiques
  const last7Days = useMemo(() => getLast7Days(), []);

  // Agrégation des données par jour
  const dailyXpData = useMemo(() => {
    // Initialiser avec 0 XP pour chaque jour
    const dailyMap: { [key: string]: number } = {};
    last7Days.forEach(day => {
      const dateKey = day.dateObj.toISOString().split('T')[0];
      dailyMap[dateKey] = 0;
    });

    // Parcourir l'historique et accumuler l'XP par jour
    scoreHistory.forEach((item) => {
      const gameDate = new Date(item.date);
      const dateKey = formatDateWithoutTime(gameDate).toISOString().split('T')[0];
      
      // Vérifier si cette date est dans les 7 derniers jours
      if (dailyMap[dateKey] !== undefined) {
        dailyMap[dateKey] += item.score || 0;
      }
    });

    // Convertir en tableau dans l'ordre des jours
    return last7Days.map(day => {
      const dateKey = day.dateObj.toISOString().split('T')[0];
      return dailyMap[dateKey] || 0;
    });
  }, [scoreHistory, last7Days]);

  // Trouver le jour avec le plus d'XP et le moins d'XP
  const maxXpDay = useMemo(() => {
    let maxIndex = 0;
    let maxValue = 0;
    
    dailyXpData.forEach((value, index) => {
      if (value > maxValue) {
        maxValue = value;
        maxIndex = index;
      }
    });
    
    return {
      day: last7Days[maxIndex].label,
      xp: maxValue,
      date: last7Days[maxIndex].date,
    };
  }, [dailyXpData, last7Days]);

  const minXpDay = useMemo(() => {
    // Filtrer les jours avec 0 XP pour ne pas toujours montrer "0"
    const nonZeroDays = dailyXpData.map((xp, index) => ({ xp, index }))
      .filter(day => day.xp > 0);
    
    if (nonZeroDays.length === 0) {
      return {
        day: last7Days[dailyXpData.length - 1].label,
        xp: 0,
        date: last7Days[dailyXpData.length - 1].date,
      };
    }
    
    let minIndex = nonZeroDays[0].index;
    let minValue = nonZeroDays[0].xp;
    
    nonZeroDays.forEach(day => {
      if (day.xp < minValue) {
        minValue = day.xp;
        minIndex = day.index;
      }
    });
    
    return {
      day: last7Days[minIndex].label,
      xp: minValue,
      date: last7Days[minIndex].date,
    };
  }, [dailyXpData, last7Days]);

  // Calculer le total de la semaine
  const weeklyTotal = dailyXpData.reduce((sum, xp) => sum + xp, 0);

  // Si pas assez de données (tous les jours à 0)
  const hasData = dailyXpData.some(xp => xp > 0);

  if (!hasData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.card }]}>
        <Text style={[styles.title, { color: theme.text }]}>
          📈 Progression Hebdomadaire
        </Text>
        <View style={styles.emptyState}>
          <Text style={{ color: theme.secondary, textAlign: 'center' }}>
            Jouez cette semaine pour voir votre progression !
          </Text>
          <Text style={{ color: theme.secondary, fontSize: 12, marginTop: 5 }}>
            Semaine du {last7Days[0].date} au {last7Days[6].date}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          📈 Progression Hebdomadaire
        </Text>
        <Text style={[styles.subtitle, { color: theme.secondary }]}>
          Total: {weeklyTotal.toLocaleString()} XP
        </Text>
      </View>
      
      <LineChart
        data={{
          labels: last7Days.map(day => day.label),
          datasets: [
            {
              data: dailyXpData,
              color: (opacity = 1) => theme.primary,
              strokeWidth: 3,
            },
          ],
        }}
        width={width - 55}
        height={200}
        yAxisLabel=""
        yAxisSuffix=" XP"
        fromZero
        chartConfig={{
          backgroundColor: theme.card,
          backgroundGradientFrom: theme.card,
          backgroundGradientTo: theme.card,
          decimalPlaces: 0,
          color: (opacity = 1) => theme.secondary,
          labelColor: (opacity = 1) => theme.text,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: "5",
            strokeWidth: "2",
            stroke: theme.accent,
          },
          propsForBackgroundLines: {
            strokeWidth: 0.5,
            stroke: theme.secondary + '30',
          },
          propsForLabels: {
            fontSize: 10,
          },
        }}
        bezier
        style={styles.chart}
      />

      {/* Insights sur les jours */}
      <View style={styles.insightsContainer}>
        <View style={styles.insightRow}>
          <View style={[styles.insightIcon, { backgroundColor: theme.success + '30' }]}>
            <Text style={{ color: theme.success, fontSize: 16 }}>🔥</Text>
          </View>
          <View style={styles.insightTextContainer}>
            <Text style={[styles.insightLabel, { color: theme.secondary }]}>
              Jour le plus actif
            </Text>
            <Text style={[styles.insightValue, { color: theme.text }]}>
              {maxXpDay.day} ({maxXpDay.xp.toLocaleString()} XP)
            </Text>
          </View>
        </View>
        
        <View style={styles.insightRow}>
          <View style={[styles.insightIcon, { backgroundColor: theme.secondary + '30' }]}>
            <Text style={{ color: theme.secondary, fontSize: 16 }}>📊</Text>
          </View>
          <View style={styles.insightTextContainer}>
            <Text style={[styles.insightLabel, { color: theme.secondary }]}>
              Moins actif
            </Text>
            <Text style={[styles.insightValue, { color: theme.text }]}>
              {minXpDay.day} ({minXpDay.xp.toLocaleString()} XP)
            </Text>
          </View>
        </View>

        <View style={styles.periodInfo}>
          {/* <Text style={[styles.periodText, { color: theme.secondary }]}>
            📅 Semaine du {last7Days[0].date} au {last7Days[6].date}
          </Text> */}
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
  },
  chart: {
    borderRadius: 8,
    marginVertical: 5,
  },
  emptyState: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  insightsContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightTextContainer: {
    flex: 1,
  },
  insightLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  periodInfo: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  periodText: {
    fontSize: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default WeeklyXpTrendChart;