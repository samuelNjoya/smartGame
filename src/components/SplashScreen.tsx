// src/screens/SplashScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { 
  View, Text, StyleSheet, Animated, Image, 
  SafeAreaView, Dimensions, Easing 
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen'; // ⭐ UN SEUL IMPORT
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSettings } from '../hooks/useSettings';

type RootStackParamList = {
  Splash: undefined;
  Main: undefined;
};

type NavigationProps = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

// Empêcher le splash natif de se cacher automatiquement
SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get('window');
const FAKE_LOADING_DURATION = 2500; // 2.5 secondes (moins long)
const FADE_OUT_DURATION = 500;

const AppSplashScreen = () => {
  const { theme } = useSettings();
  const navigation = useNavigation<NavigationProps>();

  // Animations
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current; // Commence à 0, fade in
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [progressText, setProgressText] = useState(0);

  // Largeur de la barre de progression
  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  useEffect(() => {
    let mounted = true;
    let interval: NodeJS.Timeout;

    const startSplashAnimation = async () => {
      try {
        // 1. Cache d'abord le splash natif d'Expo
        await SplashScreen.hideAsync();
        
        // 2. Fade in de notre splash personnalisé
        if (mounted) {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 600,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              tension: 60,
              friction: 8,
              useNativeDriver: true,
            }),
          ]).start();
        }

        // 3. Démarrer la barre de progression
        if (mounted) {
          Animated.timing(progressAnim, {
            toValue: 100,
            duration: FAKE_LOADING_DURATION,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }).start(({ finished }) => {
            if (finished && mounted) {
              handleLoadingComplete();
            }
          });
        }

        // 4. Mettre à jour le pourcentage texte
        const startTime = Date.now();
        interval = setInterval(() => {
          if (mounted) {
            const elapsed = Date.now() - startTime;
            const calculated = Math.min(100, Math.floor((elapsed / FAKE_LOADING_DURATION) * 100));
            setProgressText(calculated);
          }
        }, 100);

      } catch (error) {
        console.warn('Erreur splash:', error);
        if (mounted) {
          navigation.replace('Main');
        }
      }
    };

    const handleLoadingComplete = async () => {
      try {
        // Vibration subtile à 100%
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Ignore si haptics non disponible
      }

      // Fade out et navigation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: FADE_OUT_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        if (mounted) {
          navigation.replace('Main');
        }
      });
    };

    // Démarrer l'animation après un court délai
    const timer = setTimeout(() => {
      startSplashAnimation();
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (interval) clearInterval(interval);
      progressAnim.stopAnimation();
    };
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Animated.View 
        style={[
          styles.container, 
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* LOGO */}
        <Image
          source={require('../../assets/images/splash.png')}
          style={styles.logo}
          resizeMode="cover"
        />

        {/* TITRE */}
        <View style={styles.titleContainer}>
          <Text style={[styles.mainTitle, { color: theme.text }]}>
            SMART GAME
          </Text>
          <Text style={[styles.subTitle, { color: theme.secondary }]}>
            L'intelligence en jeu
          </Text>
        </View>

        {/* BARRE DE PROGRESSION */}
        <View style={styles.loadingArea}>
          {/* Conteneur barre */}
          <View style={[styles.progressBarContainer, { backgroundColor: theme.card }]}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  backgroundColor: theme.primary,
                  width: progressBarWidth
                }
              ]}
            />
          </View>

          {/* Texte pourcentage */}
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Chargement de Smart Game... {progressText}%
          </Text>
        </View>

        {/* ICÔNES ANIMÉES */}
        <View style={styles.animatedIcons}>
          {['brain', 'puzzle', 'trophy', 'rocket'].map((icon, index) => (
            <Animated.View
              key={icon}
              style={{
                opacity: progressAnim.interpolate({
                  inputRange: [index * 25, (index + 1) * 25],
                  outputRange: [0.3, 1],
                  extrapolate: 'clamp'
                }),
                transform: [{
                  scale: progressAnim.interpolate({
                    inputRange: [index * 25, (index + 1) * 25],
                    outputRange: [0.8, 1.2],
                    extrapolate: 'clamp'
                  })
                }]
              }}
            >
              <MaterialCommunityIcons
                name={icon as any}
                size={24}
                color={theme.primary}
                style={styles.featureIcon}
              />
            </Animated.View>
          ))}
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: theme.secondary }]}>
            Version 1.0.0 • Prêt pour l'aventure
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  logo: {
    // width: width * 0.6,
    // height: width * 0.6,
    width: 250,
    height: 250,
    borderRadius: 50,
    marginBottom: 30,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  loadingArea: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  progressBarContainer: {
    width: '80%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  animatedIcons: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  featureIcon: {
    marginHorizontal: 12,
    opacity: 0.8,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default AppSplashScreen;