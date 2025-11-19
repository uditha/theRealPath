import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { STORAGE_KEYS } from '../../utils/constants';
import { EmotionTile } from '../../services/emotion.service';
import { EmotionType } from '../../utils/emotions';
import { getEmotionCounts } from '../../utils/kusalaCalculator';

interface KalyanamittaMessageProps {
  todayTiles: EmotionTile[];
}

interface Message {
  en: string;
  si: string;
}

const KALYANAMITTA_MESSAGES: {
  general: Message[];
  angerHeavy: Message[];
  joyHeavy: Message[];
  mixed: Message[];
} = {
  general: [
    {
      en: 'Be kind to yourself today — the path unfolds slowly.',
      si: 'අද ඔබටම කරුණාවන්ත වන්න — මාර්ගය ක්‍රමයෙන් හෙළි වේ.',
    },
    {
      en: 'Each step on the path matters, no matter how small.',
      si: 'මාර්ගයේ සෑම පියවරක්ම වැදගත්, කුඩා වුවද.',
    },
  ],
  angerHeavy: [
    {
      en: 'You felt anger today. That\'s okay. What matters is: you saw it.',
      si: 'ඔබ අද කෝපය දැනුනේය. එය හොඳයි. වැදගත් දෙය: ඔබ එය දුටුවේය.',
    },
    {
      en: 'Anger visited you today. Notice where it arises in your body.',
      si: 'කෝපය අද ඔබ හමුවිය. එය ශරීරයේ කොතැනදී පැන නගින්නේදැයි දැනගන්න.',
    },
  ],
  joyHeavy: [
    {
      en: 'Joy bloomed today—can you feel where it rests?',
      si: 'සතුට අද මල් හැපුණි—එය විවේක ගන්නා තැන ඔබට දැනෙනවාද?',
    },
    {
      en: 'Your garden is full of light today. Tend to it gently.',
      si: 'ඔබේ උයන අද ආලෝකයෙන් පිරී ඇත. එය මෘදුවෙන් රැකබලා ගන්න.',
    },
  ],
  mixed: [
    {
      en: 'The mind is full today—watch it kindly.',
      si: 'මනස අද පිරී ඇත—එය කරුණාවෙන් නරඹන්න.',
    },
    {
      en: 'Many emotions visited today. You observed them all—this is practice.',
      si: 'අද බොහෝ හැඟීම් හමු විය. ඔබ ඒවා සියල්ල නිරීක්ෂණය කළේය—මෙය පුරුදුවකි.',
    },
  ],
};

export default function KalyanamittaMessage({ todayTiles }: KalyanamittaMessageProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkAndShowMessage();
  }, []);

  const checkAndShowMessage = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const lastShown = await AsyncStorage.getItem(STORAGE_KEYS.KALYANAMITTA_SHOWN_DATE);

      if (lastShown !== today) {
        // Determine message type based on emotion patterns
        const emotionCounts = getEmotionCounts(todayTiles);
        const total = todayTiles.length;

        let messageType: 'general' | 'angerHeavy' | 'joyHeavy' | 'mixed' = 'general';
        let messages: Message[];

        if (total === 0) {
          return; // Don't show if no emotions
        }

        const angerCount = emotionCounts[EmotionType.ANGER_AVERSION] || 0;
        const joyCount = emotionCounts[EmotionType.JOY] || 0;
        const calmCount = emotionCounts[EmotionType.CALM_CLARITY] || 0;

        if (angerCount >= total * 0.4) {
          messageType = 'angerHeavy';
        } else if (joyCount + calmCount >= total * 0.5) {
          messageType = 'joyHeavy';
        } else if (total >= 5) {
          messageType = 'mixed';
        }

        messages = KALYANAMITTA_MESSAGES[messageType];
        const selectedMessage = messages[Math.floor(Math.random() * messages.length)];

        setMessage(selectedMessage);
        setShowMessage(true);
        await AsyncStorage.setItem(STORAGE_KEYS.KALYANAMITTA_SHOWN_DATE, today);

        // Fade in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      console.error('Error checking Kalyanamitta message:', error);
    }
  };

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowMessage(false);
      setMessage(null);
    });
  };

  if (!showMessage || !message) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          backgroundColor: colors.card,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleClose}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>×</Text>
      </TouchableOpacity>
      <Text style={styles.lotus}>🪷</Text>
      <Text style={[styles.message, { color: colors.text }]}>
        {language === 'en' ? message.en : message.si}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  closeIcon: {
    fontSize: 24,
    fontWeight: '300',
  },
  lotus: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.7,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
    paddingHorizontal: 8,
  },
});


