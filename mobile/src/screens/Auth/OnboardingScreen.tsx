import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { userService } from '../../services/user.service';

const { width } = Dimensions.get('window');

interface OnboardingScreenProps {
  navigation: any;
}

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const { colors } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState(10);
  const scrollViewRef = useRef<ScrollView>(null);
  const [pageAnim] = useState(new Animated.Value(0));

  const pages = [
    {
      title: { en: 'RealPath', si: 'රියල්පාත්' },
      subtitle: { en: 'Learn the real Dhamma in tiny steps', si: 'කුඩා පියවරවලින් සැබෑ ධර්මය ඉගෙන ගන්න' },
      description: {
        en: 'Master the Tripiṭaka through gentle, daily practice',
        si: 'සන්සුන්, දෛනික පුහුණුවක් හරහා ත්‍රිපිටකය ප්‍රගුණ කරන්න',
      },
    },
    {
      title: { en: 'Benefits', si: 'ප්‍රයෝජන' },
      subtitle: { en: 'What you\'ll gain', si: 'ඔබ ලබන දේ' },
      benefits: [
        { en: 'Calmer mind', si: 'සන්සුන් මනස' },
        { en: 'Wisdom & understanding', si: 'ඥානය සහ අවබෝධය' },
        { en: 'Daily habit of learning', si: 'ඉගෙනීමේ දෛනික පුරුද්ද' },
        { en: 'Progress tracking', si: 'ප්‍රගතිය ලුහුබැඳීම' },
      ],
    },
    {
      title: { en: 'Choose Language', si: 'භාෂාව තෝරන්න' },
      subtitle: { en: 'Select your preferred language', si: 'ඔබේ කැමති භාෂාව තෝරන්න' },
      isLanguagePage: true,
    },
    {
      title: { en: 'Daily Goal', si: 'දෛනික ඉලක්කය' },
      subtitle: { en: 'How much time per day?', si: 'දිනකට කොපමණ කාලයක්?' },
      isGoalPage: true,
    },
  ];

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      scrollViewRef.current?.scrollTo({ x: nextPage * width, animated: true });
    }
  };

  const handleBack = () => {
    if (currentPage > 0) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      scrollViewRef.current?.scrollTo({ x: prevPage * width, animated: true });
    }
  };

  const handleLanguageSelect = async (lang: 'en' | 'si') => {
    await setLanguage(lang);
  };

  const handleGoalSelect = (goal: number) => {
    setSelectedGoal(goal);
  };

  const handleContinueWithEmail = () => {
    navigation.navigate('Login');
  };

  const handleContinueAsGuest = async () => {
    // Set preferences for guest
    await setLanguage(language);
    // Navigate to app (will need guest mode support)
    // For now, just navigate to login
    navigation.navigate('Login');
  };

  const handleFinish = async () => {
    try {
      // Save preferences if user is logged in
      // For now, just navigate to login
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error saving preferences', error);
      navigation.navigate('Login');
    }
  };

  const styles = createStyles(colors);
  const page = pages[currentPage];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Progress Dots */}
        <View style={styles.progressContainer}>
          {pages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentPage && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          style={styles.scrollView}
        >
          {pages.map((pageData, index) => (
            <View key={index} style={styles.page}>
              <View style={styles.pageContent}>
                {/* Page 1: Welcome */}
                {index === 0 && (
                  <>
                    <View style={styles.characterContainer}>
                      <Text style={styles.characterEmoji}>🧘</Text>
                    </View>
                    <Text style={styles.pageTitle}>
                      {pageData.title[language]}
                    </Text>
                    <Text style={styles.pageSubtitle}>
                      {pageData.subtitle[language]}
                    </Text>
                    <Text style={styles.pageDescription}>
                      {pageData.description[language]}
                    </Text>
                  </>
                )}

                {/* Page 2: Benefits */}
                {index === 1 && (
                  <>
                    <Text style={styles.pageTitle}>
                      {pageData.title[language]}
                    </Text>
                    <Text style={styles.pageSubtitle}>
                      {pageData.subtitle[language]}
                    </Text>
                    <View style={styles.benefitsList}>
                      {pageData.benefits?.map((benefit, i) => (
                        <View key={i} style={styles.benefitItem}>
                          <Text style={styles.benefitIcon}>✨</Text>
                          <Text style={styles.benefitText}>
                            {benefit[language]}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {/* Page 3: Language Selection */}
                {index === 2 && (
                  <>
                    <Text style={styles.pageTitle}>
                      {pageData.title[language]}
                    </Text>
                    <Text style={styles.pageSubtitle}>
                      {pageData.subtitle[language]}
                    </Text>
                    <View style={styles.optionsContainer}>
                      <TouchableOpacity
                        style={[
                          styles.optionCard,
                          language === 'en' && styles.optionCardActive,
                        ]}
                        onPress={() => handleLanguageSelect('en')}
                      >
                        <Text style={styles.optionEmoji}>🇬🇧</Text>
                        <Text
                          style={[
                            styles.optionText,
                            language === 'en' && styles.optionTextActive,
                          ]}
                        >
                          English
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.optionCard,
                          language === 'si' && styles.optionCardActive,
                        ]}
                        onPress={() => handleLanguageSelect('si')}
                      >
                        <Text style={styles.optionEmoji}>🇱🇰</Text>
                        <Text
                          style={[
                            styles.optionText,
                            language === 'si' && styles.optionTextActive,
                          ]}
                        >
                          සිංහල
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {/* Page 4: Daily Goal */}
                {index === 3 && (
                  <>
                    <Text style={styles.pageTitle}>
                      {pageData.title[language]}
                    </Text>
                    <Text style={styles.pageSubtitle}>
                      {pageData.subtitle[language]}
                    </Text>
                    <View style={styles.goalsContainer}>
                      {[5, 10, 15, 20].map((goal) => (
                        <TouchableOpacity
                          key={goal}
                          style={[
                            styles.goalCard,
                            selectedGoal === goal && styles.goalCardActive,
                          ]}
                          onPress={() => handleGoalSelect(goal)}
                        >
                          <Text
                            style={[
                              styles.goalValue,
                              selectedGoal === goal && styles.goalValueActive,
                            ]}
                          >
                            {goal}
                          </Text>
                          <Text
                            style={[
                              styles.goalLabel,
                              selectedGoal === goal && styles.goalLabelActive,
                            ]}
                          >
                            {language === 'en' ? 'minutes' : 'මිනිත්තු'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {currentPage > 0 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
            >
              <Text style={styles.backButtonText}>
                {language === 'en' ? 'Back' : 'ආපසු'}
              </Text>
            </TouchableOpacity>
          )}

          {currentPage < pages.length - 1 ? (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>
                {language === 'en' ? 'Next' : 'ඊළඟ'} →
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.finishButtons}>
              <TouchableOpacity
                style={styles.guestButton}
                onPress={handleContinueAsGuest}
              >
                <Text style={styles.guestButtonText}>
                  {language === 'en' ? 'Continue as Guest' : 'අමුත්තන් ලෙස දිගටම'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.emailButton}
                onPress={handleContinueWithEmail}
              >
                <Text style={styles.emailButtonText}>
                  {language === 'en' ? 'Continue with Email' : 'ඊමේල් සමඟ දිගටම'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 20,
    paddingBottom: 20,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  page: {
    width,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  pageContent: {
    alignItems: 'center',
  },
  characterContainer: {
    marginBottom: 32,
  },
  characterEmoji: {
    fontSize: 80,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: 20,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  pageDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  benefitsList: {
    width: '100%',
    gap: 16,
    marginTop: 32,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  benefitIcon: {
    fontSize: 24,
  },
  benefitText: {
    fontSize: 18,
    color: colors.text,
    flex: 1,
  },
  optionsContainer: {
    width: '100%',
    gap: 16,
    marginTop: 32,
  },
  optionCard: {
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  optionText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  optionTextActive: {
    color: colors.primary,
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 32,
    width: '100%',
  },
  goalCard: {
    width: '45%',
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  goalCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  goalValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  goalValueActive: {
    color: colors.primary,
  },
  goalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  goalLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  backButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  nextButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.button,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.buttonText,
  },
  finishButtons: {
    flex: 1,
    gap: 12,
  },
  guestButton: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  emailButton: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.button,
    alignItems: 'center',
  },
  emailButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.buttonText,
  },
});










