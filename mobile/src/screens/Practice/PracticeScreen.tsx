import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Flower2, Wind, Heart, Brain, Cloud, Pause, Waves, Footprints, MessageCircle, User, Mountain, Sun } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { spacing } from '../../utils/spacing';
import { cornerRadius } from '../../utils/cornerRadius';
import * as Haptics from 'expo-haptics';

interface Practice {
  id: string;
  titleEn: string;
  titleSi: string;
  categoryEn: string;
  categorySi: string;
  descriptionEn: string;
  descriptionSi: string;
  duration: string;
  icon: React.ComponentType<any>;
  iconColor: string;
}

const PRACTICES: Practice[] = [
  {
    id: 'anapanasati',
    titleEn: 'Mindful Breathing (Ānāpānasati)',
    titleSi: 'සැලකිලිමත් හුස්ම (ආනාපානසති)',
    categoryEn: 'Breath',
    categorySi: 'හුස්ම',
    descriptionEn: 'Observe the breath with gentle awareness.',
    descriptionSi: 'මෘදු සැලකිල්ලකින් හුස්ම නිරීක්ෂණය කරන්න.',
    duration: '1–3 min',
    icon: Wind,
    iconColor: '#87CEEB',
  },
  {
    id: 'noting',
    titleEn: 'Noting (Mindful Labelling)',
    titleSi: 'නම් කිරීම (සැලකිලිමත් නම් කිරීම)',
    categoryEn: 'Mindfulness',
    categorySi: 'සැලකිල්ල',
    descriptionEn: 'Notice your mind. Label what\'s happening — thinking, planning, worrying.',
    descriptionSi: 'ඔබේ මනස නිරීක්ෂණය කරන්න. සිදුවන දේ නම් කරන්න — සිතනවා, සැලසුම් කරනවා, කරදර වනවා.',
    duration: '1–2 min',
    icon: Cloud,
    iconColor: '#8EC6C5',
  },
  {
    id: 'metta',
    titleEn: 'Loving-Kindness (Metta)',
    titleSi: 'කරුණාව (මෙත්තා)',
    categoryEn: 'Heart',
    categorySi: 'හදවත',
    descriptionEn: 'Send gentle goodwill to yourself and others. A warm heart calms the mind.',
    descriptionSi: 'ඔබට සහ අනෙක් අයට මෘදු යහපත යවන්න. උණුසුම් හදවතක් මනස සන්සුන් කරයි.',
    duration: '1–3 min',
    icon: Heart,
    iconColor: '#D4A5A5',
  },
  {
    id: 'pause',
    titleEn: 'Pause Before Reaction',
    titleSi: 'ප්‍රතික්‍රියාවට පෙර නවත්වන්න',
    categoryEn: 'Wisdom',
    categorySi: 'ඥානය',
    descriptionEn: 'Train your mind to stop, breathe, and respond wisely.',
    descriptionSi: 'නවත්වන්න, හුස්ම ගන්න, සහ නුවණින් ප්‍රතිචාර දක්වන ලෙස ඔබේ මනස පුහුණු කරන්න.',
    duration: '10–20 sec',
    icon: Pause,
    iconColor: '#9FB8D0',
  },
  {
    id: 'sound',
    titleEn: 'Sound Awareness',
    titleSi: 'ශබ්ද සැලකිල්ල',
    categoryEn: 'Mindfulness',
    categorySi: 'සැලකිල්ල',
    descriptionEn: 'Listen to sounds without naming or judging them.',
    descriptionSi: 'නම් නොකර, විනිශ්චය නොකර ශබ්ද අසන්න.',
    duration: '1–2 min',
    icon: Waves,
    iconColor: '#4A5F8A',
  },
  {
    id: 'walking',
    titleEn: 'Walking Meditation',
    titleSi: 'ඇවිදීමේ භාවනාව',
    categoryEn: 'Mindfulness',
    categorySi: 'සැලකිල්ල',
    descriptionEn: 'Walk slowly and observe each step with awareness.',
    descriptionSi: 'මන්දගාමීව ඇවිදින්න සහ සැලකිලිමත්ව සෑම පියවරක්ම නිරීක්ෂණය කරන්න.',
    duration: '1–3 min',
    icon: Footprints,
    iconColor: '#7EA87C',
  },
  {
    id: 'lettinggo',
    titleEn: 'Letting Go Practice',
    titleSi: 'මුදා හැරීමේ පුරුදුව',
    categoryEn: 'Wisdom',
    categorySi: 'ඥානය',
    descriptionEn: 'Release thoughts and emotions gently — feel the mind become lighter.',
    descriptionSi: 'සිතුවිලි සහ හැඟීම් මෘදුවෙන් මුදා හරින්න — මනස සැහැල්ලු වන බව දැනෙන්න.',
    duration: '1–2 min',
    icon: Cloud,
    iconColor: '#C8B8E6',
  },
  {
    id: 'thoughtbubbles',
    titleEn: 'Mindful Thought Bubbles',
    titleSi: 'සැලකිලිමත් සිතුවිලි බුබුළු',
    categoryEn: 'Wisdom',
    categorySi: 'ඥානය',
    descriptionEn: 'Watch thoughts arise and pass like bubbles in the mind.',
    descriptionSi: 'සිතුවිලි මනසේ බුබුළු මෙන් ඇති වීම සහ අතුරුදහන් වීම නිරීක්ෂණය කරන්න.',
    duration: '1–2 min',
    icon: MessageCircle,
    iconColor: '#A7D3F5',
  },
  {
    id: 'bodyscan',
    titleEn: 'Body Scan',
    titleSi: 'ශරීර ස්කෑන්',
    categoryEn: 'Mindfulness',
    categorySi: 'සැලකිල්ල',
    descriptionEn: 'Scan your body from head to toe — release tension and rest deeply.',
    descriptionSi: 'හිසේ සිට පාදය දක්වා ඔබේ ශරීරය ස්කෑන් කරන්න — ආතතිය මුදා හරින්න සහ ගැඹුරින් විවේක ගන්න.',
    duration: '2–4 min',
    icon: User,
    iconColor: '#DCD5C9',
  },
  {
    id: 'equanimity',
    titleEn: 'Equanimity (Upekkhā)',
    titleSi: 'සමතුලිතතාවය (උපේක්ඛා)',
    categoryEn: 'Wisdom',
    categorySi: 'ඥානය',
    descriptionEn: 'Train a steady, peaceful mind that stays balanced in all situations.',
    descriptionSi: 'සියලු තත්වයන්හිදී සමතුලිතව පවතින ස්ථාවර, සාමකාමී මනසක් පුහුණු කරන්න.',
    duration: '1–2 min',
    icon: Mountain,
    iconColor: '#8FA3B8',
  },
  {
    id: 'compassion',
    titleEn: 'Compassion (Karunā)',
    titleSi: 'කරුණාව (කරුණා)',
    categoryEn: 'Heart',
    categorySi: 'හදවත',
    descriptionEn: 'Send gentle compassion to someone who is suffering… or to yourself.',
    descriptionSi: 'දුක් විඳින කෙනෙකුට මෘදු කරුණාව යවන්න… හෝ ඔබටම.',
    duration: '1–3 min',
    icon: Heart,
    iconColor: '#E9B6B6',
  },
  {
    id: 'mudita',
    titleEn: 'Appreciative Joy (Mudita)',
    titleSi: 'ප්‍රශංසා සතුට (මුදිතා)',
    categoryEn: 'Heart',
    categorySi: 'හදවත',
    descriptionEn: 'Celebrate the happiness and success of others — and yourself.',
    descriptionSi: 'අනෙක් අයගේ සතුට සහ සාර්ථකත්වය සැමරීම — සහ ඔබටම.',
    duration: '1–2 min',
    icon: Sun,
    iconColor: '#F5D76E',
  },
];

