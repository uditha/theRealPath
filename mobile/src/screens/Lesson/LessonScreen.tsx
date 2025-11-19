import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { contentService, Lesson } from '../../services/content.service';
import { logger } from '../../utils/logger';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const { width } = Dimensions.get('window');

// Note: This file (LessonScreen.tsx) is deprecated - use LessonSlidesScreen.tsx instead
// Keeping for backward compatibility but createStyles moved before component to fix syntax errors
const createStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: 16, fontSize: 16, color: colors.textSecondary },
  errorText: { fontSize: 16, color: colors.error, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: colors.button, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryButtonText: { color: colors.buttonText, fontSize: 16, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24 },
  headerCenter: { flex: 1, alignItems: 'center' },
  progressText: { fontSize: 16, fontWeight: '600', color: colors.text },
  headerRight: { width: 40, alignItems: 'flex-end' },
  calmLabel: { fontSize: 12, color: colors.primary, fontWeight: '500' },
  content: { flex: 1 },
  contentContainer: { paddingBottom: 100 },
  characterContainer: { alignItems: 'center', paddingVertical: 24 },
  characterCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  characterEmoji: { fontSize: 40 },
  characterLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 4 },
  characterSubtext: { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic' },
  titleContainer: { paddingHorizontal: 20, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lessonTitle: { fontSize: 22, fontWeight: '700', color: colors.text, flex: 1, lineHeight: 30 },
  languageToggle: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.primaryLight, borderRadius: 16, marginLeft: 12 },
  languageText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  contentBox: { backgroundColor: colors.card, marginHorizontal: 20, marginBottom: 16, padding: 24, borderRadius: 20, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  slideTypeBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.primaryLight, borderRadius: 12, marginBottom: 16 },
  slideTypeText: { fontSize: 11, fontWeight: '600', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  slideText: { fontSize: 17, lineHeight: 26, color: colors.text, marginBottom: 16 },
  imageContainer: { marginTop: 16, alignItems: 'center' },
  illustration: { width: width - 80, height: 200, borderRadius: 12 },
  videoButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.button, marginHorizontal: 20, marginBottom: 16, padding: 16, borderRadius: 16, shadowColor: colors.button, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  videoIcon: { fontSize: 20, color: colors.buttonText, marginRight: 8 },
  videoText: { fontSize: 14, fontWeight: '600', color: colors.buttonText },
  reflectionContainer: { backgroundColor: colors.card, marginHorizontal: 20, marginBottom: 16, padding: 24, borderRadius: 20, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  reflectionPrompt: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 16, lineHeight: 24 },
  reflectionOptions: { gap: 12 },
  reflectionOption: { padding: 16, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  reflectionOptionText: { fontSize: 15, color: colors.text, textAlign: 'center' },
  footer: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, shadowColor: colors.shadow, shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 5 },
  continueButton: { backgroundColor: colors.button, paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: colors.button, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  continueButtonText: { fontSize: 17, fontWeight: '700', color: colors.buttonText, letterSpacing: 0.5 },
});

export default function LessonScreen({ route, navigation }: any) {
  const { lessonId } = route.params || {};
  const { user } = useAuth();
  const { colors } = useTheme();
  const { language: contextLanguage, setLanguage: setContextLanguage, t } = useLanguage();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [language, setLanguage] = useState<'en' | 'si'>(contextLanguage);
  const [breathAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (lessonId) {
      loadLesson();
    } else {
      setError('Lesson ID is missing');
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    // Breathing animation for character
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    breathing.start();
    return () => breathing.stop();
  }, []);

  const loadLesson = async () => {
    try {
      setLoading(true);
      setError(null);
      const lessonData = await contentService.getLessonById(lessonId);
      setLesson(lessonData);
    } catch (error: any) {
      logger.error('Error loading lesson', error);
      setError(error.response?.data?.error || 'Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  const getSlideTypeLabel = (type: string) => {
    const labels: { [key: string]: { en: string; si: string } } = {
      explanation: { en: 'Explanation', si: 'පැහැදිලි කිරීම' },
      story: { en: 'Story', si: 'කතාව' },
      summary: { en: 'Summary', si: 'සාරාංශය' },
      example: { en: 'Example', si: 'උදාහරණය' },
      reflection: { en: 'Reflection', si: 'පරාවර්තනය' },
    };
    return labels[type] || { en: type, si: type };
  };

  const styles = createStyles(colors);

  // Sync with context language
  useEffect(() => {
    setLanguage(contextLanguage);
  }, [contextLanguage]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading lesson...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            if (lessonId) loadLesson();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!lesson) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Lesson not found</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!lesson.slides || lesson.slides.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>No slides found in this lesson</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const slide = lesson.slides[currentSlide];
  if (!slide) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Slide not found</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLastSlide = currentSlide === lesson.slides.length - 1;
  const slideTypeLabel = getSlideTypeLabel(slide.type);
  const hasVideo = language === 'en' 
    ? !!slide.videoUrlEn 
    : !!slide.videoUrlSi;
  const videoUrl = language === 'en' ? slide.videoUrlEn : slide.videoUrlSi;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>🔙</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.progressText}>
            {currentSlide + 1}/{lesson.slides.length}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.calmLabel}>🕊️ Calm Lesson</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated Character */}
        <View style={styles.characterContainer}>
          <Animated.View
            style={[
              styles.characterCircle,
              {
                transform: [{ scale: breathAnim }],
              },
            ]}
          >
            <Text style={styles.characterEmoji}>🧘</Text>
          </Animated.View>
          <Text style={styles.characterLabel}>Little Seeker</Text>
          <Text style={styles.characterSubtext}>breathing softly</Text>
        </View>

        {/* Lesson Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.lessonTitle}>
            {language === 'en' ? lesson.title.en : lesson.title.si}
          </Text>
          <TouchableOpacity
            onPress={() => {
              const newLang = language === 'en' ? 'si' : 'en';
              setLanguage(newLang);
              setContextLanguage(newLang);
            }}
            style={styles.languageToggle}
          >
            <Text style={styles.languageText}>
              {language === 'en' ? 'සිංහල' : 'English'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content Box */}
        <View style={styles.contentBox}>
          <View style={styles.slideTypeBadge}>
            <Text style={styles.slideTypeText}>
              {language === 'en' ? slideTypeLabel.en : slideTypeLabel.si}
            </Text>
          </View>

          <Text style={styles.slideText}>
            {language === 'en' ? slide.text.en : slide.text.si}
          </Text>

          {/* Illustration */}
          {slide.image && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: slide.image }}
                style={styles.illustration}
                resizeMode="contain"
              />
            </View>
          )}
        </View>

        {/* Video Button (if available) */}
        {hasVideo && videoUrl && (
          <TouchableOpacity 
            style={styles.videoButton}
            onPress={() => {
              // TODO: Open video player modal
              // navigation.navigate('VideoPlayer', { videoUrl });
            }}
          >
            <Text style={styles.videoIcon}>▶</Text>
            <Text style={styles.videoText}>WATCH VIDEO (30 sec)</Text>
          </TouchableOpacity>
        )}

        {/* Reflection Options (if reflection slide) */}
        {slide.type === 'reflection' && lesson.reflection && (
          <View style={styles.reflectionContainer}>
            <Text style={styles.reflectionPrompt}>
              {language === 'en'
                ? lesson.reflection.prompt.en
                : lesson.reflection.prompt.si}
            </Text>
            <View style={styles.reflectionOptions}>
              {(language === 'en'
                ? lesson.reflection.options.en
                : lesson.reflection.options.si
              ).map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.reflectionOption}
                  onPress={() => {
                    // Handle reflection selection
                    if (!isLastSlide) {
                      setCurrentSlide(currentSlide + 1);
                    }
                  }}
                >
                  <Text style={styles.reflectionOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => {
            if (isLastSlide) {
              navigation.navigate('Quiz', { lessonId, lesson });
            } else {
              setCurrentSlide(currentSlide + 1);
            }
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            {isLastSlide ? 'Start Quiz →' : 'Continue →'}
          </Text>
        </TouchableOpacity>
      </View>
      </View>
    </SafeAreaView>
  );
}
