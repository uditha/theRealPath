import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { DailyGrid, EmotionTile as EmotionTileType, WeeklyGrid } from '../../services/emotion.service';
import { EmotionType, getEmotion, getEmotionLabel } from '../../utils/emotions';
import EmotionHistogram from './EmotionHistogram';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EmotionPetalProps {
  emotion: EmotionType;
  dailyGrid?: DailyGrid;
  weeklyGrid?: WeeklyGrid;
  onPebblePress?: (tile: EmotionTileType) => void;
  onPebbleLongPress?: (tile: EmotionTileType) => void;
  onNotePress: () => void;
  showNoteButton?: boolean;
  isDominant?: boolean;
  isLessActive?: boolean;
  totalCount?: number;
}

const EmotionPetal = React.memo(function EmotionPetal({
  emotion,
  dailyGrid,
  weeklyGrid,
  onPebblePress,
  onPebbleLongPress,
  onNotePress,
  showNoteButton = true,
  isDominant = false,
  isLessActive = false,
  totalCount = 0,
}: EmotionPetalProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const emotionDef = getEmotion(emotion);
  const label = getEmotionLabel(emotion, language);
  const breathingAnim = useRef(new Animated.Value(1)).current;

  // Breathing animation for the hollow
  useEffect(() => {
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(breathingAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(breathingAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    breathing.start();
    return () => breathing.stop();
  }, []);


  const todayCount = React.useMemo(() => {
    if (!dailyGrid) return 0;
    const today = new Date();
    return dailyGrid.tiles.filter(
      tile => tile.emotion === emotion && 
      new Date(tile.timestamp).toDateString() === today.toDateString()
    ).length;
  }, [dailyGrid, emotion]);

  // Generate reflection prompt
  const reflectionPrompt = React.useMemo(() => {
    if (totalCount === 0) return null;
    
    const prompts = language === 'en' 
      ? [
          `${totalCount} moments of ${label.toLowerCase()} - which one made you feel most alive?`,
          `Notice any patterns in when you feel most ${label.toLowerCase()}?`,
          `What brings you ${label.toLowerCase()}? Tap to add notes.`,
        ]
      : [
          `${label.toLowerCase()} මොහොත ${totalCount} - ඒවායින් කුමක් ඔබව වඩාත් ජීවමාන කළේද?`,
          `ඔබ වඩාත් ${label.toLowerCase()} දැනෙන විට රටා දැකිය හැකිද?`,
          `ඔබට ${label.toLowerCase()} ගෙන දෙන්නේ කුමක්ද? සටහන් එකතු කිරීමට තට්ටු කරන්න.`,
        ];
    
    return prompts[Math.floor(Math.random() * prompts.length)];
  }, [totalCount, label, language]);

  // Calculate weekly average for pattern recognition
  const weeklyAverage = React.useMemo(() => {
    if (!weeklyGrid || totalCount === 0) return null;
    const weekTotal = weeklyGrid.days.reduce((sum, day) => {
      return sum + day.tiles.filter(t => t.emotion === emotion).length;
    }, 0);
    return Math.round(weekTotal / 7);
  }, [weeklyGrid, totalCount, emotion]);

  const scaleAnim = useRef(new Animated.Value(isDominant ? 1.02 : 1)).current;
  const opacityAnim = useRef(new Animated.Value(isLessActive ? 0.5 : 1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: isDominant ? 1.02 : 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: isLessActive ? 0.5 : 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isDominant, isLessActive]);

  return (
    <Animated.View 
      style={[
        styles.petal, 
        { 
          backgroundColor: colors.surface,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
          borderWidth: isDominant ? 2 : 0,
          borderColor: isDominant ? emotionDef.color : 'transparent',
        }
      ]}
    >
      {/* Bloom Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{emotionDef.emoji}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.emotionName, { color: colors.text }]}>
            {label}
          </Text>
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
            {language === 'en' 
              ? `Today: ${todayCount} whispers` 
              : `අද: ${todayCount} හඬ`}
          </Text>
        </View>
      </View>

      {/* Histogram Chart */}
      <View style={styles.histogramWrapper}>
        <EmotionHistogram
          emotion={emotion}
          dailyGrid={dailyGrid}
          weeklyGrid={weeklyGrid}
          onBarPress={(dayIndex, count) => {
            // Show details on press - could navigate to day detail
            if (count > 0 && weeklyGrid) {
              const day = weeklyGrid.days[dayIndex];
              const dayTiles = day.tiles.filter(t => t.emotion === emotion);
              // Could show modal with tiles
            }
          }}
        />
      </View>

      {/* Reflection Prompt */}
      {reflectionPrompt && totalCount > 0 && (
        <TouchableOpacity
          onPress={onNotePress}
          activeOpacity={0.7}
          style={[
            styles.reflectionPrompt, 
            { 
              backgroundColor: colors.card,
              borderLeftColor: emotionDef.color,
            }
          ]}
        >
          <Text style={[styles.reflectionPromptText, { color: colors.textSecondary }]}>
            💭 {reflectionPrompt}
          </Text>
        </TouchableOpacity>
      )}

      {/* Weekly Pattern Recognition */}
      {weeklyAverage && todayCount > weeklyAverage * 1.5 && (
        <View style={styles.patternBadge}>
          <Text style={[styles.patternText, { color: emotionDef.color }]}>
            {language === 'en' 
              ? `📈 Today's ${label.toLowerCase()} is ${Math.round((todayCount / weeklyAverage) * 10) / 10}x your weekly average`
              : `📈 අද ${label.toLowerCase()} ඔබේ සතික සාමාන්‍යයෙන් ${Math.round((todayCount / weeklyAverage) * 10) / 10}x වැඩිය`}
          </Text>
        </View>
      )}

      {/* Invitation to Note - Breathing Hollow (optional) */}
      {showNoteButton && (
        <TouchableOpacity
          onPress={onNotePress}
          activeOpacity={0.7}
          style={styles.hollowContainer}
        >
          <Animated.View
            style={[
              styles.breathingHollow,
              {
                borderColor: emotionDef.color,
                backgroundColor: colors.background,
                transform: [{ scale: breathingAnim }],
              },
            ]}
          >
            <Text style={[styles.hollowText, { color: emotionDef.color }]}>
              {language === 'en' ? 'Note' : 'සටහන්'}
            </Text>
          </Animated.View>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  petal: {
    borderRadius: 24,
    padding: 20,
    marginTop: 16,
    marginBottom: 24,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 28,
  },
  headerText: {
    flex: 1,
  },
  emotionName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  histogramWrapper: {
    marginBottom: 16,
    paddingVertical: 12,
  },
  hollowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  breathingHollow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  hollowText: {
    fontSize: 10,
    fontWeight: '500',
  },
  reflectionPrompt: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
  },
  reflectionPromptText: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  patternBadge: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  patternText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default EmotionPetal;
