// src/screens/ProfileScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Switch, Button } from 'react-native';
import { useSettings } from '../hooks/useSettings';
import StorageService from '../services/StorageService';
import { usePlayer } from '../hooks/usePlayer';

const ProfileScreen = () => {
  const { theme, isDarkMode, toggleTheme, isSoundEnabled, toggleSound, fontSize, setFontSize } = useSettings();
  const { xp, lives } = usePlayer();

  const resetAllData = () => {
    StorageService.clearAll();
    // Idéalement, redémarrer l'app ou recharger les contextes
    alert("Données réinitialisées. Veuillez redémarrer l'application.");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Profil & Paramètres</Text>

      <View style={styles.statBox}>
        <Text style={[styles.stat, { color: theme.text }]}>Vies: {lives}</Text>
        <Text style={[styles.stat, { color: theme.text }]}>XP: {xp}</Text>
      </View>

      <View style={styles.settingRow}>
        <Text style={[styles.label, { color: theme.text, fontSize: fontSize }]}>Mode Sombre</Text>
        <Switch
          trackColor={{ false: theme.text, true: theme.primary }}
          thumbColor={theme.card}
          onValueChange={toggleTheme}
          value={isDarkMode}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={[styles.label, { color: theme.text, fontSize: fontSize }]}>Sons Actifs</Text>
        <Switch
          trackColor={{ false: theme.text, true: theme.primary }}
          thumbColor={theme.card}
          onValueChange={toggleSound}
          value={isSoundEnabled}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={[styles.label, { color: theme.text, fontSize: fontSize }]}>Taille Police</Text>
        <View style={styles.fontControl}>
          <Button title="-" onPress={() => setFontSize(fontSize - 1)} color={theme.primary} />
          <Text style={[styles.fontSizeText, { color: theme.text }]}>{fontSize}</Text>
          <Button title="+" onPress={() => setFontSize(fontSize + 1)} color={theme.primary} />
        </View>
      </View>

      <Button title="Réinitialiser toutes les données" color={theme.error} onPress={resetAllData} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  statBox: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  stat: { fontSize: 18 },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#555',
  },
  label: { fontSize: 16 },
  fontControl: { flexDirection: 'row', alignItems: 'center' },
  fontSizeText: { marginHorizontal: 15, fontSize: 16 },
});

export default ProfileScreen;