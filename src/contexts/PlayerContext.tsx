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


// --- NOUVELLE STRUCTURE DE DONNÉES ---
export interface GameResult {
  id: string;
  gameId: 'Memory' | 'NeuroPuzzle' | 'MathRush' | 'WordScramble'| string; // Doit correspondre à vos GameIds  'Memory' | 'Quiz' | 'Snake' | 'NeuroPuzzle' | 'WordScramble'| 'MathRush'| 'WordGuess' | 'RandomGame';
  difficulty: 'easy' | 'medium' | 'hard' | 'master';
  level: number;
  isVictory: boolean;
  score: number;
 // stars: number;
  date: number;
  stats: {
    timeSpent: number;
    errors?: number;
    hintsUsed?: number;
    // Ajoutez ici toutes les stats importantes
  };
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
  rechargeLivesWithXP: () => void; // NOUVEAU: Pour la recharge payante
  isRecharging: boolean;
  scoreHistory: GameResult[]; // <<-- NOUVEAU
  addGameResult: (result: Omit<GameResult, 'id' | 'date'>) => void; // <<-- NOUVEAU
};

export const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// COÛT DÉDIÉ POUR LA RECHARGE COMPLÈTE EN XP
const FULL_RECHARGE_XP_COST = 450;

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lives, setLives] = useState(GAME_CONFIG.MAX_LIVES);
  const [xp, setXp] = useState(0);
  const [regenJobs, setRegenJobs] = useState<LifeRegenJob[]>([]);
  const [isRecharging, setIsRecharging] = useState(false); // Pour le jeu de recharge
  const [scoreHistory, setScoreHistory] = useState<GameResult[]>([]); // <<-- NOUVEAU

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

      // ... (Chargement lives, xp, regenJobs existants) ...
      const savedHistory = await StorageService.get('player:scoreHistory'); // <<-- NOUVEAU
      setScoreHistory(savedHistory !== null ? JSON.parse(savedHistory) : []);
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
    if (newLives < GAME_CONFIG.MAX_LIVES) { // utiliser newLives ici au lieu de lives
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

  // NOUVEAU: Recharger les vies en dépensant de l'XP (Recharge complète pour 350 XP)
  const rechargeLivesWithXP = () => {
    if (lives === GAME_CONFIG.MAX_LIVES) {
      Alert.alert("Recharge impossible", "Vos cœurs sont déjà pleins !");
      return;
    }

    if (xp < FULL_RECHARGE_XP_COST) {
      Alert.alert(
        "XP insuffisant",
        `Il vous faut ${FULL_RECHARGE_XP_COST} XP pour recharger complètement vos vies. Il vous manque ${FULL_RECHARGE_XP_COST - xp} XP.`
      );
      return;
    }

    const success = spendXP(FULL_RECHARGE_XP_COST);
    if (success) {
      const livesToRestore = GAME_CONFIG.MAX_LIVES - lives;
      addLives(livesToRestore); // Remplit complètement les vies
      Alert.alert("Recharge réussie", `Vous avez rechargé ${livesToRestore} vie(s) pour ${FULL_RECHARGE_XP_COST} XP.`);
    }
  };

  // MODIFIÉ: Logique de recharge avec Leçon/Jeu Aléatoire (ajoute +1 vie si l'utilisateur gagne)
  const rechargeLivesWithGame = () => {
    if (lives === GAME_CONFIG.MAX_LIVES) {
      Alert.alert("Recharge impossible", "Vos cœurs sont déjà pleins !");
      return;
    }

    setIsRecharging(true);
    // STIMULATION DU JEU ALÉATOIRE / LEÇON
    Alert.alert(
      "Jeu de Recharge (Leçon)",
      "Un jeu aléatoire (Niveau Moyen) se lance... (Simulation)",
      [
        {
          text: "J'ai gagné !",
          onPress: () => {
            // L'utilisateur gagne, on ajoute UNIQUEMENT une vie (+1)
            addLives(1);
            setIsRecharging(false);
            Alert.alert("Félicitations !", "Vous avez gagné 1 vie supplémentaire !");
          },
        },
        {
          text: "J'ai perdu",
          onPress: () => {
            setIsRecharging(false);
            Alert.alert("Dommage", "Vous n'avez pas réussi, réessayez plus tard.");
          },
        },
      ]
    );
    // TODO: Naviguer vers un jeu aléatoire (à faire dans le composant qui appelle cette fonction)
    // navigation.navigate('GameStack', { screen: 'RandomGame', difficulty: 'medium' })
  };

  // --- NOUVELLE FONCTION: Enregistrer un résultat de partie ---
  const addGameResult = (result: Omit<GameResult, 'id' | 'date'>) => {
    const newResult: GameResult = {
      ...result,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9), // ID simple mais unique
      date: Date.now(),
    };

    // Le nouvel historique inclut le dernier résultat en tête (pour tri par défaut)
    const newHistory = [newResult, ...scoreHistory];

    setScoreHistory(newHistory);
    // Sauvegarde en arrière-plan
    StorageService.set('player:scoreHistory', JSON.stringify(newHistory));
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
        rechargeLivesWithXP,     // Nouveau !
        isRecharging,
        scoreHistory,
        addGameResult,
      }}>
      {children}
    </PlayerContext.Provider>
  );
};