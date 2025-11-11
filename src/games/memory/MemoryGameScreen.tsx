// src/games/memory/MemoryGameScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { useSettings } from '../../hooks/useSettings';
import { usePlayer } from '../../hooks/usePlayer';
import { GameScreenProps } from '../../navigation/types';
import { generateDeck, MemoryCardType } from './memory.logic';
import MemoryCard from './components/MemoryCard';
// NOUVEAUX IMPORTS
import GameEndModal from '../../components/modals/GameEndModal';
import { GameId } from '../../constants/gameData';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameStackParamList } from '../../navigation/types';

// Mise à jour du type de Props pour inclure le paramètre 'level'
type Props = NativeStackScreenProps<GameStackParamList, 'Memory'>;

const MemoryGameScreen = ({ route, navigation }: Props) => { // AJOUT de navigation
  // Ajout du paramètre 'level'
  const { difficulty, level } = route.params;
  const { theme } = useSettings();
  // Suppression de addXP et spendLife car gérés par initGame et GameEndModal
  const { lives } = usePlayer();

  const [deck, setDeck] = useState<MemoryCardType[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  // NOUVEL ÉTAT pour gérer la fin de partie et le modal
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false); // Pour indiquer si la partie est une victoire

  const [isChecking, setIsChecking] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Constante pour l'ID du jeu
  const GAME_ID: GameId = 'Memory';

  // Initialiser le jeu (maintenant sans dépense de vie ici)
  const initGame = () => {
    // La vérification des vies et spendLife() est faite dans LevelSelectScreen 
    // avant l'appel à cet écran. On ne vérifie pas et on ne dépense pas ici.

    setDeck(generateDeck(difficulty));
    setSelected([]);
    setMoves(0);
    setHasWon(false);
    setIsGameOver(false); // Réinitialise l'état de fin de jeu
    setIsChecking(false);
  };

  useEffect(() => {
    // Si l'utilisateur revient du modal de fin de partie via "Rejouer",
    // on doit réinitialiser le jeu. On utilise le `focus` pour gérer cela.
    const unsubscribe = navigation.addListener('focus', () => {
      // Re-vérifier si on a des vies ou si on a déjà dépensé (géré par LevelSelect)
      // Si la vie a déjà été dépensée, on relance le jeu
      initGame();
    });

    return unsubscribe;
  }, [navigation, difficulty]);

  useEffect(() => {
    // Nettoyer le timer si l'utilisateur quitte
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);


  // Logique de vérification des paires (inchangée)
  useEffect(() => {
    if (selected.length === 2) {
      setIsChecking(true);
      const [firstIndex, secondIndex] = selected;
      const card1 = deck[firstIndex];
      const card2 = deck[secondIndex];

      if (card1.icon === card2.icon) {
        setDeck(prevDeck =>
          prevDeck.map(card =>
            card.icon === card1.icon ? { ...card, isMatched: true } : card
          )
        );
        setSelected([]);
        setIsChecking(false);
      } else {
        timerRef.current = setTimeout(() => {
          setDeck(prevDeck =>
            prevDeck.map((card, index) =>
              index === firstIndex || index === secondIndex
                ? { ...card, isFlipped: false }
                : card
            )
          );
          setSelected([]);
          setIsChecking(false);
        }, 1000);
      }
      setMoves(m => m + 1);
    }
  }, [selected]);

  // Vérifier la victoire (MODIFIÉ)
  useEffect(() => {
    if (deck.length > 0 && deck.every(card => card.isMatched)) {
      // VICTOIRE !
      setHasWon(true);
      // Au lieu d'une alerte et de l'ajout d'XP, on affiche le modal
      setIsGameOver(true);
      // L'ajout d'XP et le déverrouillage sont gérés par GameEndModal
    }

    // TODO: Ajouter une logique de défaite si le temps est écoulé ou si les coups max sont dépassés
    // Dans Memory, la défaite est généralement liée au temps.

  }, [deck]);

  const handleCardPress = (index: number) => {
    if (isChecking || selected.length === 2 || deck[index].isFlipped || isGameOver) return; // AJOUT isGameOver

    // Retourner la carte
    setDeck(prevDeck =>
      prevDeck.map((card, i) =>
        i === index ? { ...card, isFlipped: true } : card
      )
    );
    setSelected(prevSelected => [...prevSelected, index]);
  };

  // Déterminer le nombre de colonnes en fonction de la difficulté (inchangé)
  const numColumns = difficulty === 'easy' ? 4 : (difficulty === 'medium' ? 4 : 4);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        Memory - Niveau {level} ({difficulty})
      </Text>
      <Text style={[styles.moves, { color: theme.text }]}>Coups: {moves}</Text>

      {/* preparation du jeux */}
      {deck.length === 0 && (
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Préparation du jeu...
        </Text>
      )}

      <FlatList
        data={deck}
        keyExtractor={item => item.id.toString()}
        numColumns={numColumns}
      //  contentContainerStyle={[styles.grid, { backgroundColor: 'red' }]} //theme.card
      //  columnWrapperStyle={{ justifyContent: 'center' }} // 👈 Centre les colonnes

        style={{ flexGrow: 0 }} // 👈 évite que la liste prenne tout l'écran
        contentContainerStyle={styles.grid}
        columnWrapperStyle={{
          justifyContent: 'center',
          gap: 8, // 👈 espace horizontal entre colonnes
        }}
        renderItem={({ item, index }) => (
          <MemoryCard
            icon={item.icon}
            isFlipped={item.isFlipped}
            isMatched={item.isMatched}
            isDisabled={isChecking}
            onPress={() => handleCardPress(index)}
          />
        )}
      />

      {/* MODAL DE FIN DE PARTIE */}
      <GameEndModal
        visible={isGameOver}
        gameId={GAME_ID}
        difficulty={difficulty}
        level={level}
        isVictory={hasWon}
        navigation={navigation}
        // Quand le modal se ferme (via le bouton ou après les récompenses aléatoires)
        onClose={() => {
          // On navigue vers la liste des niveaux
          navigation.popToTop(); // Retourne à la racine de la GameStack
          navigation.navigate('LevelSelect', { gameId: GAME_ID, gameName: 'Memory', difficulty });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 10 },
  title: { fontSize: 24, fontWeight: 'bold' },
  moves: { fontSize: 18, marginVertical: 10 },
  loadingText: {
    fontSize: 16,
    fontStyle: 'italic',
    marginVertical: 20,
  },
  grid: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)', // 👈 rend la grille visible
    borderRadius: 12,
    padding: 8,
    marginTop: 10,
    marginBottom: 20,

    // 👇 AJOUTE CES LIGNES :
    borderWidth: 2,
    borderColor: '#ccc',
    gap: 8, // espace entre les cases (RN >= 0.71 sinon utilise margin)
  },
});

export default MemoryGameScreen;