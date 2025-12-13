// src/screens/ProfileScreen.tsx

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Switch, 
  TouchableOpacity, 
  ScrollView,
  Animated,
  Dimensions,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSettings } from '../hooks/useSettings';
import StorageService from '../services/StorageService';
import { usePlayer } from '../hooks/usePlayer';
import CustomAlert from '../components/CustomAlert';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const { theme, isDarkMode, toggleTheme, isSoundEnabled, toggleSound, fontSize, setFontSize ,isVibrationEnabled,toggleVibration} = useSettings();
  const { xp, lives, } = usePlayer();
  
  const [resetAlertVisible, setResetAlertVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(isSoundEnabled);
  const [vibrationEnabled, setVibrationEnabled] = useState(isVibrationEnabled); // NOUVEAU: État local pour la vibration
  
  // Animations
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Synchronisation du son avec le contexte global
  useEffect(() => {
    setSoundEnabled(isSoundEnabled);
  }, [isSoundEnabled]);

  const handleSoundToggle = (value: boolean) => {
    setSoundEnabled(value);
    toggleSound();
    
    // Ici vous pouvez ajouter la logique pour couper/activer les sons
    // Par exemple : SoundManager.setGlobalVolume(value ? 1 : 0);
    console.log(`Sons ${value ? 'activés' : 'désactivés'}`);
  };

  // NOUVELLE FONCTION : Gérer le toggle de la vibration
  const handleVibrationToggle = (value: boolean) => {
    setVibrationEnabled(value);
    toggleVibration();
    console.log(`Vibrations ${value ? 'activées' : 'désactivées'}`);
  };

  const handleResetConfirmation = () => {
    setResetAlertVisible(true);
  };

  const resetAllData = () => {
    StorageService.clearAll();
    setResetAlertVisible(false);
    
    // Redémarrer l'app ou recharger les contextes
    // Pour l'instant on montre une alerte
    setTimeout(() => {
      Alert.alert(
        "Réinitialisation Terminée", 
        "Toutes les données ont été effacées. L'application va se rafraîchir.",
        [{ text: "OK", onPress: () => console.log("Redémarrage de l'app") }]
      );
    }, 500);
  };

  // Calcul de la progression du niveau (exemple)
 // const xpForNextLevel = level * 1000; // Exemple de calcul
 // const xpProgress = (xp / xpForNextLevel) * 100;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* En-tête du profil avec dégradé */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={['#4361EE', '#3A0CA3']}
            style={styles.profileHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.avatarContainer}>
              <MaterialCommunityIcons name="account" size={60} color="#FFFFFF" />
            </View>
            <Text style={styles.playerName}>Joueur</Text>
        
          </LinearGradient>
        </Animated.View>

        {/* Statistiques du joueur */}
        <Animated.View 
          style={[
            styles.statsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.statsGrid}>
            {/* XP */}
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#4CC9F0', '#4361EE']}
                style={styles.statIconContainer}
              >
                <MaterialCommunityIcons name="trophy" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.statValue}>{xp.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Points d'XP</Text>
            </View>

            {/* Vies */}
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#F72585', '#B5179E']}
                style={styles.statIconContainer}
              >
                <MaterialCommunityIcons name="heart" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.statValue}>{lives}</Text>
              <Text style={styles.statLabel}>Vies</Text>
            </View>

          </View>

        </Animated.View>

        {/* Paramètres */}
        <Animated.View 
          style={[
            styles.settingsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            ⚙️ Paramètres
          </Text>

          {/* Mode Sombre */}
          <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons 
                name={isDarkMode ? "weather-night" : "weather-sunny"} 
                size={24} 
                color={isDarkMode ? "#BB86FC" : "#FFB74D"} 
              />
              <View style={styles.settingTexts}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Mode Sombre
                </Text>
                <Text style={[styles.settingDescription, { color: theme.secondary }]}>
                  {isDarkMode ? "Activé" : "Désactivé"}
                </Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: '#767577', true: '#BB86FC' }}
              thumbColor={isDarkMode ? '#FFFFFF' : '#F4F3F4'}
              onValueChange={toggleTheme}
              value={isDarkMode}
            />
          </View>

          {/* Sons */}
          <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons 
                name={soundEnabled ? "volume-high" : "volume-off"} 
                size={24} 
                color={soundEnabled ? "#4CAF50" : "#F44336"} 
              />
              <View style={styles.settingTexts}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Sons de l'application
                </Text>
                <Text style={[styles.settingDescription, { color: theme.secondary }]}>
                  {soundEnabled ? "Activés" : "Désactivés"}
                </Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={soundEnabled ? '#FFFFFF' : '#F4F3F4'}
              onValueChange={handleSoundToggle}
              value={soundEnabled}
            />
          </View>

          {/* NOUVEAU PARAMÈTRE : VIBRATIONS */}
          <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons 
                name={vibrationEnabled ? "vibrate" : "vibrate-off"} 
                size={24} 
                color={vibrationEnabled ? theme.error : theme.secondary} // Couleur pour la vibration
              />
              <View style={styles.settingTexts}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Vibrations (Haptique)
                </Text>
                <Text style={[styles.settingDescription, { color: theme.secondary }]}>
                  {vibrationEnabled ? "Activées" : "Désactivées"}
                </Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: '#767577', true: theme.error }}
              thumbColor={vibrationEnabled ?  '#FFFFFF' : '#F4F3F4'}
              onValueChange={handleVibrationToggle}
              value={vibrationEnabled}
            />
          </View>

          {/* Taille de police */}
          {/* <View style={[styles.settingCard, { backgroundColor: theme.card }]}>
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons 
                name="format-size" 
                size={24} 
                color={theme.primary} 
              />
              <View style={styles.settingTexts}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Taille de police
                </Text>
                <Text style={[styles.settingDescription, { color: theme.secondary }]}>
                  Ajustez la taille du texte
                </Text>
              </View>
            </View>
            <View style={styles.fontSizeControls}>
              <TouchableOpacity 
                style={[styles.fontSizeButton, { backgroundColor: theme.primary }]}
                onPress={() => setFontSize(Math.max(12, fontSize - 1))}
              >
                <MaterialCommunityIcons name="minus" size={16} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={[styles.fontSizeValue, { color: theme.text }]}>
                {fontSize}px
              </Text>
              <TouchableOpacity 
                style={[styles.fontSizeButton, { backgroundColor: theme.primary }]}
                onPress={() => setFontSize(Math.min(24, fontSize + 1))}
              >
                <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View> */}
        </Animated.View>

        {/* Bouton de réinitialisation */}
        <Animated.View 
          style={[
            styles.resetSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={handleResetConfirmation}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF4757']}
              style={styles.resetButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="alert-circle" size={20} color="#FFFFFF" />
              <Text style={styles.resetButtonText}>
                Réinitialiser Toutes les Données
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <Text style={[styles.resetWarning, { color: theme.secondary }]}>
            ⚠️ Cette action est irréversible
          </Text>
          
        </Animated.View>
       
      </ScrollView>

      {/* Alert de confirmation pour la réinitialisation */}
      <CustomAlert
        visible={resetAlertVisible}
        title="⚠️ Réinitialisation"
        message="Êtes-vous sûr de vouloir supprimer TOUTES vos données ? Cette action est irréversible et effacera votre progression, vos scores et vos paramètres."
        type="error"
        buttons={[
          {
            text: "Annuler",
            onPress: () => setResetAlertVisible(false),
            style: 'cancel'
          },
          {
            text: "Tout Supprimer",
            onPress: resetAllData,
            style: 'destructive',
            textColor: '#FF4757'
          }
        ]}
        onClose={() => setResetAlertVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 20,
  },
  profileHeader: {
    padding: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 15,
    borderRadius: 50,
    marginBottom: 15,
  },
  playerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  playerLevel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  statIconContainer: {
    padding: 12,
    borderRadius: 15,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
  },
  settingsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    marginLeft: 5,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTexts: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fontSizeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontSizeValue: {
    marginHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
  resetSection: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  resetButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  resetButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resetWarning: {
    fontSize: 12,
    textAlign: 'center',
  },
  
});

export default ProfileScreen;