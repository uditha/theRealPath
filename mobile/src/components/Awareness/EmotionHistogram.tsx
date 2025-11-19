import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { EmotionType, getEmotion } from '../../utils/emotions';
import { DailyGrid, EmotionTile as EmotionTileType, WeeklyGrid } from '../../services/emotion.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SQUARE_SIZE = 10; // Size of each rounded square (width = height)
const MAX_VISIBLE_SQUARES = 10; // Fixed height: 10 squares
const SQUARE_SPACING = 1; // Small gap between squares

interface EmotionHistogramProps {
  emotion: EmotionType;
  dailyGrid?: DailyGrid;
  weeklyGrid?: WeeklyGrid;
  onBarPress?: (dayIndex: number, count: number) => void;
}

const EmotionHistogram = React.memo(function EmotionHistogram({
  emotion,
  dailyGrid,
  weeklyGrid,
  onBarPress,
}: EmotionHistogramProps) {
  const { colors } = useTheme();
  const emotionDef = getEmotion(emotion);

  // Count taps per day for the week
  const tapsByDay = React.useMemo(() => {
    const counts: number[] = [0, 0, 0, 0, 0, 0, 0]; // Sunday-Saturday
    
    if (weeklyGrid) {
      weeklyGrid.days.forEach((day, index) => {
        const count = day.tiles.filter(tile => tile.emotion === emotion).length;
        counts[index] = count;
      });
    } else if (dailyGrid) {
      // If only daily grid available, show today's count
      const today = new Date().getDay();
      const count = dailyGrid.tiles.filter(tile => tile.emotion === emotion).length;
      counts[today] = count;
    }
    
    return counts;
  }, [weeklyGrid, dailyGrid, emotion]);

  // Generate stacked rounded squares (fixed height, overlapping when > 10)
  const getStackedSquares = (count: number, color: string) => {
    const squares: Array<{ opacity: number; color: string; bottom: number }> = [];
    
    if (count === 0) {
      return squares;
    }
    
    // Fixed height: always show MAX_VISIBLE_SQUARES squares
    // If count > MAX_VISIBLE_SQUARES, squares overlap and darken
    const visibleSquares = Math.min(count, MAX_VISIBLE_SQUARES);
    const overlapCount = Math.max(0, count - MAX_VISIBLE_SQUARES);
    
    for (let i = 0; i < visibleSquares; i++) {
      let opacity: number;
      
      // Calculate which "layer" this square represents
      const squareIndex = i;
      const positionRatio = squareIndex / (MAX_VISIBLE_SQUARES - 1); // 0 to 1
      
      if (count <= MAX_VISIBLE_SQUARES) {
        // Within first 10: light color, slight gradient
        opacity = 0.2 + positionRatio * 0.15; // 0.2 to 0.35
      } else {
        // More than 10 taps: darker base + overlap darkening
        const baseOpacity = 0.3 + positionRatio * 0.2; // 0.3 to 0.5
        const overlapDarkening = Math.min(overlapCount * 0.05, 0.3); // Darken with overlaps
        opacity = Math.min(baseOpacity + overlapDarkening, 0.85);
      }
      
      // Stack from bottom to top within fixed height
      const bottom = i * (SQUARE_SIZE - SQUARE_SPACING);
      
      squares.push({
        opacity: opacity,
        color: color,
        bottom: bottom,
      });
    }
    
    return squares;
  };

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={styles.container}>
      {tapsByDay.map((count, dayIndex) => {
        const squares = getStackedSquares(count, emotionDef.color);
        // Fixed height: always MAX_VISIBLE_SQUARES squares tall
        const fixedHeight = (MAX_VISIBLE_SQUARES - 1) * (SQUARE_SIZE - SQUARE_SPACING) + SQUARE_SIZE;
        
        return (
          <TouchableOpacity
            key={dayIndex}
            style={styles.dayColumn}
            onPress={() => onBarPress?.(dayIndex, count)}
            activeOpacity={0.7}
          >
            {/* Stacked rounded squares - fixed height container */}
            <View style={[styles.squaresContainer, { height: fixedHeight }]}>
              {squares.map((square, squareIndex) => (
                <View
                  key={squareIndex}
                  style={[
                    styles.roundedSquare,
                    {
                      width: SQUARE_SIZE,
                      height: SQUARE_SIZE,
                      backgroundColor: square.color,
                      opacity: square.opacity,
                      borderRadius: 3,
                      bottom: square.bottom,
                    },
                  ]}
                />
              ))}
              {count === 0 && (
                <View
                  style={[
                    styles.roundedSquare,
                    {
                      width: SQUARE_SIZE,
                      height: SQUARE_SIZE,
                      backgroundColor: emotionDef.color,
                      opacity: 0.1,
                      borderRadius: 3,
                      bottom: 0,
                    },
                  ]}
                />
              )}
            </View>
            
            {/* Day label */}
            <Text style={[
              styles.dayLabel,
              { 
                color: count > 0 ? colors.textSecondary : colors.textTertiary,
                opacity: count > 0 ? 0.8 : 0.4,
              },
            ]}>
              {dayNames[dayIndex]}
            </Text>
            
            {/* Count label (if > 0) */}
            {count > 0 && (
              <Text style={[styles.countLabel, { color: emotionDef.color }]}>
                {count}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    minHeight: 120,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  dayColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  squaresContainer: {
    width: SQUARE_SIZE,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 20,
    position: 'relative',
  },
  roundedSquare: {
    position: 'absolute',
    left: 0,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  countLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
});

export default EmotionHistogram;