export default function PracticeScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePracticePress = (practice: Practice) => {
    // Fixed: Added haptic feedback for practice selection
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (practice.id === 'anapanasati') {
      navigation.navigate('PracticeDetail', { practiceId: practice.id });
    } else if (practice.id === 'noting') {
      navigation.navigate('NotingPractice');
    } else if (practice.id === 'metta') {
      navigation.navigate('MettaPractice');
    } else if (practice.id === 'pause') {
      navigation.navigate('PausePractice');
    } else if (practice.id === 'sound') {
      navigation.navigate('SoundAwareness');
    } else if (practice.id === 'walking') {
      navigation.navigate('WalkingMeditation');
    } else if (practice.id === 'lettinggo') {
      navigation.navigate('LettingGo');
    } else if (practice.id === 'thoughtbubbles') {
      navigation.navigate('ThoughtBubbles');
    } else if (practice.id === 'bodyscan') {
      navigation.navigate('BodyScan');
    } else if (practice.id === 'equanimity') {
      navigation.navigate('Equanimity');
    } else if (practice.id === 'compassion') {
      navigation.navigate('Compassion');
    } else if (practice.id === 'mudita') {
      navigation.navigate('Mudita');
    }
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        accessibilityLabel={language === 'en' ? 'Practice screen content' : 'පුරුදු තිරයේ අන්තර්ගතය'}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={[styles.title, { color: colors.text }]}>
                {language === 'en' ? 'Practice' : 'පුරුදුව'}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {language === 'en'
                  ? 'Short practices to train mindfulness, heart, and wisdom.'
                  : 'සැලකිල්ල, හදවත සහ ඥානය පුහුණු කිරීමට කෙටි පුරුදු.'}
              </Text>
            </View>
            <View style={[styles.headerIcon, { backgroundColor: colors.primary + '20' }]}>
              <Flower2 size={24} color={colors.primary} strokeWidth={1.5} />
            </View>
          </View>
        </Animated.View>

        {/* Practice Cards */}
        <Animated.View 
          style={[styles.practicesContainer, { opacity: fadeAnim }]}
          accessibilityRole="list"
        >
          {PRACTICES.map((practice, index) => {
            const IconComponent = practice.icon;
            const practiceTitle = language === 'en' ? practice.titleEn : practice.titleSi;
            const practiceCategory = language === 'en' ? practice.categoryEn : practice.categorySi;
            return (
              <TouchableOpacity
                key={practice.id}
                style={[styles.practiceCard, { backgroundColor: colors.card }]}
                onPress={() => handlePracticePress(practice)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${practiceTitle}, ${practiceCategory} practice, ${practice.duration}`}
                accessibilityHint={
                  language === 'en'
                    ? `Tap to start ${practiceTitle} practice`
                    : `${practiceTitle} පුරුදුව ආරම්භ කිරීමට තට්ටු කරන්න`
                }
              >
                <View style={styles.practiceCardContent}>
                  {/* Icon Circle */}
                  <View
                    style={[
                      styles.practiceIconContainer,
                      { backgroundColor: practice.iconColor + '20' },
                    ]}
                  >
                    <IconComponent size={28} color={practice.iconColor} strokeWidth={2} />
                  </View>

                  {/* Content */}
                  <View style={styles.practiceContent}>
                    <View style={styles.practiceHeader}>
                      <Text style={[styles.practiceTitle, { color: colors.text }]}>
                        {language === 'en' ? practice.titleEn : practice.titleSi}
                      </Text>
                      <View style={[styles.categoryBadge, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                          {language === 'en' ? practice.categoryEn : practice.categorySi}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.practiceDescription, { color: colors.textSecondary }]}>
                      {language === 'en' ? practice.descriptionEn : practice.descriptionSi}
                    </Text>
                    <View style={styles.practiceFooter}>
                      <View style={styles.durationContainer}>
                        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.durationText, { color: colors.textSecondary }]}>
                          {practice.duration}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Coming Soon Message */}
        <Animated.View style={[styles.comingSoonContainer, { opacity: fadeAnim }]}>
          <Text style={[styles.comingSoonText, { color: colors.textSecondary }]}>
            {language === 'en'
              ? 'More practices coming soon...'
              : 'තවත් පුරුදු ඉක්මනින් පැමිණේ...'}
          </Text>
        </Animated.View>
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
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: spacing.md + spacing.xs, // Fixed: 20px -> 20px
      paddingBottom: spacing.xxl * 2.5, // Fixed: 100px -> 100px (closest: 96px = 12*8, but keeping 100 for tab bar)
    },
    header: {
      marginBottom: spacing.xl, // Fixed: 32px -> spacing.xl (32px)
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    headerLeft: {
      flex: 1,
      marginRight: spacing.md, // Fixed: 16px -> spacing.md (16px)
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      lineHeight: 22,
      fontStyle: 'italic',
    },
    headerIcon: {
      width: 56,
      height: 56,
      borderRadius: cornerRadius.full, // Fixed: 28px -> cornerRadius.full (circular icon)
      alignItems: 'center',
      justifyContent: 'center',
    },
    practicesContainer: {
      gap: spacing.md, // Fixed: 16px -> spacing.md (16px)
    },
    practiceCard: {
      borderRadius: cornerRadius.xl, // Fixed: 20px -> cornerRadius.xl (20px)
      padding: spacing.md + spacing.xs, // Fixed: 20px -> 20px
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: spacing.sm, // Fixed: 8px -> spacing.sm (8px)
      elevation: 3,
    },
    practiceCardContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    practiceIconContainer: {
      width: spacing.xxxl, // Fixed: 64px -> spacing.xxxl (64px = 8*8)
      height: spacing.xxxl, // Fixed: 64px -> spacing.xxxl (64px)
      borderRadius: cornerRadius.full, // Fixed: 32px -> cornerRadius.full (circular container)
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md, // Fixed: 16px -> spacing.md (16px)
    },
    practiceContent: {
      flex: 1,
    },
    practiceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      flexWrap: 'wrap',
      gap: 8,
    },
    practiceTitle: {
      fontSize: 18,
      fontWeight: '700',
      flex: 1,
      minWidth: '60%',
    },
    categoryBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: cornerRadius.md, // Fixed: 12px -> cornerRadius.md (12px)
    },
    categoryText: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    practiceDescription: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 12,
    },
    practiceFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    durationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    durationText: {
      fontSize: 13,
      fontWeight: '500',
    },
    comingSoonContainer: {
      marginTop: 32,
      alignItems: 'center',
      paddingVertical: 20,
    },
    comingSoonText: {
      fontSize: 13,
      fontStyle: 'italic',
    },
  });

