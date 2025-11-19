import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/user.service';
import { emotionService } from '../../services/emotion.service';
import DailyWisdom from '../../components/Home/DailyWisdom';

export default function SettingsScreen({ navigation }: any) {
  const { colors, mode, isDark, setMode, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { logout, user } = useAuth();
  const [dailyGoal, setDailyGoal] = useState(user?.dailyGoalXP || 10);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const styles = createStyles(colors);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLanguageChange = async (lang: 'en' | 'si') => {
    setLanguage(lang);
  };

  const handleThemeChange = (newMode: 'light' | 'dark' | 'auto') => {
    setMode(newMode);
  };

  const handleDailyGoalChange = async (goal: number) => {
    try {
      await userService.updateMe({ dailyGoalXP: goal });
      setDailyGoal(goal);
    } catch (error) {
      console.error('Error updating daily goal', error);
    }
  };

  const handleLetGo = () => {
    Alert.alert(
      language === 'en' ? 'Let Go?' : 'අත් හරින්නද?',
      language === 'en'
        ? 'This will clear all your emotion data. This action cannot be undone.'
        : 'මෙය ඔබේ සියලුම හැඟීම් දත්ත මකා දමනු ඇත. මෙම ක්‍රියාව අහෝසි කළ නොහැක.',
      [
        {
          text: language === 'en' ? 'Cancel' : 'අවලංගු කරන්න',
          style: 'cancel',
        },
        {
          text: language === 'en' ? 'Let Go' : 'අත් හරින්න',
          style: 'destructive',
          onPress: async () => {
            try {
              await emotionService.clearAllData();
              Alert.alert(
                language === 'en' ? 'Done' : 'සම්පූර්ණයි',
                language === 'en'
                  ? 'All emotion data has been cleared.'
                  : 'සියලුම හැඟීම් දත්ත මකා දමන ලදී.'
              );
            } catch (error) {
              console.error('Error clearing emotion data:', error);
              Alert.alert(
                language === 'en' ? 'Error' : 'දෝෂය',
                language === 'en'
                  ? 'Failed to clear data. Please try again.'
                  : 'දත්ත මකා දැමීමට අසමත් විය. කරුණාකර නැවත උත්සාහ කරන්න.'
              );
            }
          },
        },
      ]
    );
  };

  const handleResetOnboarding = async () => {
    try {
      await emotionService.resetOnboarding();
      Alert.alert(
        language === 'en' ? 'Done' : 'සම්පූර්ණයි',
        language === 'en'
          ? 'Onboarding will show again on next visit.'
          : 'ඊළඟ වරට පැමිණීමේදී නැවතත් පුහුණුව පෙන්වනු ඇත.'
      );
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Back Button */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
          <Text style={[styles.backButtonText, { color: colors.text }]}>
            {language === 'en' ? 'Profile' : 'පැතිකඩ'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          {language === 'en' ? 'Settings' : 'සැකසීම්'}
        </Text>
        <View style={styles.wisdomContainer}>
          <DailyWisdom style={{ color: colors.textSecondary }} />
        </View>
      </Animated.View>

      {/* Language */}
      <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="language-outline" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {language === 'en' ? 'Language' : 'භාෂාව'}
            </Text>
          </View>
          <View style={styles.optionRow}>
            <TouchableOpacity
              style={[
                styles.languageOption,
                { backgroundColor: language === 'en' ? colors.primary + '20' : colors.surface },
                language === 'en' && { borderColor: colors.primary },
                { borderColor: colors.border },
              ]}
              onPress={() => handleLanguageChange('en')}
            >
              <Text
                style={[
                  styles.languageOptionText,
                  { color: language === 'en' ? colors.primary : colors.textSecondary },
                ]}
              >
                English
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageOption,
                { backgroundColor: language === 'si' ? colors.primary + '20' : colors.surface },
                language === 'si' && { borderColor: colors.primary },
                { borderColor: colors.border },
              ]}
              onPress={() => handleLanguageChange('si')}
            >
              <Text
                style={[
                  styles.languageOptionText,
                  { color: language === 'si' ? colors.primary : colors.textSecondary },
                ]}
              >
                සිංහල
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Theme */}
      <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette-outline" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {language === 'en' ? 'Theme' : 'තේමාව'}
            </Text>
          </View>
          <View style={styles.optionRow}>
            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: mode === 'light' ? colors.primary + '20' : colors.surface },
                mode === 'light' && { borderColor: colors.primary },
                { borderColor: colors.border },
              ]}
              onPress={() => handleThemeChange('light')}
            >
              <Text style={styles.themeIcon}>☀️</Text>
              <Text
                style={[
                  styles.themeOptionText,
                  { color: mode === 'light' ? colors.primary : colors.textSecondary },
                ]}
              >
                {language === 'en' ? 'Light' : 'දීප්තිමත්'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: mode === 'dark' ? colors.primary + '20' : colors.surface },
                mode === 'dark' && { borderColor: colors.primary },
                { borderColor: colors.border },
              ]}
              onPress={() => handleThemeChange('dark')}
            >
              <Text style={styles.themeIcon}>🌙</Text>
              <Text
                style={[
                  styles.themeOptionText,
                  { color: mode === 'dark' ? colors.primary : colors.textSecondary },
                ]}
              >
                {language === 'en' ? 'Dark' : 'අඳුරු'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: mode === 'auto' ? colors.primary + '20' : colors.surface },
                mode === 'auto' && { borderColor: colors.primary },
                { borderColor: colors.border },
              ]}
              onPress={() => handleThemeChange('auto')}
            >
              <Text style={styles.themeIcon}>🔄</Text>
              <Text
                style={[
                  styles.themeOptionText,
                  { color: mode === 'auto' ? colors.primary : colors.textSecondary },
                ]}
              >
                {language === 'en' ? 'Auto' : 'ස්වයංක්‍රීය'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Daily Goal */}
      <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flag-outline" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {language === 'en' ? 'Daily Goal' : 'දෛනික ඉලක්කය'}
            </Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            {language === 'en'
              ? 'Set your daily practice target'
              : 'ඔබේ දෛනික පුරුදු ඉලක්කය සැකසීම'}
          </Text>
          <View style={styles.goalOptions}>
            {[10, 20, 30, 50].map((goal) => (
              <TouchableOpacity
                key={goal}
                style={[
                  styles.goalOption,
                  { backgroundColor: dailyGoal === goal ? colors.primary + '20' : colors.surface },
                  dailyGoal === goal && { borderColor: colors.primary },
                  { borderColor: colors.border },
                ]}
                onPress={() => handleDailyGoalChange(goal)}
              >
                <Text
                  style={[
                    styles.goalOptionText,
                    { color: dailyGoal === goal ? colors.primary : colors.textSecondary },
                  ]}
                >
                  {goal} XP
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Awareness Settings */}
      <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="leaf-outline" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {language === 'en' ? 'Awareness' : 'සැලකිල්ල'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.awarenessButton}
            onPress={handleLetGo}
          >
            <View style={styles.awarenessButtonContent}>
              <Text style={styles.awarenessIcon}>🪷</Text>
              <View style={styles.awarenessButtonTextContainer}>
                <Text style={[styles.awarenessButtonText, { color: colors.error }]}>
                  {language === 'en' ? 'Let Go' : 'අත් හරින්න'}
                </Text>
                <Text style={[styles.awarenessButtonSubtext, { color: colors.textSecondary }]}>
                  {language === 'en'
                    ? 'Clear all emotion data — practice non-attachment'
                    : 'සියලුම හැඟීම් දත්ත මකන්න — අනුබද්ධ නොවීම පුරුදු කරන්න'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.awarenessButton}
            onPress={handleResetOnboarding}
          >
            <View style={styles.awarenessButtonContent}>
              <Ionicons name="refresh-outline" size={24} color={colors.textSecondary} />
              <View style={styles.awarenessButtonTextContainer}>
                <Text style={[styles.awarenessButtonText, { color: colors.text }]}>
                  {language === 'en' ? 'Reset Tutorial' : 'පුහුණුව නැවත සැකසීම'}
                </Text>
                <Text style={[styles.awarenessButtonSubtext, { color: colors.textSecondary }]}>
                  {language === 'en' ? 'Show onboarding again' : 'නැවතත් පුහුණුව පෙන්වන්න'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Logout */}
      <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.card }]}
          onPress={logout}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>
            {language === 'en' ? 'Log Out' : 'ඉවත් වන්න'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100, // Extra padding for bottom tab bar
  },
  backButtonContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  wisdomContainer: {
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  languageOption: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  languageOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeOption: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  themeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  goalOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalOption: {
    flex: 1,
    minWidth: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  goalOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: colors.error + '40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutText: {
    fontSize: 17,
    fontWeight: '700',
  },
  awarenessButton: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border + '60',
  },
  awarenessButtonContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  awarenessIcon: {
    fontSize: 24,
  },
  awarenessButtonTextContainer: {
    flex: 1,
  },
  awarenessButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  awarenessButtonSubtext: {
    fontSize: 12,
    lineHeight: 16,
  },
});

