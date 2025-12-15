import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, Platform } from 'react-native';
import { useSettings } from '../../hooks/useSettings';
import { usePlayer } from '../../hooks/usePlayer';
import { GameScreenProps } from '../../navigation/types';
import { generateDeck, MemoryCardType, calculateMaxMoves } from './memory.logic';
import MemoryCard from './components/MemoryCard';
import GameEndModal from '../../components/modals/GameEndModal';
import { GameId } from '../../constants/gameData';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameStackParamList } from '../../navigation/types';
import { useSound } from '../../hooks/useSound';
import GameScreenWrapper from '../../components/games/GameScreenWrapper'; // ⭐⭐⭐ AJOUT ⭐⭐⭐
import { useDailyChallenge } from '../../hooks/useDailyChallenge'; // ⭐⭐⭐ AJOUT ⭐⭐⭐

type Props = NativeStackScreenProps<GameStackParamList, 'Memory'>;

const MemoryGameScreen = ({ route, navigation }: Props) => {
  const { difficulty, level } = route.params;
  const { isDailyChallenge } = useDailyChallenge(); // ⭐⭐⭐ UTILISEZ LE HOOK ⭐⭐⭐
  const { theme } = useSettings();
  const { lives } = usePlayer();
  const [deck, setDeck] = useState<MemoryCardType[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [maxMoves, setMaxMoves] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const GAME_ID: GameId = 'Memory';
  const { playSound, vibrate } = useSound();

  const { width: screenWidth, height: screenHeight } = dimensions;

  const MAX_CARD_WIDTH = Platform.OS === 'android' ? 50 : 60;
  const baseColumns = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 5 : 6;
  const numColumns = Math.min(baseColumns, Math.floor(screenWidth / MAX_CARD_WIDTH));

  const numRows = deck.length > 0 ? Math.ceil(deck.length / numColumns) : 0;

  const GAP = 8;
  let cardSize = 50;
  if (containerHeight > 0 && numRows > 0) {
    const availableForCards = containerHeight - (numRows - 1) * GAP;
    cardSize = Math.max(40, Math.min(50, availableForCards / numRows));
  }

  const initGame = () => {
    const calculatedMaxMoves = calculateMaxMoves(difficulty, level);
    setMaxMoves(calculatedMaxMoves);
    setDeck(generateDeck(difficulty, level));
    setSelected([]);
    setMoves(0);
    setHasWon(false);
    setIsGameOver(false);
    setIsChecking(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', initGame);
    return unsubscribe;
  }, [navigation, difficulty]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (selected.length === 2 && !isGameOver) {
      setIsChecking(true);
      const [firstIndex, secondIndex] = selected;
      const card1 = deck[firstIndex];
      const card2 = deck[secondIndex];
      const isMatch = card1.icon === card2.icon;
      if (isMatch) {
        playSound('success');
        vibrate('success');
        setDeck(prevDeck =>
          prevDeck.map(card =>
            card.icon === card1.icon ? { ...card, isMatched: true } : card
          )
        );
        setSelected([]);
        setIsChecking(false);
      } else {
        playSound('error');
        vibrate('error');
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
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [selected, isGameOver, deck]);

  useEffect(() => {
    if (isGameOver || maxMoves === 0) return;
    if (moves >= maxMoves) {
      if (!deck.every(card => card.isMatched)) {
        playSound('lose');
        vibrate('error');
        setHasWon(false);
        setIsGameOver(true);
        if (timerRef.current) clearTimeout(timerRef.current);
      }
    }
  }, [moves, maxMoves, isGameOver, deck]);

  useEffect(() => {
    if (deck.length > 0 && deck.every(card => card.isMatched) && !isGameOver) {
      playSound('win');
      vibrate('success');
      if (timerRef.current) clearTimeout(timerRef.current);
      setHasWon(true);
      setIsGameOver(true);
    }
  }, [deck, isGameOver]);

  const handleCardPress = (index: number) => {
    if (isChecking || selected.length === 2 || deck[index].isFlipped || isGameOver) return;
    playSound('click');
    setDeck(prevDeck =>
      prevDeck.map((card, i) =>
        i === index ? { ...card, isFlipped: true } : card
      )
    );
    setSelected(prevSelected => [...prevSelected, index]);
  };

 
  // Gestion du chargement
  if (deck.length === 0 && !isGameOver) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Préparation du jeu...
        </Text>
      </View>
    );
  }

  return (
    <GameScreenWrapper gameId="Memory"> {/* ⭐⭐⭐ AJOUT DU WRAPPER ⭐⭐⭐ */}
      <View style={{ flex: 1 }}>
        {/* Interface du jeu - seulement si le jeu n'est pas terminé */}
        {!isGameOver && (
          <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.title, { color: theme.text }]}>
              Memory - Niveau {level} ({difficulty})
            </Text>
            <Text style={[styles.moves, { color: theme.text }]}>
              Coups: {moves} / {maxMoves}
              <Text style={{ color: theme.error }}>
                {` (${maxMoves - moves} restants)`}
              </Text>
            </Text>
            
            <View
              style={{ flex: 1 }}
              onLayout={(event) => setContainerHeight(event.nativeEvent.layout.height)}
            >
              <FlatList
                data={deck}
                keyExtractor={item => item.id.toString()}
                numColumns={numColumns}
                key={`memory-grid-${numColumns}-${deck.length}-${difficulty}`}
                style={{ flexGrow: 0 }}
                contentContainerStyle={[
                  styles.grid,
                  {
                    minHeight: '100%',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                  }
                ]}
                columnWrapperStyle={{
                  justifyContent: Platform.OS === 'android' ? 'space-between' : 'space-around',
                  gap: Platform.OS === 'android' ? 4 : GAP,
                }}
                scrollEnabled={false}
                renderItem={({ item, index }) => (
                  <MemoryCard
                    icon={item.icon}
                    isFlipped={item.isFlipped}
                    isMatched={item.isMatched}
                    isDisabled={isChecking}
                    onPress={() => handleCardPress(index)}
                    cardSize={cardSize}
                  />
                )}
              />
            </View>
          </View>
        )}

        {/* ⭐⭐⭐ MODAL DE FIN DE JEU - TOUJOURS PRÉSENT ⭐⭐⭐ */}
        <GameEndModal
          visible={isGameOver}
          gameId={GAME_ID}
          difficulty={difficulty}
          level={level}
          isVictory={hasWon}
        //  score={0} // ⭐⭐⭐ AJOUTEZ UN SCORE SI VOUS EN AVEZ UN ⭐⭐⭐
          gameStats={{
            moves: moves,
            maxMoves: maxMoves,
            pairsFound: deck.filter(card => card.isMatched).length / 2,
          }}
          navigation={navigation}
          isDailyChallenge={isDailyChallenge}
          onClose={() => {
            setIsGameOver(false);
            setHasWon(false);
            // ⭐⭐⭐ NE PAS GÉRER LA NAVIGATION ICI ⭐⭐⭐
            // La navigation est gérée dans GameEndModal.tsx
            
            // Pour les jeux normaux, réinitialiser
            if (!isDailyChallenge) {
              initGame();
            }
          }}
        />
      </View>
    </GameScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: 'center', 
    padding: 10 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold',
    marginBottom: 10 
  },
  moves: { 
    fontSize: 18, 
    marginVertical: 10 
  },
  loadingText: {
    fontSize: 16,
    fontStyle: 'italic',
    marginVertical: 20,
  },
  grid: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 8,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#ccc',
    gap: 8,
  },
});

export default MemoryGameScreen;