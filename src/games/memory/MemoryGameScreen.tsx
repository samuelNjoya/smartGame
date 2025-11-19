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

type Props = NativeStackScreenProps<GameStackParamList, 'Memory'>;

const MemoryGameScreen = ({ route, navigation }: Props) => {
  const { difficulty, level } = route.params;
  const { theme } = useSettings();
  const { lives } = usePlayer();
  const [deck, setDeck] = useState<MemoryCardType[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [maxMoves, setMaxMoves] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);  // ← NOUVEAU : Hauteur réelle
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));  // ← Écran avec listener
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const GAME_ID: GameId = 'Memory';

  const { width: screenWidth, height: screenHeight } = dimensions;  // ← Utilise state


  const MAX_CARD_WIDTH = Platform.OS === 'android' ? 50 : 60;  // ← PETIT SUR ANDROID pour + cols (360/60=6)
  const baseColumns = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 5 : 6;
  const numColumns = Math.min(baseColumns, Math.floor(screenWidth / MAX_CARD_WIDTH));  // ← Garde min, mais cap plus haut

  // Bonus : Log pour debug (enlève après test)
  console.log('Platform Debug:', { os: Platform.OS, screenWidth, maxCardW: MAX_CARD_WIDTH, numColumns });

  // NumRows (après numColumns)
  const numRows = deck.length > 0 ? Math.ceil(deck.length / numColumns) : 0;

  // Taille carte : Basée sur containerHeight RÉELLE (fallback 70 si pas mesuré)
  const GAP = 8;
  let cardSize = 50;  // ← Default sûr
  if (containerHeight > 0 && numRows > 0) {
    const availableForCards = containerHeight - (numRows - 1) * GAP;
    cardSize = Math.max(40, Math.min(50, availableForCards / numRows));  // ← CAPS STRICTS : 40-80px
  }

  console.log('Debug:', { numColumns, numRows, cardSize, containerHeight });
  // Listener resize (ACTIF maintenant)
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', (newDims) => {
      setDimensions(newDims.window);
    });
    return () => subscription?.remove();
  }, []);

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
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [selected, isGameOver, deck]);

  useEffect(() => {
    if (isGameOver || maxMoves === 0) return;
    if (moves >= maxMoves) {
      if (!deck.every(card => card.isMatched)) {
        setHasWon(false);
        setIsGameOver(true);
        if (timerRef.current) clearTimeout(timerRef.current);
      }
    }
  }, [moves, maxMoves, isGameOver, deck]);

  useEffect(() => {
    if (deck.length > 0 && deck.every(card => card.isMatched) && !isGameOver) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setHasWon(true);
      setIsGameOver(true);
    }
  }, [deck, isGameOver]);

  const handleCardPress = (index: number) => {
    if (isChecking || selected.length === 2 || deck[index].isFlipped || isGameOver) return;
    setDeck(prevDeck =>
      prevDeck.map((card, i) =>
        i === index ? { ...card, isFlipped: true } : card
      )
    );
    setSelected(prevSelected => [...prevSelected, index]);
  };

  return (
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
      {deck.length === 0 && (
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Préparation du jeu...
        </Text>
      )}
      {/* WRAPPER POUR MESURER HAUTEUR RÉELLE (après header) */}
      <View
        style={{ flex: 1 }}  // ← Prend reste espace
        onLayout={(event) => setContainerHeight(event.nativeEvent.layout.height)}  // ← MESURE AUTO
      >
        <FlatList
          data={deck}
          keyExtractor={item => item.id.toString()}
          numColumns={numColumns}
          // key={`memory-grid-${numColumns}-${deck.length}`}  // ← Remount sûr
          key={`memory-grid-${numColumns}-${deck.length}-${difficulty}`}  // ← Ajoute difficulty : Change au switch !
          style={{ flexGrow: 0 }}  // ← Pas de height fixe : Wrapper gère
          contentContainerStyle={[
            styles.grid,
            {
              minHeight: '100%',  // ← Remplit sans clip
              justifyContent: 'flex-start',
              alignItems: 'center',
            }
          ]}
          columnWrapperStyle={{
            justifyContent: Platform.OS === 'android' ? 'space-between' : 'space-around',  // ← Tight sur Android
            gap: Platform.OS === 'android' ? 4 : GAP,  // ← Gap réduit 4px sur Android
          }}
          scrollEnabled={false}  // ← No scroll
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
      <GameEndModal
        visible={isGameOver}
        gameId={GAME_ID}
        difficulty={difficulty}
        level={level}
        isVictory={hasWon}
        navigation={navigation}
        onClose={() => {
          navigation.popToTop();
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