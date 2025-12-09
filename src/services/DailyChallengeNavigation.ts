// src/services/DailyChallengeNavigation.ts
import { NavigationProp } from '@react-navigation/native';
import { MainTabsParamList, GameStackParamList } from '../navigation/types';

class DailyChallengeNavigation {
  private static instance: DailyChallengeNavigation;
  private currentChallenge: any = null;

  static getInstance(): DailyChallengeNavigation {
    if (!DailyChallengeNavigation.instance) {
      DailyChallengeNavigation.instance = new DailyChallengeNavigation();
    }
    return DailyChallengeNavigation.instance;
  }

  setCurrentChallenge(challenge: any) {
    this.currentChallenge = {
      ...challenge,
      launchedAt: Date.now()
    };
  }

  getCurrentChallenge() {
    return this.currentChallenge;
  }

  clearChallenge() {
    this.currentChallenge = null;
  }

  // ⭐⭐⭐ CORRECTION : Utiliser navigate au lieu de replace pour les tabs ⭐⭐⭐
  launchChallenge(
    navigation: NavigationProp<any>,
    challenge: any
  ) {
    this.setCurrentChallenge(challenge);
    
    // Pour les défis quotidiens, nous naviguons vers l'onglet Games d'abord
    // Puis vers le jeu spécifique
    navigation.navigate('Games', {
      screen: challenge.gameId,
      params: {
        difficulty: challenge.difficulty,
        level: challenge.targetLevel,
        isDailyChallenge: true
      }
    });
  }

  // Méthode pour quitter un défi
  exitChallenge(
    navigation: NavigationProp<any>
  ) {
    // 1. Nettoyer le défi courant
    this.clearChallenge();
    
    // 2. Obtenir la navigation parent (MainTabs)
    const parentNavigation = navigation.getParent();
    
    if (parentNavigation) {
      // 3. Naviguer vers l'onglet DailyChallenge
      parentNavigation.navigate('DailyChallenge');
      
      // 4. Nettoyer la pile GameStack après un délai
      setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.popToTop();
        }
      }, 100);
    } else {
      // Fallback : navigation simple
      navigation.popToTop();
    }
  }
}

//export default DailyChallengeNavigation.getInstance();


// ⭐⭐⭐ CORRECTION : Exportez l'instance directement ⭐⭐⭐
const dailyChallengeNavigationInstance = new DailyChallengeNavigation();

export default dailyChallengeNavigationInstance; // Exportez l'instance pas la class