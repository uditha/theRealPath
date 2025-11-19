import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { DailyGrid, EmotionTile } from '../../services/emotion.service';
import { EmotionType } from '../../utils/emotions';
import { GardenElementWrapper } from './Garden';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HOUR_WIDTH = 100; // Increased from 80 for better spacing
const TIMELINE_HEIGHT = 600;
const SOIL_HEIGHT = TIMELINE_HEIGHT - 120; // More space for labels
const ELEMENT_SIZE = 40; // Increased from 32 for better visibility
const HOUR_LABEL_HEIGHT = 50; // Increased from 40

interface GardenTimelineProps {
  dailyGrid?: DailyGrid;
  onElementPress?: (tile: EmotionTile) => void;
}

/**
 * Daily Garden Timeline View
 * Shows emotions as nature elements growing in a garden timeline
 */
const GardenTimeline: React.FC<GardenTimelineProps> = ({ dailyGrid, onElementPress }) => {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll to current hour
  useEffect(() => {
    if (dailyGrid && scrollRef.current) {
      const currentHour = new Date().getHours();
      const scrollPosition = currentHour * HOUR_WIDTH - SCREEN_WIDTH / 2 + HOUR_WIDTH / 2;
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          x: Math.max(0, scrollPosition),
          animated: true,
        });
      }, 100);
    }
  }, [dailyGrid]);

  // Group tiles by hour and calculate positions
  // Only show today's data - one day with 24 hours
  const hourData = useMemo(() => {
    if (!dailyGrid) return [];

    // Verify this is today's grid
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Only process if this is today's data
    if (dailyGrid.date !== todayStr) {
      return [];
    }

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const currentHour = new Date().getHours();

    return hours.map((hour) => {
      const tilesForHour = dailyGrid.tiles.filter((tile) => tile.hour === hour);
      const isCurrentHour = hour === currentHour;

      return {
        hour,
        tiles: tilesForHour,
        isCurrentHour,
      };
    });
  }, [dailyGrid]);

  // Calculate element positions within each hour (to avoid overlap)
  // Vertical stacking for better readability
  const getElementPosition = (index: number, total: number) => {
    if (total === 1) return { x: HOUR_WIDTH / 2 - ELEMENT_SIZE / 2, y: SOIL_HEIGHT / 2 };
    
    // Distribute elements vertically for better readability
    const spacing = Math.min(SOIL_HEIGHT / (total + 1), ELEMENT_SIZE + 10);
    const startY = (SOIL_HEIGHT - (total * spacing)) / 2;
    
    return {
      x: HOUR_WIDTH / 2 - ELEMENT_SIZE / 2,
      y: startY + index * spacing,
    };
  };

  // Check if this is today's grid
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const isToday = dailyGrid?.date === todayStr;

  if (!dailyGrid || !isToday || dailyGrid.tiles.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {language === 'en'
            ? 'Tap an emotion below to start your garden today'
            : 'අද ඔබේ උයන ආරම්භ කිරීමට පහත හැඟීමක් තට්ටු කරන්න'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Timeline with soil background */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {hourData.map(({ hour, tiles, isCurrentHour }) => (
          <View
            key={hour}
            style={[
              styles.hourColumn,
              isCurrentHour && { borderColor: colors.primary },
            ]}
          >
            {/* Hour label */}
            <View style={styles.hourLabelContainer}>
              <Text
                style={[
                  styles.hourLabel,
                  {
                    color: isCurrentHour ? colors.primary : colors.text,
                    fontWeight: isCurrentHour ? '700' : '600',
                    fontSize: isCurrentHour ? 16 : 14,
                  },
                ]}
              >
                {hour.toString().padStart(2, '0')}
              </Text>
              {isCurrentHour && (
                <View style={[styles.currentIndicator, { backgroundColor: colors.primary }]} />
              )}
            </View>

            {/* Soil layer */}
            <View style={[styles.soilContainer, { height: SOIL_HEIGHT }]}>
              <LinearGradient
                colors={['#2E1F1B', '#3E2723', '#4E342E']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              >
                {/* Soil texture - subtle dots - reduced opacity for better contrast */}
                {Array.from({ length: 15 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.soilDot,
                      {
                        left: (i % 5) * (HOUR_WIDTH / 5),
                        top: Math.floor(i / 5) * (SOIL_HEIGHT / 3),
                        backgroundColor: `rgba(0, 0, 0, ${0.05 + Math.random() * 0.05})`,
                      },
                    ]}
                  />
                ))}
              </LinearGradient>

              {/* Garden elements */}
              {tiles.map((tile, index) => {
                const position = getElementPosition(index, tiles.length);
                return (
                  <TouchableOpacity
                    key={`${tile.timestamp}-${index}`}
                    onPress={() => onElementPress?.(tile)}
                    activeOpacity={0.7}
                    style={[
                      styles.elementContainer,
                      {
                        left: position.x,
                        top: position.y,
                      },
                    ]}
                  >
                    <GardenElementWrapper
                      emotion={tile.emotion}
                      size={ELEMENT_SIZE}
                      animated={true}
                      delay={index * 50}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  hourColumn: {
    width: HOUR_WIDTH,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  hourLabelContainer: {
    height: HOUR_LABEL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  hourLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  currentIndicator: {
    position: 'absolute',
    bottom: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 3,
  },
  soilContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.3)', // Subtle border for definition
  },
  soilDot: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
  },
  elementContainer: {
    position: 'absolute',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5, // Better visibility on Android
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default GardenTimeline;

