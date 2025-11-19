// src/hooks/useSound.ts

import { useState, useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics'; // API de vibration
import { useSettings } from './useSettings';

// Mapping des événements aux chemins des fichiers audio
// Assurez-vous que les chemins sont corrects pour votre structure (ici relative aux assets)
const soundMap: { [key: string]: any } = {
    click: require('../../assets/sounds/click.wav'),
    error: require('../../assets/sounds/error.wav'),
    lose: require('../../assets/sounds/lose.wav'),
    success: require('../../assets/sounds/success.wav'),
    win: require('../../assets/sounds/win.wav'),
};

type SoundEvent = 'click' | 'error' | 'lose' | 'success' | 'win';

export const useSound = () => {
    const { isSoundEnabled, isVibrationEnabled } = useSettings();

    // Ref pour stocker les objets Audio chargés
    const soundRefs = useRef<{ [key: string]: Audio.Sound | null }>({});
    // Nouveau statut pour vérifier que le chargement est terminé
    const [isLoaded, setIsLoaded] = useState(false);

    // 1. Chargement des sons au montage
    useEffect(() => {
        const loadSounds = async () => {
            console.log("--- AUDIO DIAGNOSTIC: Démarrage du chargement des sons ---");
            try {
                // Configuration initiale de la catégorie audio
                await Audio.setAudioModeAsync({
                    allowsRecording: false,
                    // interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX, 
                    // interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
                    // interruptionModeAndroid: 2,
                    // interruptionModeIOS: 1,
                    playsInSilentModeIOS: true, // Pour jouer même en mode silencieux
                    shouldDuckAndroid: true, // option supplémentaire pour un meilleur comportement
                });
                console.log("AUDIO DIAGNOSTIC: Audio mode configuré.");
                let loadError = false;
                for (const event in soundMap) {
                    try {
                        const { sound } = await Audio.Sound.createAsync(
                            soundMap[event],
                            { shouldPlay: false }
                        );
                        console.log(`AUDIO DIAGNOSTIC: Son '${event}' chargé avec succès.`);
                        soundRefs.current[event] = sound;
                    } catch (e) {
                        console.error(`Erreur de chargement du son ${event}:`, e);
                        loadError = true;
                    }
                }
                if (!loadError) {
                    setIsLoaded(true);
                    console.log("--- AUDIO DIAGNOSTIC: Tous les sons chargés. isLoaded = true. ---");
                }
            } catch (e) {
                console.error("AUDIO DIAGNOSTIC: Erreur critique lors de la configuration audio ou du chargement.", e);
            }

        };

        loadSounds();

        // 2. Déchargement des sons au démontage
        return () => {
            console.log("AUDIO DIAGNOSTIC: Déchargement des sons.");
            for (const event in soundRefs.current) {
                soundRefs.current[event]?.unloadAsync();
            }
        };
    }, []); // Exécuté une seule fois

    // 3. Fonction pour jouer un son (appelée par les jeux)
    const playSound = useCallback((event: SoundEvent) => {
        console.log(`AUDIO DIAGNOSTIC: Tentative de jouer le son '${event}'.`);
        if (!isSoundEnabled) return;

        const soundObject = soundRefs.current[event];
        if (soundObject) {
            soundObject.getStatusAsync().then(status => {
                if (status.isLoaded) {
                    // Si déjà en cours, arrêtez et rejouez (pour les clics rapides)
                    if (status.isPlaying) {
                        soundObject.stopAsync().then(() => {
                            soundObject.playFromPositionAsync(0);
                        });
                    } else {
                        soundObject.playFromPositionAsync(0);
                    }
                }
            });
        }
    }, [isSoundEnabled]);

    // 4. Fonction pour vibrer (appelée par les jeux)
    const vibrate = useCallback((type: 'success' | 'warning' | 'error' | 'default' = 'default') => {
        if (!isVibrationEnabled) return;

        // Pour une meilleure expérience, utilisez l'API Haptics si disponible
        try {
            if (type === 'success' && Haptics.impactAsync) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else if (type === 'error' && Haptics.impactAsync) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            } else if (type === 'warning' && Haptics.impactAsync) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } else {
                // Utilisation de l'API standard pour les autres cas
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        } catch (e) {
            console.warn("Haptics API not available or failed:", e);
        }

    }, [isVibrationEnabled]);

    return { playSound, vibrate };
};