// src/games/memory/MemoryGameScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { useSettings } from '../../hooks/useSettings';
import { usePlayer } from '../../hooks/usePlayer';
import { GameScreenProps } from '../../navigation/types';
import { generateDeck, MemoryCardType } from './memory.logic';
import MemoryCard from './components/MemoryCard';

type Props = GameScreenProps<'Memory'>;

const MemoryGameScreen = ({ route }: Props) => {
  const { difficulty } = route.params;
  const { theme } = useSettings();
  const { addXP, spendLife, lives } = usePlayer();

  const [deck, setDeck] = useState<MemoryCardType[]>([]);
  const [selected, setSelected] = useState<number[]>([]); // Index des cartes sélectionnées
  const [moves, setMoves] = useState(0);
  const [isGameWon, setIsGameWon] = useState(false);
  const [isChecking, setIsChecking] = useState(false); // Pour bloquer les clics
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialiser le jeu
  const initGame = () => {
    if (lives <= 0) {
      // Gérer le cas "pas de vies" (le modal devrait s'ouvrir avant)
      Alert.alert("Plus de vies", "Vous devez attendre ou recharger vos vies.");
      return;
    }
    
    spendLife(); // Le jeu commence, on dépense une vie
    setDeck(generateDeck(difficulty));
    setSelected([]);
    setMoves(0);
    setIsGameWon(false);
    setIsChecking(false);
  };

  useEffect(() => {
    initGame();
    // Nettoyer le timer si l'utilisateur quitte
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [difficulty]); // Re-génère si la difficulté change (ne devrait pas, mais bon)

  // Logique de vérification des paires
  useEffect(() => {
    if (selected.length === 2) {
      setIsChecking(true); // Empêche d'autres clics
      const [firstIndex, secondIndex] = selected;
      const card1 = deck[firstIndex];
      const card2 = deck[secondIndex];

      if (card1.icon === card2.icon) {
        // C'est une paire !
        setDeck(prevDeck =>
          prevDeck.map(card =>
            card.icon === card1.icon ? { ...card, isMatched: true } : card
          )
        );
        setSelected([]);
        setIsChecking(false);
      } else {
        // Ce n'est pas une paire, on retourne les cartes
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
        }, 1000); // Attente 1s
      }
      setMoves(m => m + 1);
    }
  }, [selected]);
  
  // Vérifier la victoire
  useEffect(() => {
    if (deck.length > 0 && deck.every(card => card.isMatched)) {
      setIsGameWon(true);
      addXP(50); // Donner 50 XP pour la victoire
      Alert.alert("Gagné !", `Vous avez gagné en ${moves} coups ! +50 XP`);
    }
  }, [deck]);

  const handleCardPress = (index: number) => {
    if (isChecking || selected.length === 2 || deck[index].isFlipped) return;

    // Retourner la carte
    setDeck(prevDeck =>
      prevDeck.map((card, i) =>
        i === index ? { ...card, isFlipped: true } : card
      )
    );
    setSelected(prevSelected => [...prevSelected, index]);
  };
  
  // Déterminer le nombre de colonnes en fonction de la difficulté
  const numColumns = difficulty === 'easy' ? 4 : (difficulty === 'medium' ? 4 : 4);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Memory - {difficulty}</Text>
      <Text style={[styles.moves, { color: theme.text }]}>Coups: {moves}</Text>

      <FlatList
        data={deck}
        keyExtractor={item => item.id.toString()}
        numColumns={numColumns}
        contentContainerStyle={styles.grid}
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
      {/* TODO: Ajouter les boutons Rejouer, Précédent, Suivant */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 10 },
  title: { fontSize: 24, fontWeight: 'bold' },
  moves: { fontSize: 18, marginVertical: 10 },
  grid: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MemoryGameScreen;