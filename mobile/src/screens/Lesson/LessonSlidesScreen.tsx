import React, { useEffect, useState, useRef } from 'react';
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
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { contentService, Lesson } from '../../services/content.service';
import { logger } from '../../utils/logger';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { getWorldTheme } from '../../utils/worldThemes';
import * as Haptics from 'expo-haptics';
import MonkBreathing from '../../components/MonkBreathing';
import SimpleVideoPlayer from '../../components/SimpleVideoPlayer';

const { width, height } = Dimensions.get('window');

// Spiritual dark theme color palette - warm and dimmed
const DARK_COLORS = {
  background: '#121212', // Dark base
  backgroundGradient: ['#121212', '#1D1B18'], // Soft warm gradient
  backgroundSecondary: '#2A2A2A',
  card: 'rgba(255, 255, 255, 0.08)', // Frosted glass base
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.5)',
  textWarm: 'rgba(255, 248, 240, 0.95)', // Warm tone for body text
  primary: '#66CC00',
  primaryLight: 'rgba(102, 204, 0, 0.2)',
  accent: '#D4B46C',
  border: 'rgba(255, 255, 255, 0.15)',
  glow: 'rgba(255, 215, 0, 0.3)', // Monk glow
};

export default function LessonSlidesScreen({ route, navigation }: any) {
  const { lessonId, review = false, legendary = false } = route.params || {};
  const { user } = useAuth();
  const { colors } = useTheme();
  const { language: contextLanguage, setLanguage: setContextLanguage, t } = useLanguage();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [language, setLanguage] = useState<'en' | 'si'>(contextLanguage);
  const [breathAnim] = useState(new Animated.Value(1));
  const [hasStarted, setHasStarted] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));
  const [reflectionVisible, setReflectionVisible] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const lessonStartTime = useRef<number>(Date.now());

  useEffect(() => {
    if (lessonId) {
      loadLesson();
    } else {
      setError('Lesson ID is missing');
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    // Breathing animation for monk - 2s loop as requested
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1.03,
          duration: 2000, // 2 seconds
          useNativeDriver: true,
        }),
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: 2000, // 2 seconds
          useNativeDriver: true,
        }),
      ])
    );
    breathing.start();
    return () => breathing.stop();
  }, []);

  // Removed button breathing and glow animations for better performance
  // Removed floating leaf animation for better performance

  // Sync with context language
  useEffect(() => {
    setLanguage(contextLanguage);
  }, [contextLanguage]);

  // Slide transition animation - optimized for faster transitions
  useEffect(() => {
    if (!lesson || !lesson.slides || lesson.slides.length === 0) return;
    
    slideAnim.setValue(0);
    setReflectionVisible(false);
    // Reduced duration from 500ms to 200ms for faster transitions
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Show reflection moment for explanation slides at the end
      const currentSlideData = lesson.slides[currentSlide];
      if (currentSlideData && currentSlideData.type === 'explanation' && currentSlide === lesson.slides.length - 1) {
        setTimeout(() => {
          setReflectionVisible(true);
          // Auto-hide after 1 second pause
          setTimeout(() => {
            setReflectionVisible(false);
          }, 1000);
        }, 200);
      }
    });
  }, [currentSlide, lesson]);

  const loadLesson = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load lesson data - this is the critical path
      const lessonData = await contentService.getLessonById(lessonId);
      setLesson(lessonData);
      
      // Reset start time when lesson loads
      lessonStartTime.current = Date.now();
      
      // Show lesson immediately - don't wait for startLesson API call
      setLoading(false);
      
      // Start lesson in background (non-blocking) - don't wait for it
      // This prevents the startLesson API delay from blocking the UI
      contentService.startLesson(lessonId)
        .then(() => {
          setHasStarted(true);
        })
        .catch((err) => {
          logger.debug('Could not start lesson', err);
          // Don't show error to user - this is not critical
        });
    } catch (error: any) {
      logger.error('Error loading lesson', error);
      setError(error.response?.data?.error || 'Failed to load lesson');
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

  const handleBack = () => {
    // Fixed: Added haptic feedback for navigation back
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentSlide > 0) {
      Alert.alert(
        language === 'en' ? 'Leave lesson?' : 'පාඩමෙන් ඉවත් වන්නද?',
        language === 'en' 
          ? 'Your progress will be saved.' 
          : 'ඔබේ ප්‍රගතිය සුරක්ෂිත කරනු ලැබේ.',
        [
          {
            text: language === 'en' ? 'Cancel' : 'අවලංගු කරන්න',
            style: 'cancel',
          },
          {
            text: language === 'en' ? 'Leave' : 'ඉවත් වන්න',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const handleNext = () => {
    // Fixed: Added haptic feedback for slide transition
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Removed monk bounce animation for better performance

    if (currentSlide === lesson!.slides.length - 1) {
      // Calculate time spent so far
      const timeSpent = Math.floor((Date.now() - lessonStartTime.current) / 1000);
      // Navigate to quiz - faster transition
      // Fixed: Added haptic feedback for quiz start
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 150, // Reduced from 300ms to 150ms
        useNativeDriver: true,
      }).start(() => {
        navigation.navigate('Quiz', { 
          lessonId, 
          lesson,
          timeSpent,
          review: review || false,
          legendary: legendary || false,
        });
      });
    } else {
      // Next slide - instant transition for better UX
      // Changed to immediate state update instead of fade out first
      setCurrentSlide(currentSlide + 1);
    }
  };

  // Get spiritual icon based on lesson type or theme
  const getSpiritualIcon = () => {
    const icons = ['🪷', '📜', '☸️', '🕉️', '📖', '🧘'];
    // Use lesson index or slide type to determine icon
    if (lesson) {
      const index = lesson.lesson_id ? parseInt(lesson.lesson_id.slice(-1), 16) % icons.length : 0;
      return icons[index];
    }
    return icons[0];
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: DARK_COLORS.background }]}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={DARK_COLORS.primary} />
            <Text style={[styles.loadingText, { color: DARK_COLORS.text }]}>
              {language === 'en' ? 'Loading lesson...' : 'පාඩම පූරණය වෙමින්...'}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: DARK_COLORS.background }]}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.errorText, { color: DARK_COLORS.text }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: DARK_COLORS.primary }]}
              onPress={() => {
                if (lessonId) loadLesson();
              }}
            >
              <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>
                {language === 'en' ? 'Retry' : 'නැවත උත්සාහ කරන්න'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!lesson || !lesson.slides || lesson.slides.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: DARK_COLORS.background }]}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.errorText, { color: DARK_COLORS.text }]}>
              {language === 'en' ? 'No slides found' : 'ස්ලයිඩ් හමු නොවීය'}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: DARK_COLORS.primary }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>
                {language === 'en' ? 'Go Back' : 'ආපසු යන්න'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const slide = lesson.slides[currentSlide];
  if (!slide) {
    return (
      <View style={[styles.container, { backgroundColor: DARK_COLORS.background }]}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.errorText, { color: DARK_COLORS.text }]}>
              {language === 'en' ? 'Slide not found' : 'ස්ලයිඩ් හමු නොවීය'}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const isLastSlide = currentSlide === lesson.slides.length - 1;
  const slideTypeLabel = getSlideTypeLabel(slide.type);
  // Check for video URL - handle both null and empty string cases
  const videoUrlEn = slide.videoUrlEn?.trim() || null;
  const videoUrlSi = slide.videoUrlSi?.trim() || null;
  const hasVideo = language === 'en' 
    ? !!videoUrlEn 
    : !!videoUrlSi;
  const videoUrl = language === 'en' ? videoUrlEn : videoUrlSi;
  
  // Debug: Log video URL info (remove in production)
  if (__DEV__) {
    console.log('Slide video URLs:', { 
      videoUrlEn: slide.videoUrlEn, 
      videoUrlSi: slide.videoUrlSi,
      language,
      hasVideo,
      videoUrl 
    });
  }
  
  // Check if this is the last explanation slide for reflection moment
  const isLastExplanationSlide = slide.type === 'explanation' && isLastSlide;

  const slideOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const slideTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  // Removed leaf and button animation interpolations for better performance

  return (
    <View style={styles.container}>
      {/* Spiritual Gradient Background */}
      <LinearGradient
        colors={DARK_COLORS.backgroundGradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Removed floating leaf animation for better performance */}

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Minimal Header Bar */}
        <View style={styles.header}>
          {/* Simple Round Back Button */}
          <TouchableOpacity 
            onPress={handleBack} 
            style={styles.roundBackButton}
            accessibilityLabel={language === 'en' ? 'Go back' : 'ආපසු යන්න'}
            accessibilityRole="button"
            accessibilityHint={language === 'en' ? 'Tap to return to previous screen' : 'පෙර තිරයට ආපසු යාමට තට්ටු කරන්න'}
          >
            <Ionicons name="chevron-back" size={22} color={DARK_COLORS.text} />
          </TouchableOpacity>
          
          {/* Progress Bar */}
          <View 
            style={styles.progressBarContainer}
            accessibilityRole="progressbar"
            accessibilityLabel={
              language === 'en'
                ? `Lesson progress: ${currentSlide + 1} of ${lesson.slides.length}`
                : `පාඩම් ප්‍රගතිය: ${currentSlide + 1} / ${lesson.slides.length}`
            }
            accessibilityValue={{
              min: 0,
              max: lesson.slides.length,
              now: currentSlide + 1,
            }}
          >
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill,
                  { width: `${((currentSlide + 1) / lesson.slides.length) * 100}%` }
                ]} 
              />
            </View>
          </View>
          
          {/* Language Toggle - Shows opposite language (what you can switch TO) */}
          <TouchableOpacity
            onPress={() => {
              const newLang = language === 'en' ? 'si' : 'en';
              setLanguage(newLang);
              setContextLanguage(newLang);
            }}
            style={styles.languageToggle}
            accessibilityLabel={
              language === 'en'
                ? 'Switch to Sinhala'
                : 'Switch to English'
            }
            accessibilityRole="button"
            accessibilityHint={
              language === 'en'
                ? 'Tap to switch lesson language to Sinhala'
                : 'පාඩමේ භාෂාව ඉංග්‍රීසියට මාරු කිරීමට තට්ටු කරන්න'
            }
          >
            <Text style={styles.languageText}>
              {language === 'en' ? 'SI' : 'EN'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.slideContent,
              {
                opacity: slideOpacity,
                transform: [{ translateY: slideTranslateY }],
              },
            ]}
          >
            {/* Character - Top Center with Glow */}
            <View style={styles.characterContainer}>
              <Animated.View
                style={[
                  styles.monkGlow,
                  {
                    transform: [{ scale: breathAnim }],
                  },
                ]}
              >
                <MonkBreathing size={100} />
              </Animated.View>
              <Text style={styles.characterLabel}>
                {language === 'en' ? 'Little Seeker' : 'කුඩා සොයන්නා'}
              </Text>
              <Text style={styles.characterSubtext}>
                {language === 'en' ? 'Breathe gently' : 'සන්සුන්ව හුස්ම ගන්න'}
              </Text>
            </View>

            {/* Lesson Title with Spiritual Icon */}
            <View style={styles.titleContainer}>
              <View style={styles.titleWithIcon}>
                <Text style={styles.titleIcon}>{getSpiritualIcon()}</Text>
                <Text style={[styles.lessonTitle, { marginLeft: 12 }]}>
                  {language === 'en' ? lesson.title.en : lesson.title.si}
                </Text>
              </View>
            </View>

            {/* Content Card - Frosted Glass / Sacred Teaching Tablet */}
            <View style={styles.contentCardWrapper}>
              <BlurView intensity={8} tint="dark" style={styles.blurOverlay}>
                <View style={styles.contentCard}>
                  {/* Slide Type Badge */}
                  <View style={styles.slideTypeBadge}>
                    <Text style={styles.slideTypeText}>
                      {slideTypeLabel[language]}
                    </Text>
                  </View>

                  {/* Body Text with Warm Tone */}
                  <Text style={styles.slideText}>
                    {language === 'en' ? slide.text.en : slide.text.si}
                  </Text>

                  {/* Reflection Moment - for explanation slides */}
                  {isLastExplanationSlide && reflectionVisible && (
                    <View style={styles.reflectionMoment}>
                      <Text style={styles.reflectionText}>
                        {language === 'en' ? 'Pause for a breath.' : 'හුස්මක් සඳහා නතර කරන්න.'}
                      </Text>
                      <Text style={styles.reflectionSubtext}>
                        {language === 'en' ? 'Notice how this feels.' : 'මෙය හැඟෙන ආකාරය සැලකිල්ලට ගන්න.'}
                      </Text>
                    </View>
                  )}

              {/* Image (if available) */}
              {slide.image && (
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: slide.image }}
                    style={styles.illustration}
                    resizeMode="cover"
                  />
                </View>
              )}

              {/* Video Button (if available) - opens modal with video player */}
              {hasVideo && videoUrl && (
                <TouchableOpacity 
                  style={styles.videoButton}
                  onPress={() => {
                    // Fixed: Added haptic feedback for video button
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowVideoPlayer(true);
                  }}
                  accessibilityLabel={language === 'en' ? 'Watch video' : 'වීඩියෝව නරඹන්න'}
                  accessibilityRole="button"
                  accessibilityHint={language === 'en' ? 'Tap to watch lesson video' : 'පාඩමේ වීඩියෝව නැරඹීමට තට්ටු කරන්න'}
                >
                  <LinearGradient
                    colors={['#F7DCA4', '#D9B36A']}
                    style={styles.videoButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.videoIcon}>▶</Text>
                    <Text style={styles.videoText}>
                      {language === 'en' ? 'Watch Video' : 'වීඩියෝව නරඹන්න'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* Removed mini monk animation for better performance */}
                </View>
              </BlurView>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Continue Button - Simplified for better performance */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleNext}
            activeOpacity={0.9}
            accessibilityLabel={
              isLastSlide
                ? (language === 'en' ? 'Start quiz' : 'ප්‍රශ්න පත්‍රය ආරම්භ කරන්න')
                : (language === 'en' ? 'Continue to next slide' : 'ඊළඟ ස්ලයිඩ් වෙත යන්න')
            }
            accessibilityRole="button"
            accessibilityHint={
              isLastSlide
                ? (language === 'en' ? 'Tap to start the lesson quiz' : 'පාඩමේ ප්‍රශ්න පත්‍රය ආරම්භ කිරීමට තට්ටු කරන්න')
                : (language === 'en' ? 'Tap to go to the next slide' : 'ඊළඟ ස්ලයිඩ් වෙත යාමට තට්ටු කරන්න')
            }
          >
            <LinearGradient
              colors={['#F5D08A', '#E8B86D', '#D9A55A']} // Smoother gradient
              style={styles.continueButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.continueButtonText}>
                {isLastSlide 
                  ? (language === 'en' ? 'Start Quiz →' : 'ප්‍රශ්න පත්‍රය ආරම්භ කරන්න →')
                  : (language === 'en' ? 'Continue →' : 'දිගටම →')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Simple Video Player Modal */}
      {hasVideo && videoUrl && (
        <SimpleVideoPlayer
          visible={showVideoPlayer}
          videoUri={videoUrl}
          title={language === 'en' ? lesson?.title.en : lesson?.title.si}
          onClose={() => setShowVideoPlayer(false)}
          onVideoEnd={() => {
            logger.debug('Video ended');
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_COLORS.background,
  },
  floatingLeaf: {
    position: 'absolute',
    top: 100,
    right: 30,
    zIndex: 1,
  },
  leafEmoji: {
    fontSize: 24,
    opacity: 0.4,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'System',
    color: DARK_COLORS.text,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: DARK_COLORS.text,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  roundBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    flex: 1,
    marginHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: DARK_COLORS.primary,
    borderRadius: 2,
  },
  languageToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 12,
    fontWeight: '700',
    color: DARK_COLORS.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  slideContent: {
    flex: 1,
  },
  characterContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingTop: 16,
  },
  characterCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  characterEmoji: {
    fontSize: 36,
  },
  characterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK_COLORS.text,
    marginTop: 4,
  },
  characterSubtext: {
    fontSize: 11,
    color: DARK_COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  titleContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
    // Fixed: Center and limit width for optimal readability
    alignItems: 'center',
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleIcon: {
    fontSize: 28,
  },
  lessonTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: DARK_COLORS.text,
    lineHeight: 32,
    letterSpacing: 0.3,
    textAlign: 'center',
    flex: 1,
    // Fixed: Limit title width for optimal readability
    maxWidth: 600,
    alignSelf: 'center',
  },
  monkGlow: {
    shadowColor: DARK_COLORS.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  contentCardWrapper: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
    // Fixed: Limit width for optimal line length (45-75 characters, ~600px)
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  blurOverlay: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  contentCard: {
    backgroundColor: DARK_COLORS.card,
    padding: 24,
    borderRadius: 24,
    minHeight: 200,
    position: 'relative',
    borderWidth: 1,
    borderColor: DARK_COLORS.border,
    // Inner shadow effect (simulated with overlay)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  reflectionMoment: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    // Fixed: Limit width for optimal readability
    maxWidth: 500,
    alignSelf: 'center',
  },
  reflectionText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: DARK_COLORS.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 24, // Fixed: Improved line height for readability
  },
  reflectionSubtext: {
    fontSize: 14,
    fontStyle: 'italic',
    color: DARK_COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 20, // Fixed: Improved line height for readability
  },
  slideTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: DARK_COLORS.primaryLight,
    borderRadius: 16,
    marginBottom: 16,
  },
  slideTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: DARK_COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  slideText: {
    fontSize: 17,
    lineHeight: 28, // Fixed: 1.65x line height for optimal readability
    color: DARK_COLORS.textWarm, // Warm tone for body text
    marginBottom: 16,
    fontFamily: 'System', // Will use serif if available
    // Fixed: Ensure text doesn't exceed optimal line length
    textAlign: 'left', // Left-aligned for better readability
  },
  imageContainer: {
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  illustration: {
    width: '100%',
    height: 200,
    backgroundColor: DARK_COLORS.backgroundSecondary,
  },
  videoButton: {
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  videoButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  videoIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    marginRight: 8,
  },
  videoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  miniMonk: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniMonkEmoji: {
    fontSize: 32,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  continueButton: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#F5D08A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
  },
  buttonBreathingRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#F5D08A',
    backgroundColor: 'transparent',
  },
  buttonGlowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 28,
  },
  continueButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
