import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AwarenessOnboardingProps {
  visible: boolean;
  onComplete: () => void;
}

interface OnboardingStep {
  emoji: string;
  titleEn: string;
  titleSi: string;
  descriptionEn: string;
  descriptionSi: string;
}

const STEPS: OnboardingStep[] = [
  {
    emoji: '🪷',
    titleEn: 'Welcome to Mind Mirror',
    titleSi: 'මනසේ කැඩපතට සාදරයෙන් පිළිගනිමු',
    descriptionEn: 'A non-judgmental space to note your emotions mindfully, inspired by Satipaṭṭhāna practice.',
    descriptionSi: 'ඔබේ හැඟීම් සැලකිලිමත්ව සටහන් කිරීමට නිර්දෝෂී අවකාශයක්, සතිපට්ඨාන පුරුදුවෙන් ප්‍රේරණය වී ඇත.',
  },
  {
    emoji: '👆',
    titleEn: 'Tap Emotions to Note Them',
    titleSi: 'හැඟීම් සටහන් කිරීමට තට්ටු කරන්න',
    descriptionEn: 'Simply tap an emotion icon below when you notice it. Each tap creates a colored tile in your daily grid.',
    descriptionSi: 'ඔබ හැඟීමක් දුටු විට පහත හැඟීම් නිරූපකයක් තට්ටු කරන්න. සෑම තට්ටුවක්ම ඔබේ දෛනික කොටුවේ වර්ණවත් ටයිලයක් නිර්මාණය කරයි.',
  },
  {
    emoji: '📊',
    titleEn: 'View Patterns Over Time',
    titleSi: 'කාලයත් සමඟ රටා බලන්න',
    descriptionEn: 'Switch between daily and weekly views to see your emotional patterns. No judgment—just awareness.',
    descriptionSi: 'ඔබේ චිත්තවේගීය රටා දැකීමට දෛනික සහ සතික දර්ශන අතර මාරු වන්න. විනිශ්චයක් නැත—සැලකිල්ල පමණි.',
  },
  {
    emoji: '🧘',
    titleEn: 'Weekly Reflection Insights',
    titleSi: 'සතික පරාවර්තන තීරණ',
    descriptionEn: 'Each week, reflect on your patterns with gentle insights. Connect your awareness to deeper learning.',
    descriptionSi: 'සෑම සතියකම, මෘදු තීරණ සමඟ ඔබේ රටා පිළිබඳව පරාවර්තනය කරන්න. ඔබේ සැලකිල්ල ගැඹුරු ඉගෙනීමට සම්බන්ධ කරන්න.',
  },
];

export default function AwarenessOnboarding({ visible, onComplete }: AwarenessOnboardingProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
      setCurrentStep(0);
    }
  }, [visible]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onComplete();
    });
  };

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleComplete}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Step Indicator */}
            <View style={styles.indicatorContainer}>
              {STEPS.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    {
                      backgroundColor:
                        index === currentStep ? colors.primary : colors.border,
                      width: index === currentStep ? 24 : 8,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.emoji}>{step.emoji}</Text>
              <Text style={[styles.title, { color: colors.text }]}>
                {language === 'en' ? step.titleEn : step.titleSi}
              </Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {language === 'en' ? step.descriptionEn : step.descriptionSi}
              </Text>
            </View>

            {/* Navigation Buttons */}
            <View style={styles.buttonContainer}>
              {currentStep > 0 && (
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton, { borderColor: colors.border }]}
                  onPress={handlePrevious}
                >
                  <Text style={[styles.buttonText, { color: colors.text }]}>
                    {language === 'en' ? 'Back' : 'ආපසු'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleNext}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                    {isLastStep
                      ? language === 'en'
                        ? 'Got it'
                        : 'තේරුණා'
                      : language === 'en'
                      ? 'Next'
                      : 'ඊළඟ'}
                  </Text>
                  {!isLastStep && (
                    <Ionicons name="chevron-forward" size={20} color="#FFFFFF" style={{ marginLeft: 4 }} />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  scrollContent: {
    padding: 24,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    transition: 'all 0.3s',
  },
  content: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryButton: {
    // Gradient handled by LinearGradient
  },
  secondaryButton: {
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});


