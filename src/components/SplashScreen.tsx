// src/screens/SplashScreen.tsx

import React, { useEffect, useRef, useState, FC } from 'react';
import { View, Text, StyleSheet, Animated, Image, SafeAreaView, Dimensions, Easing } from 'react-native';
import * as SplashScreenNative from 'expo-splash-screen';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

// Supposons que vous ayez un hook useSettings qui fournit le thème
import { useSettings } from '../hooks/useSettings';
import { AppTheme } from '../constants/theme'; // Assurez-vous d'avoir ce type
import { MaterialCommunityIcons } from '@expo/vector-icons';
// Assurez-vous d'avoir un type pour votre pile de navigation (RootStackParamList)
type RootStackParamList = {
    Splash: undefined;
    Main: undefined; // La destination finale
    // ... autres routes
};

type NavigationProps = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

// 1. Empêcher l'automasquage du splash natif au démarrage
SplashScreenNative.preventAutoHideAsync();

const { width } = Dimensions.get('window');

const FAKE_LOADING_DURATION = 3500; // Durée de l'animation de progression (3.5s)
const FADE_OUT_DURATION = 500;      // Durée du fade out de l'écran (0.5s)

const SplashScreen: FC = () => {
    const { theme } = useSettings();
    const navigation = useNavigation<NavigationProps>();

    // Valeurs animées
    const progressAnim = useRef(new Animated.Value(0)).current; // Pour la barre (0 -> 100)
    const fadeAnim = useRef(new Animated.Value(1)).current;     // Pour l'opacité de l'écran (1 -> 0)
    const textGlow = useRef(new Animated.Value(0)).current;

    const [progressText, setProgressText] = useState(0); // Affichage du pourcentage

    // Calcule la largeur de la barre en fonction du progrès de l'animation
    const progressBarWidth = progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    // Effet de lueur animée
    const glowInterpolation = textGlow.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ['0 0 0px rgba(67, 97, 238, 0)', '0 0 20px rgba(67, 97, 238, 0.5)', '0 0 5px rgba(67, 97, 238, 0.2)']
    });

    // 2. Logique de l'animation et de la navigation
    useEffect(() => {
        const startLoading = async () => {
            //  console.log("SPLASH: Démarrage de l'animation de chargement.");
            // Étape 1: Animer la barre de progression
            Animated.timing(progressAnim, {
                toValue: 100,
                duration: FAKE_LOADING_DURATION,
                easing: Easing.ease,
                useNativeDriver: false, // width/pourcentage nécessite useNativeDriver: false
            }).start(() => {
                // console.log("SPLASH: Progression terminée (100%).");
                handleLoadingComplete();
            });

            // Mettre à jour le texte du pourcentage (simulé)
            const interval = setInterval(() => {
                setProgressText(prev => {
                    if (prev < 100) {
                        // Estimation du progrès basée sur le temps écoulé
                        const elapsedTime = Date.now() - startTime;
                        const calculatedProgress = Math.min(100, Math.floor((elapsedTime / FAKE_LOADING_DURATION) * 100));
                        return calculatedProgress;
                    }
                    clearInterval(interval);
                    return 100;
                });
            }, 100);

            const startTime = Date.now();
        };

        const handleLoadingComplete = async () => {
            // Optionnel: Ajouter une vibration subtile à 100%
            try {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch (e) {
                console.warn("Haptics non disponible ou erreur:", e);
            }

            // Étape 2: Fade out de l'écran personnalisé
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: FADE_OUT_DURATION,
                easing: Easing.linear,
                useNativeDriver: true,
            }).start(async () => {
                // console.log("SPLASH: Fade out terminé. Masquage du splash natif et navigation.");

                // Étape 3: Masquer le splash screen natif d'Expo
                await SplashScreenNative.hideAsync();

                // Étape 4: Naviguer vers l'écran principal
                navigation.replace('Main');
            });
        };

        startLoading();

        // Nettoyage: stopper l'intervalle si le composant est démonté prématurément
        return () => {
            progressAnim.stopAnimation();
        };
    }, [navigation, theme]); // Dépendances importantes

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
            <Animated.View style={[styles.container, { opacity: fadeAnim }]}>

                {/* LOGO */}
                <Image
                    source={require('../../assets/images/splash.png')} // ASSUREZ-VOUS DU CHEMIN
                    style={[styles.logo,]} // TintColor pour l'adapter au thème (si le logo est monochrome)
                    resizeMode="cover"
                />

                {/* Titre avec effet de lueur */}
                <Animated.View style={[styles.titleContainer, { shadowRadius: glowInterpolation }]}>
                    <Text style={styles.mainTitle}>SMART GAME</Text>
                    <Text style={styles.subTitle}>L'intelligence en jeu</Text>
                </Animated.View>

                {/* BARRE DE PROGRESSION */}
                <View style={styles.loadingArea}>

                    {/* Conteneur de la barre */}
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

                    {/* Texte de chargement */}
                    <Text style={[styles.loadingText, { color: theme.text, fontSize: 16 }]}>
                        Chargement de Smart Game... ({progressText}%)
                    </Text>
                </View>

                {/* Footer avec informations */}
                <View style={styles.footer}>
                    <View style={styles.featureIcons}>
                        <MaterialCommunityIcons name="brain" size={20} color="#000" style={styles.featureIcon} />
                        <MaterialCommunityIcons name="puzzle" size={20} color="#000" style={styles.featureIcon} />
                        <MaterialCommunityIcons name="trophy" size={20} color="#000" style={styles.featureIcon} />
                        <MaterialCommunityIcons name="rocket" size={20} color="#000" style={styles.featureIcon} />
                    </View>
                    <Text style={styles.versionText}>Version 1.0.0 • Prêt pour l'aventure</Text>
                </View>

            </Animated.View>
        </SafeAreaView>
    );
};

// 3. Styles
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
        width: 250,
        height: 250,
        marginBottom: 50,
        borderRadius: 50,
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: 50,
        shadowColor: '#4361EE',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
    },
    mainTitle: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#333',
        letterSpacing: 2,
        textShadowColor: '#777',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
        marginBottom: 8,
    },
    subTitle: {
        fontSize: 16,
        color: '#333',
        letterSpacing: 1,
        fontStyle: 'italic',
    },
    loadingArea: {
        width: '100%',
        alignItems: 'center',
    },
    progressBarContainer: {
        width: '80%', // Limiter la barre à 80% de la largeur
        height: 6, // Rendu un peu plus visible
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 10,
    },
    progressBar: {
        height: '100%',
        borderRadius: 3,
    },
    loadingText: {
        fontWeight: 'bold',
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        alignItems: 'center',
    },
    featureIcons: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    featureIcon: {
        marginHorizontal: 10,
        opacity: 0.8,
    },
    versionText: {
        //  color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 12,
        textAlign: 'center',
    },
});

export default SplashScreen;