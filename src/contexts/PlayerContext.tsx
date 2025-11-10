// src/contexts/PlayerContext.tsx vie xp regeneration
import React, { createContext, useState, useEffect, useRef } from 'react';
import StorageService from '../services/StorageService';
import { GAME_CONFIG } from '../constants/config';
import { Alert } from 'react-native';

// Structure d'une "tâche" de régénération de vie
interface LifeRegenJob {
  id: number; // timestamp
  startTime: number;
  endTime: number;
}

type PlayerContextType = {
  lives: number;
  xp: number;
  regenJobs: LifeRegenJob[];
  spendLife: () => void;
  addXP: (amount: number) => void;
  spendXP: (amount: number) => boolean;
  addLives: (amount: number) => void;
  rechargeLivesWithGame: () => void;
  isRecharging: boolean;
};

export const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lives, setLives] = useState(GAME_CONFIG.MAX_LIVES);
  const [xp, setXp] = useState(0);
  const [regenJobs, setRegenJobs] = useState<LifeRegenJob[]>([]);
  const [isRecharging, setIsRecharging] = useState(false); // Pour le jeu de recharge
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Charger les données du joueur au démarrage
  useEffect(() => {
    const loadData = async () => {
      const savedLives = await StorageService.get('player:lives');
      setLives(savedLives !== null ? parseInt(savedLives, 10) : GAME_CONFIG.MAX_LIVES);
      
      const savedXp = await StorageService.get('player:xp');
      setXp(savedXp !== null ? parseInt(savedXp, 10) : 0);
      
      const savedJobs = await StorageService.get('player:regenJobs');
      setRegenJobs(savedJobs !== null ? JSON.parse(savedJobs) : []);
    };
    loadData();
  }, []);

  // Le moteur de régénération de vie
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const now = Date.now();
      let jobsUpdated = false;
      
      // Filtrer les tâches terminées et ajouter des vies
      const remainingJobs = regenJobs.filter(job => {
        if (now >= job.endTime) {
          setLives(prevLives => {
            const newLives = Math.min(GAME_CONFIG.MAX_LIVES, prevLives + 1);
            StorageService.set('player:lives', newLives.toString());
            return newLives;
          });
          jobsUpdated = true;
          return false; // Supprimer le job
        }
        return true; // Garder le job
      });
      
      if (jobsUpdated) {
        setRegenJobs(remainingJobs);
        StorageService.set('player:regenJobs', JSON.stringify(remainingJobs));
      }
      
    }, 1000); // Vérifie chaque seconde

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [regenJobs]);
  
  // Dépenser une vie
  const spendLife = () => {
    if (lives <= 0) return; // Ne devrait pas arriver
    
    const newLives = lives - 1;
    setLives(newLives);
    StorageService.set('player:lives', newLives.toString());
    
    // Ajouter une tâche de régénération si on n'est pas déjà plein
    if (lives < GAME_CONFIG.MAX_LIVES) {
      const now = Date.now();
      const lastJobEndTime = regenJobs.length > 0 ? regenJobs[regenJobs.length - 1].endTime : now;
      
      const newJob: LifeRegenJob = {
        id: now,
        startTime: lastJobEndTime,
        endTime: lastJobEndTime + (GAME_CONFIG.LIFE_REGEN_MINUTES * 60 * 1000),
      };
      
      const newJobs = [...regenJobs, newJob];
      setRegenJobs(newJobs);
      StorageService.set('player:regenJobs', JSON.stringify(newJobs));
    }
  };

  // Ajouter des vies (via boutique ou recharge)
  const addLives = (amount: number) => {
    const newLives = Math.min(GAME_CONFIG.MAX_LIVES, lives + amount);
    setLives(newLives);
    StorageService.set('player:lives', newLives.toString());
    
    // Si on ajoute des vies, on doit annuler les tâches de régénération
    // On annule les X dernières tâches, X étant le nb de vies ajoutées
    const jobsToKeep = regenJobs.slice(0, -amount);
    setRegenJobs(jobsToKeep);
    StorageService.set('player:regenJobs', JSON.stringify(jobsToKeep));
  };
  
  // Gagner de l'XP
  const addXP = (amount: number) => {
    const newXp = xp + amount;
    setXp(newXp);
    StorageService.set('player:xp', newXp.toString());
  };
  
  // Dépenser de l'XP (pour la boutique)
  const spendXP = (amount: number): boolean => {
    if (xp >= amount) {
      const newXp = xp - amount;
      setXp(newXp);
      StorageService.set('player:xp', newXp.toString());
      return true; // Achat réussi
    }
    return false; // Pas assez d'XP
  };
  
  // Logique de recharge (simulée ici)
  const rechargeLivesWithGame = () => {
    setIsRecharging(true);
    Alert.alert(
      "Jeu de Recharge",
      "Un jeu aléatoire (Niveau Moyen) se lance... (Simulation)",
      [
        {
          text: "J'ai gagné !",
          onPress: () => {
            // L'utilisateur gagne, on remplit les vies
            addLives(GAME_CONFIG.MAX_LIVES - lives); // Ajoute la différence
            setIsRecharging(false);
          },
        },
        {
          text: "J'ai perdu",
          onPress: () => setIsRecharging(false), // L'utilisateur perd, rien ne se passe
        },
      ]
    );
    // TODO: Naviguer vers un jeu aléatoire
    // navigation.navigate('GameStack', { screen: 'RandomGame', difficulty: 'medium' })
  };

  return (
    <PlayerContext.Provider
      value={{
        lives,
        xp,
        regenJobs,
        spendLife,
        addXP,
        spendXP,
        addLives,
        rechargeLivesWithGame,
        isRecharging,
      }}>
      {children}
    </PlayerContext.Provider>
  );
};