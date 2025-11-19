import React, { useState, useCallback, useRef } from 'react';
import { GardenPondRef } from '../../components/Awareness/GardenPond';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { cornerRadius } from '../../utils/cornerRadius';
import { emotionService, DailyGrid, EmotionTile as EmotionTileType, WeeklyGrid, MonthlyGrid } from '../../services/emotion.service';
import { EmotionType } from '../../utils/emotions';
import GardenPond from '../../components/Awareness/GardenPond';
import WeatherCards from '../../components/Awareness/WeatherCards';
import MonthlyStats from '../../components/Awareness/MonthlyStats';
import EmotionSeedBar from '../../components/Awareness/EmotionSeedBar';
import BuddhistPrompt from '../../components/Awareness/BuddhistPrompt';
import AwarenessOnboarding from '../../components/Awareness/AwarenessOnboarding';
import * as Haptics from 'expo-haptics';

export default function AwarenessScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const [dailyGrid, setDailyGrid] = useState<DailyGrid | null>(null);
  const [weeklyGrid, setWeeklyGrid] = useState<WeeklyGrid | null>(null);
  const [monthlyGrid, setMonthlyGrid] = useState<MonthlyGrid | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [showBreathPrompt, setShowBreathPrompt] = useState(false);
  const [showBuddhistPrompt, setShowBuddhistPrompt] = useState(false);
  const breathOpacity = useRef(new Animated.Value(0)).current;
  const globalBreath = useRef(new Animated.Value(1)).current;
  const pondRef = useRef<GardenPondRef>(null);

  // Load data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadData();
      checkOnboarding();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const loadedDailyGrid = await emotionService.getDailyGrid(today);
      
      // Only show today's data - filter out any old seed data
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      if (loadedDailyGrid.date === todayStr) {
        setDailyGrid(loadedDailyGrid);
      } else {
        // Create empty grid for today
        setDailyGrid({
          date: todayStr,
          tiles: [],
        });
      }
      
      const weekStart = emotionService.getWeekStart(today);
      const loadedWeeklyGrid = await emotionService.getWeeklyGrid(weekStart);
      setWeeklyGrid(loadedWeeklyGrid);
      
      const monthStart = emotionService.getMonthStart(today);
      const loadedMonthlyGrid = await emotionService.getMonthlyGrid(monthStart);
      setMonthlyGrid(loadedMonthlyGrid);
    } catch (error) {
      console.error('Error loading emotion data:', error);
    } finally {
      setLoading(false);
    }
  };


  const checkOnboarding = async () => {
    const completed = await emotionService.isOnboardingCompleted();
    if (!completed) {
      setShowOnboarding(true);
    }
  };

  const handleEmotionNote = async (emotion: EmotionType) => {
    try {
      // Add ripple to pond immediately
      if (pondRef.current) {
        pondRef.current.addRipple(emotion);
      }

      // Optimistic update - add tile immediately for instant feedback
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const hour = now.getHours();
      const timestamp = now.getTime();
      
      const newTile: EmotionTileType = {
        emotion,
        timestamp,
        hour,
      };

      // Update daily grid optimistically - instant UI update
      if (dailyGrid && dailyGrid.date === dateStr) {
        setDailyGrid({
          ...dailyGrid,
          tiles: [...dailyGrid.tiles, newTile],
        });
      } else {
        // Create new daily grid if it doesn't exist
        const newDailyGrid: DailyGrid = {
          date: dateStr,
          tiles: [newTile],
        };
        setDailyGrid(newDailyGrid);
      }

      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Global screen breath animation
      Animated.sequence([
        Animated.timing(globalBreath, {
          toValue: 1.02,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(globalBreath, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Show breath prompt
      showBreathPromptAnimation();

      // Show Buddhist prompt occasionally (15% chance)
      if (Math.random() < 0.15) {
        setShowBuddhistPrompt(true);
      }

      // Save to storage (async, in background)
      await emotionService.saveEmotionTile(emotion);

      // Reload data to ensure sync (but UI already updated)
      await loadData();
    } catch (error) {
      console.error('Error saving emotion:', error);
      // Reload on error to restore correct state
      await loadData();
    }
  };

  const showBreathPromptAnimation = () => {
    setShowBreathPrompt(true);
    Animated.sequence([
      Animated.timing(breathOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(breathOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowBreathPrompt(false);
    });
  };

  const handleTilePress = (tile: EmotionTileType) => {
    // Could show tile details
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleReflect = () => {
    navigation.navigate('WeeklyReflection');
  };

  const handleClearToday = async () => {
    try {
      await emotionService.clearTodayData();
      await loadData();
    } catch (error) {
      console.error('Error clearing today\'s data:', error);
    }
  };

  const handleOnboardingComplete = async () => {
    await emotionService.setOnboardingCompleted();
    setShowOnboarding(false);
  };

  if (loading && !dailyGrid) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View 
          style={styles.loadingContainer}
          accessibilityRole="progressbar"
          accessibilityLabel={language === 'en' ? 'Loading awareness data' : 'සැලකිල්ල දත්ත පූරණය වෙමින්'}
        >
          <Text 
            style={[styles.loadingText, { color: colors.textSecondary }]}
            allowFontScaling={true}
          >
            {language === 'en' ? 'Loading...' : 'පූරණය වෙමින්...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.background },
        { transform: [{ scale: globalBreath }] },
      ]}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: 8 }]}>
          <View style={styles.headerTop}>
            <Text style={[styles.headerText, { color: colors.text }]}>
              {language === 'en' ? 'Awareness' : 'සැලකිල්ල'}
            </Text>
            {dailyGrid && dailyGrid.tiles.length > 0 && (
              <TouchableOpacity
                onPress={handleClearToday}
                style={styles.clearButton}
                accessibilityLabel={language === 'en' ? 'Clear today' : 'අද මකන්න'}
                accessibilityRole="button"
                accessibilityHint={language === 'en' ? 'Tap to clear all emotions recorded today' : 'අද පටිගත කළ සියලුම හැඟීම් මැකීමට තට්ටු කරන්න'}
              >
                <Text style={[styles.clearButtonText, { color: colors.textSecondary }]}>
                  {language === 'en' ? 'Clear' : 'මකන්න'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* View Mode Toggle */}
          <View 
            style={styles.viewModeContainer}
            accessibilityRole="tablist"
            accessibilityLabel={language === 'en' ? 'View mode selector' : 'දර්ශන ප්‍රකාරය තෝරන්න'}
          >
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'daily' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setViewMode('daily')}
              accessibilityRole="tab"
              accessibilityState={{ selected: viewMode === 'daily' }}
              accessibilityLabel={language === 'en' ? 'Daily view' : 'දිනපතා දර්ශනය'}
              accessibilityHint={language === 'en' ? 'Tap to view daily emotion tracking' : 'දිනපතා හැඟීම් නිරීක්ෂණය බැලීමට තට්ටු කරන්න'}
            >
              <Text
                style={[
                  styles.viewModeText,
                  {
                    color: viewMode === 'daily' ? '#FFFFFF' : colors.textSecondary,
                  },
                ]}
              >
                {language === 'en' ? 'Daily' : 'දිනපතා'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'weekly' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setViewMode('weekly')}
              accessibilityRole="tab"
              accessibilityState={{ selected: viewMode === 'weekly' }}
              accessibilityLabel={language === 'en' ? 'Weekly view' : 'සතික දර්ශනය'}
              accessibilityHint={language === 'en' ? 'Tap to view weekly emotion tracking' : 'සතික හැඟීම් නිරීක්ෂණය බැලීමට තට්ටු කරන්න'}
            >
              <Text
                style={[
                  styles.viewModeText,
                  {
                    color: viewMode === 'weekly' ? '#FFFFFF' : colors.textSecondary,
                  },
                ]}
              >
                {language === 'en' ? 'Weekly' : 'සතික'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'monthly' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setViewMode('monthly')}
              accessibilityRole="tab"
              accessibilityState={{ selected: viewMode === 'monthly' }}
              accessibilityLabel={language === 'en' ? 'Monthly view' : 'මාසික දර්ශනය'}
              accessibilityHint={language === 'en' ? 'Tap to view monthly emotion tracking' : 'මාසික හැඟීම් නිරීක්ෂණය බැලීමට තට්ටු කරන්න'}
            >
              <Text
                style={[
                  styles.viewModeText,
                  {
                    color: viewMode === 'monthly' ? '#FFFFFF' : colors.textSecondary,
                  },
                ]}
              >
                {language === 'en' ? 'Monthly' : 'මාසික'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Garden Pond, Weather Cards, or Monthly Stats */}
        <View 
          style={styles.gridContainer}
          accessibilityLabel={
            viewMode === 'daily'
              ? (language === 'en' ? 'Daily emotion garden' : 'දිනපතා හැඟීම් උයන')
              : viewMode === 'weekly'
              ? (language === 'en' ? 'Weekly emotion weather cards' : 'සතික හැඟීම් කාලගුණික කාඩ්පත්')
              : (language === 'en' ? 'Monthly emotion statistics' : 'මාසික හැඟීම් සංඛ්‍යාන')
          }
        >
          {viewMode === 'daily' ? (
            <GardenPond
              ref={pondRef as any}
              dailyGrid={dailyGrid || undefined}
            />
          ) : viewMode === 'weekly' ? (
            <WeatherCards
              weeklyGrid={weeklyGrid || undefined}
              onDayPress={(dayIndex, tiles) => {
                if (tiles.length > 0) {
                  handleTilePress(tiles[0]);
                }
              }}
            />
          ) : (
            <MonthlyStats
              monthlyGrid={monthlyGrid || undefined}
              onDayPress={(dayIndex, tiles) => {
                if (tiles.length > 0) {
                  handleTilePress(tiles[0]);
                }
              }}
            />
          )}
        </View>

        {/* Fixed Emotion Seed Bar at bottom */}
        <View style={styles.iconBarContainer}>
          <EmotionSeedBar onEmotionTap={handleEmotionNote} />
        </View>

        {/* Fixed Reflect Button at bottom */}
        <TouchableOpacity
          style={[styles.reflectButton, { backgroundColor: colors.card }]}
          onPress={handleReflect}
          activeOpacity={0.8}
          accessibilityLabel={language === 'en' ? 'Weekly reflection' : 'සතික පරාවර්තනය'}
          accessibilityRole="button"
          accessibilityHint={language === 'en' ? 'Tap to start weekly reflection on your emotions' : 'ඔබේ හැඟීම් පිළිබඳ සතික පරාවර්තනය ආරම්භ කිරීමට තට්ටු කරන්න'}
        >
          <Text style={styles.reflectIcon}>🪷</Text>
          <Text style={[styles.reflectText, { color: colors.text }]}>
            {language === 'en' ? 'Reflect' : 'පරාවර්තනය'}
          </Text>
        </TouchableOpacity>

        {/* Breath Prompt Overlay */}
        {showBreathPrompt && (
          <Animated.View
            style={[
              styles.breathPrompt,
              {
                opacity: breathOpacity,
                backgroundColor: colors.overlay,
              },
            ]}
            pointerEvents="none"
          >
            <Text style={[styles.breathText, { color: colors.text }]}>
              {language === 'en' ? 'Seen. Known. Released.' : 'දැනුනා. දැනගත්තා, අතඇරියා.'}
            </Text>
          </Animated.View>
        )}

        {/* Buddhist Prompt */}
        <BuddhistPrompt
          show={showBuddhistPrompt}
          onHide={() => setShowBuddhistPrompt(false)}
        />
      </SafeAreaView>

      {/* Onboarding Modal */}
      <AwarenessOnboarding
        visible={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: cornerRadius.sm, // Fixed: 8px -> cornerRadius.sm (8px)
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  viewModeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  viewModeButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: cornerRadius.lg, // Fixed: 16px -> cornerRadius.lg (16px)
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 0,
    paddingBottom: 180, // Space for fixed buttons at bottom
  },
  iconBarContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    paddingVertical: 16,
    zIndex: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  reflectButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: cornerRadius.xl, // Fixed: 20px -> cornerRadius.xl (20px)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 10,
  },
  reflectIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  reflectText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  breathPrompt: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  breathText: {
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: 2,
    textAlign: 'center',
  },
});
