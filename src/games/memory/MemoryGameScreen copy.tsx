// src/games/memory/MemoryGameScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, Dimensions } from 'react-native';
import { useSettings } from '../../hooks/useSettings';
import { usePlayer } from '../../hooks/usePlayer';
import { GameScreenProps } from '../../navigation/types';
import { generateDeck, MemoryCardType, calculateMaxMoves } from './memory.logic';
import MemoryCard from './components/MemoryCard';
//import { calculateMaxMoves } from './memory.logic'; // NOUVEL IMPORT
// NOUVEAUX IMPORTS
import GameEndModal from '../../components/modals/GameEndModal';
import { GameId } from '../../constants/gameData';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameStackParamList } from '../../navigation/types';

// Mise à jour du type de Props pour inclure le paramètre 'level'
type Props = NativeStackScreenProps<GameStackParamList, 'Memory'>;

const MemoryGameScreen = ({ route, navigation }: Props) => { // AJOUT de navigation

  // const { width: screenWidth } = Dimensions.get('window');  // ← Largeur écran

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

  // NOUVEL ÉTAT : Limite de coups
  const [maxMoves, setMaxMoves] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Constante pour l'ID du jeu
  const GAME_ID: GameId = 'Memory';


  // Dans le composant (après useStates)
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');  // ← Écran complet
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  // // Nb rows = deck.length / numColumns (arrondi up)
  // const numRows = Math.ceil(deck.length / numColumns);

  // // Hauteur disponible pour grille (minus header + paddings + footer modal)
  // const HEADER_HEIGHT = 100;  // ← Ajuste : title + moves text + margins (mesure tes styles)
  // const PADDING_TOTAL = 40;   // ← Padding container + grid
  // const AVAILABLE_HEIGHT = screenHeight - HEADER_HEIGHT - PADDING_TOTAL;

  // // Taille carte : Uniforme, inclut gap (gap partagé entre rows)
  // const GAP = 8;  // ← Ton gap existant
  // const cardSize = Math.max(40, (AVAILABLE_HEIGHT - (numRows - 1) * GAP) / numRows);  // ← Min 40px pour lisibilité

  // // NumColumns : Ton code + cap horizontal (pour petits écrans)
  // const MAX_CARD_WIDTH = 80;  // ← Largeur max carte (ajuste si tes icônes scalent mal)
  // const numColumns = Math.min(
  //   difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8,
  //   Math.floor(screenWidth / MAX_CARD_WIDTH)
  // );

  // NumColumns EN PREMIER (dépend de screenWidth et difficulty, pas de deck)
  const MAX_CARD_WIDTH = 50;  // ← Largeur max carte (ajuste si icônes scalent mal)
  const baseColumns = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8;
  const numColumns = Math.min(baseColumns, Math.floor(screenWidth / MAX_CARD_WIDTH));

  // MAINTENANT numRows (après numColumns)
  const numRows = Math.ceil(deck.length / numColumns);  // ← Plus de ReferenceError !

  // Hauteur disponible pour grille (minus header + paddings)
  const HEADER_HEIGHT = 100;  // ← Ajuste : title + moves text + margins (mesure tes styles)
  const PADDING_TOTAL = 40;   // ← Padding container + grid
  const AVAILABLE_HEIGHT = screenHeight - HEADER_HEIGHT - PADDING_TOTAL;

  // Taille carte : Uniforme, inclut gap
  const GAP = 8;  // ← Ton gap existant
  const cardSize = Math.max(40, (AVAILABLE_HEIGHT - (numRows - 1) * GAP) / numRows);  // ← Min 40px pour lisibilité
  // Initialiser le jeu (maintenant sans dépense de vie ici)
  const initGame = () => {
    // La vérification des vies et spendLife() est faite dans LevelSelectScreen 
    // avant l'appel à cet écran. On ne vérifie pas et on ne dépense pas ici.

    // Calculer la limite de coups en fonction du niveau et de la difficulté
    const calculatedMaxMoves = calculateMaxMoves(difficulty, level);
    setMaxMoves(calculatedMaxMoves);

    setDeck(generateDeck(difficulty, level)); // PASSER LE NIVEAU ICI
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
    if (selected.length === 2 && !isGameOver) { // AJOUT de !isGameOver
      setIsChecking(true);
      const [firstIndex, secondIndex] = selected;
      const card1 = deck[firstIndex];
      const card2 = deck[secondIndex];
      const isMatch = card1.icon === card2.icon;

      if (isMatch) {
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
      // On met à jour moves
      setMoves(m => m + 1);
    }

    // Nettoyage: Toujours utile en cas de démontage
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [selected, isGameOver]); // isGameOver ajouté

  // NOUVEL EFFECT : VÉRIFIE LA DÉFAITE SÉPARÉMENT
  useEffect(() => {
    if (isGameOver || maxMoves === 0) return; // Ne rien faire si c'est déjà fini

    // La défaite est atteinte quand moves est egal ou DÉPASSE maxMoves
    if (moves >= maxMoves) {
      // Ligne de sécurité : on vérifie qu'on n'a pas gagné par hasard
      if (!deck.every(card => card.isMatched)) {
        // DÉFAITE immédiate (pas besoin de timeout car le dernier coup est terminé)
        setHasWon(false);
        setIsGameOver(true);

        // Annuler tout timer potentiel au cas où
        if (timerRef.current) clearTimeout(timerRef.current);
      }
    }
  }, [moves, maxMoves, isGameOver]); // Dépend de moves et maxMoves


  // VÉRIFIER LA VICTOIRE (MODIFIÉ : Annule le timer de défaite si présent)
  useEffect(() => {
    if (deck.length > 0 && deck.every(card => card.isMatched) && !isGameOver) {
      // VICTOIRE !
      if (timerRef.current) {
        clearTimeout(timerRef.current); // ANNULE LA DÉFAITE DIFFÉRÉE
      }
      setHasWon(true);
      setIsGameOver(true);
    }
  }, [deck, isGameOver]);

  //rotation resize
  //   useEffect(() => {
  //   const subscription = Dimensions.addEventListener('change', (newDims) => {
  //     setDimensions(newDims.window);  // ← Recalc numColumns/numRows/cardSize
  //   });
  //   return () => subscription?.remove();
  // }, []);

  const handleCardPress = (index: number) => {
    // Empêche le clic si le jeu est terminé
    if (isChecking || selected.length === 2 || deck[index].isFlipped || isGameOver) return;

    // ... (Logique de sélection inchangée)
    setDeck(prevDeck =>
      prevDeck.map((card, i) =>
        i === index ? { ...card, isFlipped: true } : card
      )
    );
    setSelected(prevSelected => [...prevSelected, index]);
  };

  // Déterminer le nombre de colonnes en fonction de la difficulté (inchangé)
  // const numColumns = difficulty === 'easy' ? 4 : (difficulty === 'medium' ? 4 : 4);
  //const numColumns = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8;

  // Remplace ta const numColumns par ça (ajuste CARD_WIDTH si besoin)
  // const CARD_WIDTH = 70;  // ← Ta largeur carte + gap/2 (mesure via MemoryCard styles)
  // const numColumns = Math.max(
  //   difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8,  // ← Ton min basé sur diff
  //   Math.floor(screenWidth / CARD_WIDTH)  // ← Max possible sans overflow
  // );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        Memory - Niveau {level} ({difficulty})
      </Text>
      {/* <Text style={[styles.moves, { color: theme.text }]}>Coups: {moves}</Text> */}
      <Text style={[styles.moves, { color: theme.text }]}>
        Coups: {moves} / {maxMoves}
        <Text style={{ color: theme.error }}>
          {` (${maxMoves - moves} restants)`}
        </Text>
      </Text>

      {/* preparation du jeux */}
      {deck.length === 0 && (
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Préparation du jeu...
        </Text>
      )}
      {/* 
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
      /> */}

      {/* <FlatList
        data={deck}
        keyExtractor={item => item.id.toString()}
        numColumns={numColumns}
        style={{
          flexGrow: 0,
          height: AVAILABLE_HEIGHT,  // ← Fixe hauteur exacte pour fit
        }}
        contentContainerStyle={[
          styles.grid,
          {
            height: AVAILABLE_HEIGHT,  // ← Force le container à la hauteur calc
            justifyContent: 'flex-start',  // ← Aligne top, pas center si trop haut
          }
        ]}
        columnWrapperStyle={{
          justifyContent: 'space-around',  // ← Répartit pour fit horizontal
          gap: GAP,
        }}
        scrollEnabled={false}  // ← ZÉRO SCROLL ! Tout visible d'un coup
        renderItem={({ item, index }) => (
          <MemoryCard
            icon={item.icon}
            isFlipped={item.isFlipped}
            isMatched={item.isMatched}
            isDisabled={isChecking}
            onPress={() => handleCardPress(index)}
            cardSize={cardSize}  // ← NOUVELLE PROP : Passe la taille dynamique
          />
        )}
      /> */}

      <FlatList
        data={deck}
        keyExtractor={item => item.id.toString()}
        numColumns={numColumns}
        key={`memory-grid-${numColumns}-${deck.length}`}  // ← LA FIX : Force remount si cols ou deck change
        style={{
          flexGrow: 0,
          height: AVAILABLE_HEIGHT,  // ← Fixe hauteur pour no-scroll
        }}
        contentContainerStyle={[
          styles.grid,
          {
            height: AVAILABLE_HEIGHT,
            justifyContent: 'flex-start',
          }
        ]}
        columnWrapperStyle={{
          justifyContent: 'space-around',
          gap: GAP,
        }}
        scrollEnabled={false}  // ← Zéro scroll
        renderItem={({ item, index }) => (
          <MemoryCard
            icon={item.icon}
            isFlipped={item.isFlipped}
            isMatched={item.isMatched}
            isDisabled={isChecking}
            onPress={() => handleCardPress(index)}
            cardSize={cardSize}  // ← Passe la taille dynamique
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