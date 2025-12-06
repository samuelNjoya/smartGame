import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  FlatList,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSettings } from '../hooks/useSettings';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Données du carousel (à adapter avec vos images)
const CAROUSEL_DATA = [
  {
    id: '1',
    image: require('../../assets/images/carousel/brain-training.png'),
    title: 'Entraînez votre cerveau',
    description: 'Améliorez mémoire, logique et rapidité avec nos jeux scientifiques',
    icon: 'brain',
    color: '#6366F1', // Indigo
    gradient: ['#6366F1', '#8B5CF6'],
  },
  {
    id: '2',
    image: require('../../assets/images/carousel/progress-tracker.png'),
    title: 'Suivez votre progression',
    description: 'Analyser vos performances avec des statistiques détaillées',
    icon: 'chart-line',
    color: '#10B981', // Emerald
    gradient: ['#10B981', '#34D399'],
  },
  {
    id: '3',
    image: require('../../assets/images/carousel/daily-challenge.png'),
    title: 'Défis quotidiens',
    description: 'Nouveaux challenges chaque jour pour rester motivé',
    icon: 'trophy',
    color: '#F59E0B', // Amber
    gradient: ['#F59E0B', '#FBBF24'],
  },
  {
    id: '4',
    image: require('../../assets/images/carousel/levels-system.png'),
    title: '4 niveaux de difficulté',
    description: 'De Facile à Maître, progressez à votre rythme',
    icon: 'star-shooting',
    color: '#EC4899', // Pink
    gradient: ['#EC4899', '#F472B6'],
  },
];

const HomeCarousel = () => {
  const { theme } = useSettings();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollToSlide = (index: number) => {
    if (slidesRef.current) {
      slidesRef.current.scrollToIndex({ index, animated: true });
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
    });

    return (
      <Animated.View
        style={[
          styles.slideContainer,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <View style={styles.imageContainer}>
          <Image
            source={item.image}
            style={styles.image}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)']}
            style={styles.gradientOverlay}
          />
        </View>

        <View style={styles.contentContainer}>
          <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
            <MaterialCommunityIcons
              name={item.icon}
              size={32}
              color={item.color}
            />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            {item.title}
          </Text>

          <Text style={[styles.description, { color: theme.secondary }]}>
            {item.description}
          </Text>

          <LinearGradient
            colors={item.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>Découvrir</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
          </LinearGradient>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <View style={styles.header}>
        <Text style={[styles.carouselTitle, { color: theme.text }]}>
          Smart Game
        </Text>
        <View style={styles.pagination}>
          {CAROUSEL_DATA.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentIndex ? theme.primary : theme.secondary + '40',
                  width: index === currentIndex ? 24 : 8,
                },
              ]}
              onPress={() => scrollToSlide(index)}
            />
          ))}
        </View>
      </View>

      <FlatList
        ref={slidesRef}
        data={CAROUSEL_DATA}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        scrollEventThrottle={32}
        decelerationRate="fast"
      />

      {/* Contrôles de navigation */}
      <View style={styles.controls}>
        <View style={styles.counter}>
          <Text style={[styles.counterText, { color: theme.primary }]}>
            {currentIndex + 1}
          </Text>
          <Text style={[styles.counterTotal, { color: theme.secondary }]}>
            /{CAROUSEL_DATA.length}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    marginHorizontal: 2,
    marginTop: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  carouselTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
    transitionProperty: 'width',
    transitionDuration: '300ms',
  },
  slideContainer: {
    width: width - 34,
    height: 270,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 40,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    lineHeight: 28,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    opacity: 0.9,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'flex-start',
    minWidth: 120,
  },
  ctaText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 8,
  },
  controls: {
    flexDirection: 'row',
   // justifyContent: 'space-between',
   justifyContent:"flex-end",
    alignItems: 'center',
    paddingHorizontal: 20,
    //paddingVertical: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },

  counter: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  counterText: {
    fontSize: 14,
    fontWeight: '700',
  },
  counterTotal: {
    fontSize: 12,
    marginLeft: 2,
  },
});

export default HomeCarousel;