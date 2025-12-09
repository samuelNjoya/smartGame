// src/hooks/useDailyChallenge.ts
import { useEffect } from 'react';
import { useRoute } from '@react-navigation/native';
import DailyChallengeService from '../services/DailyChallengeService';

export const useDailyChallenge = () => {
  const route = useRoute();
  
  useEffect(() => {
    const checkChallenge = async () => {
      const { isDailyChallenge } = route.params || {};
      
      if (isDailyChallenge) {
        // Vérifier si le défi a déjà été joué
        const status = await DailyChallengeService.getStatus();
        
        // Si déjà joué, on pourrait prévenir l'utilisateur
        // ou empêcher de rejouer (selon votre logique)
        if (status !== 'pending') {
          // Optionnel : Afficher un message
          console.log('Défi déjà joué aujourd\'hui');
        }
      }
    };
    
    checkChallenge();
  }, [route.params]);
  
  return {
    isDailyChallenge: Boolean(route.params?.isDailyChallenge)
  };
};