import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { spacing } from '../../utils/spacing';
import { cornerRadius } from '../../utils/cornerRadius';
import { KalyanamittaResponse } from '../../services/kalyanamitta.service';
import { getPracticeNavigationParams } from '../../utils/practiceMapping';
import * as Haptics from 'expo-haptics';

export default function KalyanamittaReplyScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { response, question } = route.params || {};

  // Safety check - if no response, go back
  useEffect(() => {
    if (!response) {
      navigation.goBack();
    }
  }, [response, navigation]);
  
  if (!response) {
    return null;
  }

  const handlePracticePress = () => {
    if (!response?.practice_suggestion?.show || !response?.practice_suggestion?.id) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const navParams = getPracticeNavigationParams(response.practice_suggestion.id);
    if (navParams) {
      // Navigate to PracticeTab first, then to the specific practice screen
      navigation.getParent()?.navigate('PracticeTab', {
        screen: navParams.screen,
        params: navParams.params,
      });
    }
  };

  const handleAskAnother = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('KalyanamittaQuestion');
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityLabel={language === 'en' ? 'Go back' : 'ආපසු යන්න'}
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.text }]}>
              {language === 'en' ? 'Kalyāṇamitta\'s Response' : 'කල්‍යාණමිත්තාගේ ප්‍රතිචාරය'}
            </Text>
          </View>
        </View>

        {/* Question Display */}
        <View style={[styles.questionCard, { backgroundColor: colors.card }]}>
          <View style={styles.questionHeader}>
            <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.questionLabel, { color: colors.textSecondary }]}>
              {language === 'en' ? 'Your Question' : 'ඔබේ ප්‍රශ්නය'}
            </Text>
          </View>
          <Text style={[styles.questionText, { color: colors.text }]}>{question}</Text>
        </View>

        {/* Dhamma Explanation Block */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>🪷</Text>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {language === 'en' ? 'Dhamma in Simple Words' : 'සරල වචනවලින් ධර්මය'}
            </Text>
          </View>
          <Text style={[styles.cardContent, { color: colors.text }]}>
            {response.dhamma_explanation}
          </Text>
        </View>

        {/* Practical Advice Block */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>🌿</Text>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {language === 'en' ? 'What You Can Do' : 'ඔබට කළ හැකි දේ'}
            </Text>
          </View>
          <Text style={[styles.cardContent, { color: colors.text }]}>
            {response.practical_advice}
          </Text>
        </View>

        {/* Short Reflection Block */}
        <View style={[styles.card, styles.reflectionCard, { backgroundColor: colors.primaryLight + '40' }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>🧘</Text>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {language === 'en' ? 'Try This Now' : 'දැන් මෙය උත්සාහ කරන්න'}
            </Text>
          </View>
          <Text style={[styles.cardContent, { color: colors.text }]}>
            {response.short_reflection}
          </Text>
        </View>

        {/* Practice Suggestion Block */}
        {response.practice_suggestion.show && response.practice_suggestion.name && (
          <TouchableOpacity
            style={[styles.card, styles.practiceCard, { backgroundColor: colors.card }]}
            onPress={handlePracticePress}
            activeOpacity={0.7}
            accessibilityLabel={
              language === 'en'
                ? `Start ${response.practice_suggestion.name} practice`
                : `${response.practice_suggestion.name} පුරුදුව ආරම්භ කරන්න`
            }
            accessibilityRole="button"
          >
            <View style={styles.practiceCardContent}>
              <View style={styles.practiceCardHeader}>
                <Text style={styles.practiceEmoji}>📿</Text>
                <View style={styles.practiceHeaderText}>
                  <Text style={[styles.practiceTitle, { color: colors.text }]}>
                    {language === 'en' ? 'RealPath Practice' : 'RealPath පුරුදුව'}
                  </Text>
                  <Text style={[styles.practiceName, { color: colors.primary }]}>
                    {response.practice_suggestion.name}
                  </Text>
                </View>
              </View>
              {response.practice_suggestion.reason && (
                <Text style={[styles.practiceReason, { color: colors.textSecondary }]}>
                  {response.practice_suggestion.reason}
                </Text>
              )}
              <View style={[styles.practiceButton, { backgroundColor: colors.primary }]}>
                <Text style={styles.practiceButtonText}>
                  {language === 'en' ? 'Start Practice' : 'පුරුදුව ආරම්භ කරන්න'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Ask Another Question Button */}
        <TouchableOpacity
          style={[styles.askAnotherButton, { borderColor: colors.border }]}
          onPress={handleAskAnother}
          activeOpacity={0.7}
          accessibilityLabel={language === 'en' ? 'Ask another question' : 'තවත් ප්‍රශ්නයක් අසන්න'}
          accessibilityRole="button"
        >
          <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
          <Text style={[styles.askAnotherText, { color: colors.primary }]}>
            {language === 'en' ? 'Ask Another Question' : 'තවත් ප්‍රශ්නයක් අසන්න'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.md + spacing.xs, // 20px
      paddingTop: spacing.md, // 16px
      paddingBottom: spacing.xxl * 2.5, // 100px for tab bar clearance
    },
    header: {
      marginBottom: spacing.lg, // 24px
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'flex-start',
      marginBottom: spacing.md, // 16px
    },
    headerContent: {
      marginTop: spacing.sm, // 8px
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 34,
    },
    questionCard: {
      padding: spacing.md + spacing.xs, // 20px
      borderRadius: cornerRadius.lg, // 16px
      marginBottom: spacing.lg, // 24px
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    questionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm, // 8px
      marginBottom: spacing.sm, // 8px
    },
    questionLabel: {
      fontSize: 14,
      fontWeight: '600',
    },
    questionText: {
      fontSize: 16,
      lineHeight: 22,
    },
    card: {
      padding: spacing.md + spacing.xs, // 20px
      borderRadius: cornerRadius.lg, // 16px
      marginBottom: spacing.lg, // 24px
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    reflectionCard: {
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md, // 16px
      gap: spacing.sm, // 8px
    },
    cardEmoji: {
      fontSize: 24,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '700',
      lineHeight: 24,
    },
    cardContent: {
      fontSize: 16,
      lineHeight: 24,
    },
    practiceCard: {
      borderWidth: 1,
      borderColor: colors.primary + '20',
    },
    practiceCardContent: {
      gap: spacing.md, // 16px
    },
    practiceCardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm, // 8px
    },
    practiceEmoji: {
      fontSize: 24,
    },
    practiceHeaderText: {
      flex: 1,
    },
    practiceTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: spacing.xs, // 4px
    },
    practiceName: {
      fontSize: 18,
      fontWeight: '700',
      lineHeight: 24,
    },
    practiceReason: {
      fontSize: 15,
      lineHeight: 22,
    },
    practiceButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm + spacing.xs, // 12px
      paddingHorizontal: spacing.md, // 16px
      borderRadius: cornerRadius.md, // 12px
      gap: spacing.sm, // 8px
      marginTop: spacing.xs, // 4px
    },
    practiceButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    askAnotherButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md, // 16px
      paddingHorizontal: spacing.lg, // 24px
      borderRadius: cornerRadius.lg, // 16px
      borderWidth: 1,
      gap: spacing.sm, // 8px
      marginTop: spacing.md, // 16px
    },
    askAnotherText: {
      fontSize: 16,
      fontWeight: '600',
    },
  });

