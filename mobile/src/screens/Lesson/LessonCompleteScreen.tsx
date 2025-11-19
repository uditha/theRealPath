import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const { width } = Dimensions.get('window');

const createStyles = (colors: any, isPerfect: boolean) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  charactersContainer: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  pathLine: {
    position: 'absolute',
    bottom: 0,
    width: '80%',
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
  },
  characterLeft: {
    position: 'absolute',
    left: '20%',
    bottom: 10,
    alignItems: 'center',
  },
  characterRight: {
    position: 'absolute',
    right: '20%',
    bottom: 0,
    alignItems: 'center',
  },
  characterCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  characterEmoji: {
    fontSize: 40,
  },
  characterFeet: {
    flexDirection: 'row',
    gap: 8,
  },
  foot: {
    width: 12,
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
  },
  petal: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    opacity: 0.7,
  },
  petal1: {
    left: '10%',
    top: '60%',
    backgroundColor: '#FF6B6B',
  },
  petal2: {
    left: '20%',
    top: '70%',
    backgroundColor: '#4ECDC4',
  },
  petal3: {
    right: '15%',
    top: '60%',
    backgroundColor: '#FFE66D',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#E0E0E0',
    marginBottom: 40,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
    gap: 10,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  statBoxXP: {
    backgroundColor: '#FFD700',
  },
  statBoxTime: {
    backgroundColor: '#6B9BD1',
  },
  statBoxScore: {
    backgroundColor: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statIcon: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  awarenessCTA: {
    marginBottom: 16,
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

interface LessonCompleteScreenProps {
  route: any;
  navigation: any;
}

export default function LessonCompleteScreen({ route, navigation }: LessonCompleteScreenProps) {
  const { colors } = useTheme();
  const { language, t } = useLanguage();
  const { lesson, xpEarned, unlockedCards, streak, score, timeSpent } = route.params || {};
  
  const [scaleAnim] = React.useState(new Animated.Value(0));
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [bounceAnim] = React.useState(new Animated.Value(0));
  const confettiAnimations = useRef(
    Array.from({ length: 20 }, () => ({
      x: new Animated.Value((Math.random() - 0.5) * width),
      y: new Animated.Value(-50),
      opacity: new Animated.Value(1),
      scale: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    // Main celebration animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    // Confetti animation
    confettiAnimations.forEach((confetti, index) => {
      Animated.parallel([
        Animated.timing(confetti.y, {
          toValue: Dimensions.get('window').height + 100,
          duration: 3000 + Math.random() * 2000,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.timing(confetti.opacity, {
          toValue: 0,
          duration: 3000,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(confetti.scale, {
              toValue: 1.2,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(confetti.scale, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    });
  }, []);

  const bounceTranslate = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const isPerfect = score === 100;
  const titleText = isPerfect 
    ? (language === 'en' ? 'Perfect lesson!' : 'පරිපූර්ණ පාඩම!')
    : (language === 'en' ? 'Lesson complete!' : 'පාඩම සම්පූර්ණයි!');
  const subtitleText = isPerfect
    ? (language === 'en' ? 'Take a bow!' : 'අභිවාදනය!')
    : (language === 'en' ? 'Great job!' : 'හොඳයි!');

  const styles = createStyles(colors, isPerfect);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Confetti */}
      {confettiAnimations.map((confetti, index) => {
        const colorsArray = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8B94'];
        const confettiColor = colorsArray[index % colorsArray.length];
        return (
          <Animated.View
            key={index}
            style={[
              styles.confetti,
              {
                backgroundColor: confettiColor,
                transform: [
                  { translateX: confetti.x },
                  { translateY: confetti.y },
                  { scale: confetti.scale },
                ],
                opacity: confetti.opacity,
              },
            ]}
          />
        );
      })}

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Characters on line */}
        <View style={styles.charactersContainer}>
          <View style={styles.pathLine} />
          
          {/* Left Character (Monk/Owl) */}
          <Animated.View
            style={[
              styles.characterLeft,
              {
                transform: [{ translateY: bounceTranslate }],
              },
            ]}
          >
            <View style={styles.characterCircle}>
              <Text style={styles.characterEmoji}>🧘</Text>
            </View>
            <View style={styles.characterFeet}>
              <View style={styles.foot} />
              <View style={styles.foot} />
            </View>
          </Animated.View>

          {/* Right Character (Human) */}
          <Animated.View
            style={[
              styles.characterRight,
              {
                transform: [{ translateY: bounceTranslate }],
              },
            ]}
          >
            <View style={styles.characterCircle}>
              <Text style={styles.characterEmoji}>🙏</Text>
            </View>
            <View style={styles.characterFeet}>
              <View style={styles.foot} />
              <View style={styles.foot} />
            </View>
          </Animated.View>

          {/* Flower petals */}
          <View style={[styles.petal, styles.petal1]} />
          <View style={[styles.petal, styles.petal2]} />
          <View style={[styles.petal, styles.petal3]} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{titleText}</Text>
        <Text style={styles.subtitle}>{subtitleText}</Text>

        {/* Stats Boxes */}
        <View style={styles.statsContainer}>
          {/* Total XP */}
          <View style={[styles.statBox, styles.statBoxXP]}>
            <Text style={styles.statLabel}>
              {language === 'en' ? 'TOTAL XP' : 'සම්පූර්ණ XP'}
            </Text>
            <View style={styles.statContent}>
              <Text style={styles.statIcon}>⚡</Text>
              <Text style={styles.statValue}>{xpEarned || 0}</Text>
            </View>
          </View>

          {/* Time */}
          <View style={[styles.statBox, styles.statBoxTime]}>
            <Text style={styles.statLabel}>
              {language === 'en' ? 'TIME' : 'කාලය'}
            </Text>
            <View style={styles.statContent}>
              <Text style={styles.statIcon}>⏱️</Text>
              <Text style={styles.statValue}>
                {timeSpent ? `${Math.floor(timeSpent / 60)}:${String(timeSpent % 60).padStart(2, '0')}` : '0:00'}
              </Text>
            </View>
          </View>

          {/* Score */}
          <View style={[styles.statBox, styles.statBoxScore]}>
            <Text style={styles.statLabel}>
              {language === 'en' ? 'SCORE' : 'ලකුණ'}
            </Text>
            <View style={styles.statContent}>
              <Text style={styles.statIcon}>🎯</Text>
              <Text style={styles.statValue}>{score || 0}%</Text>
            </View>
          </View>
        </View>

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

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => {
            // Navigate back to Path tab
            navigation.getParent()?.getParent()?.navigate('MainTabs', {
              screen: 'PathTab',
            });
          }}
        >
          <Text style={styles.continueButtonText}>
            {language === 'en' ? 'Back to Path' : 'මාර්ගයට ආපසු'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
      </View>
    </SafeAreaView>
  );
}
