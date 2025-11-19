import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { spacing } from '../../utils/spacing';
import { cornerRadius } from '../../utils/cornerRadius';
import { askKalyanamitta } from '../../services/kalyanamitta.service';
import { KalyanamittaResponse } from '../../services/kalyanamitta.service';
import * as Haptics from 'expo-haptics';

export default function KalyanamittaQuestionScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!question.trim()) {
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const response: KalyanamittaResponse = await askKalyanamitta(question.trim());
      
      // Navigate to reply screen with the response
      navigation.navigate('KalyanamittaReply', {
        response,
        question: question.trim(),
      });
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        language === 'en' ? 'Error' : 'දෝෂය',
        error.message || (language === 'en' 
          ? 'Something went wrong. Please try again.' 
          : 'දෝෂයක් සිදු විය. කරුණාකර නැවත උත්සාහ කරන්න.'),
        [{ text: language === 'en' ? 'OK' : 'හරි' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
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
                {language === 'en' ? 'Ask Kalyāṇamitta' : 'කල්‍යාණමිත්තාගෙන් අසන්න'}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {language === 'en'
                  ? 'A gentle Dhamma companion to guide you with wisdom and compassion.'
                  : 'ඔබට ඥානයෙන් සහ කරුණාවෙන් මඟ පෙන්වන මෘදු ධර්ම සගයෙක්.'}
              </Text>
            </View>
          </View>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
              <Text style={styles.iconEmoji}>🪷</Text>
            </View>
          </View>

          {/* Question Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              {language === 'en' ? 'Your Question' : 'ඔබේ ප්‍රශ්නය'}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder={language === 'en' 
                ? 'What would you like guidance on?' 
                : 'ඔබට මඟ පෙන්වීමක් අවශ්‍ය වන්නේ කුමක් පිළිබඳවද?'}
              placeholderTextColor={colors.textTertiary}
              value={question}
              onChangeText={setQuestion}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              editable={!loading}
              accessibilityLabel={language === 'en' ? 'Question input' : 'ප්‍රශ්න ආදානය'}
            />
            <Text style={[styles.hintText, { color: colors.textTertiary }]}>
              {language === 'en'
                ? 'Ask about emotions, relationships, work, or any life challenge.'
                : 'හැඟීම්, සම්බන්ධතා, වැඩ, හෝ ජීවිතයේ ඕනෑම අභියෝගයක් ගැන ප්‍රශ්න කරන්න.'}
            </Text>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: question.trim() && !loading ? colors.primary : colors.border,
              },
            ]}
            onPress={handleSubmit}
            disabled={!question.trim() || loading}
            activeOpacity={0.8}
            accessibilityLabel={language === 'en' ? 'Submit question' : 'ප්‍රශ්නය ඉදිරිපත් කරන්න'}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>
                  {language === 'en' ? 'Ask Kalyāṇamitta' : 'කල්‍යාණමිත්තාගෙන් අසන්න'}
                </Text>
                <Ionicons name="send" size={20} color="#FFFFFF" style={styles.sendIcon} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
      flexGrow: 1,
      paddingHorizontal: spacing.md + spacing.xs, // 20px
      paddingTop: spacing.md, // 16px
      paddingBottom: spacing.xl, // 32px
    },
    header: {
      marginBottom: spacing.xl, // 32px
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
      marginBottom: spacing.sm, // 8px
    },
    subtitle: {
      fontSize: 16,
      lineHeight: 22,
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: spacing.xl, // 32px
    },
    iconCircle: {
      width: 80,
      height: 80,
      borderRadius: cornerRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconEmoji: {
      fontSize: 40,
    },
    inputContainer: {
      marginBottom: spacing.lg, // 24px
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: spacing.sm, // 8px
    },
    textInput: {
      minHeight: 120,
      padding: spacing.md, // 16px
      borderRadius: cornerRadius.lg, // 16px
      borderWidth: 1,
      fontSize: 16,
      lineHeight: 22,
      marginBottom: spacing.sm, // 8px
    },
    hintText: {
      fontSize: 14,
      lineHeight: 20,
    },
    buttonContainer: {
      paddingHorizontal: spacing.md + spacing.xs, // 20px
      paddingBottom: spacing.md + spacing.xs, // 20px
      paddingTop: spacing.sm, // 8px
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    submitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md, // 16px
      paddingHorizontal: spacing.lg, // 24px
      borderRadius: cornerRadius.lg, // 16px
      gap: spacing.sm, // 8px
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
    },
    sendIcon: {
      marginLeft: spacing.xs, // 4px
    },
  });

