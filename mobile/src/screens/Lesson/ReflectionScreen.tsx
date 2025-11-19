import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { contentService } from '../../services/content.service';
import { logger } from '../../utils/logger';

export default function ReflectionScreen({ route, navigation }: any) {
  const { lessonId, lesson, score, correctCount, totalQuestions, timeSpent: timeSpentBeforeReflection = 0, review = false, legendary = false } = route.params;
  const { colors } = useTheme();
  const { language, t } = useLanguage();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [otherText, setOtherText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const reflectionStartTime = React.useRef(Date.now());
  
  // Store selected reflection to ensure consistency during the session
  const [selectedReflection] = React.useState(() => {
    const reflection = lesson?.reflection;
    // If reflection is already set (from backend), use it
    // Otherwise, this will be set when lesson data is loaded
    return reflection;
  });

  const reflection = selectedReflection || lesson?.reflection;
  const options = language === 'en' 
    ? reflection?.options?.en || []
    : reflection?.options?.si || [];
  const prompt = language === 'en'
    ? reflection?.prompt?.en || ''
    : reflection?.prompt?.si || '';

  const handleOptionToggle = (option: string) => {
    if (selectedOptions.includes(option)) {
      setSelectedOptions(selectedOptions.filter((o) => o !== option));
    } else {
      setSelectedOptions([...selectedOptions, option]);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Submit reflection
      if (reflection) {
        // Transform data to match backend API format
        // Backend expects: answerText, selectedOptionEn, selectedOptionSi
        // At least one of these must be provided
        const reflectionData: {
          answerText?: string;
          selectedOptionEn?: string;
          selectedOptionSi?: string;
        } = {};
        
        // Add selected options based on language (if any selected)
        if (selectedOptions.length > 0) {
          const selectedOptionsString = selectedOptions.join(', ');
          if (language === 'en') {
            reflectionData.selectedOptionEn = selectedOptionsString;
          } else {
            reflectionData.selectedOptionSi = selectedOptionsString;
          }
        }
        
        // Add answerText if "Other" is selected AND has text
        // Note: We always send selectedOptions (which includes "Other") even if otherText is empty
        // This ensures validation passes - if user selects "Other" but doesn't fill text,
        // we still send selectedOptionEn/Si with "Other" in it
        if (isOtherSelected && otherText) {
          reflectionData.answerText = otherText;
        }
        
        await contentService.submitReflection(lessonId, reflectionData);
      }

      // Calculate total time spent (including reflection time)
      const reflectionTimeSpent = Math.floor((Date.now() - reflectionStartTime.current) / 1000);
      const totalTimeSpent = timeSpentBeforeReflection + reflectionTimeSpent;

      // Complete lesson
      const response = await contentService.completeLesson(lessonId, {
        score: score || 0,
        correctCount: correctCount || 0,
        totalQuestions: totalQuestions || 0,
        heartsLost: 0,
        review: review || false,
        legendary: legendary || false,
      });

      const responseData = response.data || response;

      // Extract XP from response - check multiple possible locations
      const xpEarned = responseData?.xpEarned || responseData?.xp || responseData?.rewards?.xp || lesson?.rewards?.xp || 0;

      // Navigate to completion screen
      navigation.navigate('LessonComplete', {
        lesson,
        xpEarned: xpEarned,
        unlockedCards: responseData?.unlockedCards || responseData?.cards_unlocked || [],
        streak: responseData?.streak,
        score: score || 0,
        timeSpent: totalTimeSpent,
      });
    } catch (error) {
      logger.error('Error submitting reflection', error);
      // Calculate total time even on error
      const reflectionTimeSpent = Math.floor((Date.now() - reflectionStartTime.current) / 1000);
      const totalTimeSpent = timeSpentBeforeReflection + reflectionTimeSpent;
      
      // Still navigate to completion
      navigation.navigate('LessonComplete', {
        lesson,
        xpEarned: lesson?.rewards?.xp || 0,
        unlockedCards: [],
        score: score || 0,
        timeSpent: totalTimeSpent,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const styles = createStyles(colors);
  const isOtherSelected = selectedOptions.includes(
    language === 'en' ? 'Other' : 'වෙන එකක්'
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>🔙</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>🧘</Text>
            <Text style={styles.headerSubtitle}>
              {language === 'en' ? 'Reflection' : 'පරාවර්තනය'}
            </Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Prompt */}
          <View style={styles.promptContainer}>
            <Text style={styles.promptText}>{prompt}</Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionChip,
                  selectedOptions.includes(option) && styles.optionChipSelected,
                ]}
                onPress={() => handleOptionToggle(option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedOptions.includes(option) && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
                {selectedOptions.includes(option) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Other Text Input */}
          {isOtherSelected && (
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder={
                  language === 'en' 
                    ? 'Tell us more...' 
                    : 'තව දුරටත් පවසන්න...'
                }
                placeholderTextColor={colors.textTertiary}
                value={otherText}
                onChangeText={setOtherText}
                multiline
                numberOfLines={4}
              />
            </View>
          )}

          {/* Info Text */}
          <Text style={styles.infoText}>
            {language === 'en'
              ? 'This reflection helps you internalize what you learned.'
              : 'මෙම පරාවර්තනය ඔබ ඉගෙන ගත් දේ අභ්‍යන්තරීකරණය කිරීමට උපකාරී වේ.'}
          </Text>

          {/* CTA to Awareness */}
          <TouchableOpacity
            style={styles.awarenessCTA}
            onPress={() => {
              navigation.getParent()?.getParent()?.navigate('MainTabs', {
                screen: 'AwarenessTab',
                params: {
                  screen: 'Awareness',
                },
              });
            }}
          >
            <Text style={styles.awarenessCTAText}>
              🪷 {language === 'en' ? 'Note this in Awareness' : 'සැලකිල්ලෙන් මෙය සටහන් කරන්න'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (selectedOptions.length === 0 && !isOtherSelected) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting || (selectedOptions.length === 0 && !isOtherSelected)}
          >
            {submitting ? (
              <ActivityIndicator color={colors.buttonText} />
            ) : (
              <Text style={styles.submitButtonText}>
                {language === 'en' ? 'Save & Finish' : 'සුරකින්න සහ අවසන් කරන්න'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  promptContainer: {
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
  },
  promptText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 28,
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    gap: 8,
  },
  optionChipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.primary,
  },
  checkmark: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: 'bold',
  },
  textInputContainer: {
    marginBottom: 24,
  },
  textInput: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButton: {
    backgroundColor: colors.button,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.button,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textTertiary,
    shadowOpacity: 0,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.buttonText,
  },
  awarenessCTA: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  awarenessCTAText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});

