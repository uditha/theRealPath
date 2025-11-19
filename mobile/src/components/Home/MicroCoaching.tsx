import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { EmotionTile } from '../../services/emotion.service';
import { EmotionType } from '../../utils/emotions';
import { getEmotionCounts } from '../../utils/kusalaCalculator';

interface MicroCoachingProps {
  todayTiles: EmotionTile[];
}

interface CoachingMessage {
  en: string;
  si: string;
}

const COACHING_MESSAGES: {
  anger: CoachingMessage[];
  joy: CoachingMessage[];
  mixed: CoachingMessage[];
  calm: CoachingMessage[];
  default: CoachingMessage[];
} = {
  anger: [
    {
      en: 'Anger visited you today. Notice where it arises in your body.',
      si: 'කෝපය අද ඔබ හමුවිය. එය ශරීරයේ කොතැනදී පැන නගින්නේදැයි දැනගන්න.',
    },
    {
      en: 'You observed anger today—this awareness is the practice.',
      si: 'ඔබ අද කෝපය නිරීක්ෂණය කළේය—මෙම සැලකිල්ල පුරුදුවයි.',
    },
  ],
  joy: [
    {
      en: 'Joy bloomed today—can you feel where it rests?',
      si: 'සතුට අද මල් හැපුණි—එය විවේක ගන්නා තැන ඔබට දැනෙනවාද?',
    },
    {
      en: 'Happiness visited you today. Notice how it feels in your body.',
      si: 'සතුට අද ඔබ හමුවිය. එය ශරීරයේ දැනෙන ආකාරය දැනගන්න.',
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
  calm: [
    {
      en: 'Calm settled in today. Notice the peace in your body.',
      si: 'සන්සුන්තාව අද ස්ථාපිත විය. ඔබේ ශරීරයේ සාමය දැනගන්න.',
    },
    {
      en: 'Clarity visited you today. This is the fruit of awareness.',
      si: 'පැහැදිලිකම අද ඔබ හමුවිය. මෙය සැලකිල්ලේ පලයි.',
    },
  ],
  default: [
    {
      en: 'Each emotion observed is a step on the path.',
      si: 'නිරීක්ෂණය කරන සෑම හැඟීමක්ම මාර්ගයේ පියවරකි.',
    },
  ],
};

export default function MicroCoaching({ todayTiles }: MicroCoachingProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();

  if (todayTiles.length === 0) {
    return null;
  }

  const emotionCounts = getEmotionCounts(todayTiles);
  const total = todayTiles.length;

  // Determine message type
  let messageType: 'anger' | 'joy' | 'mixed' | 'calm' | 'default' = 'default';
  let messages: CoachingMessage[];

  const angerCount = emotionCounts[EmotionType.ANGER_AVERSION] || 0;
  const joyCount = emotionCounts[EmotionType.JOY] || 0;
  const calmCount = emotionCounts[EmotionType.CALM_CLARITY] || 0;
  const reactiveCount =
    (emotionCounts[EmotionType.ANGER_AVERSION] || 0) +
    (emotionCounts[EmotionType.CRAVING] || 0) +
    (emotionCounts[EmotionType.FEAR_CONFUSION] || 0) +
    (emotionCounts[EmotionType.SADNESS_GRIEF] || 0);

  if (angerCount >= total * 0.3) {
    messageType = 'anger';
  } else if (joyCount >= total * 0.3) {
    messageType = 'joy';
  } else if (calmCount >= total * 0.4) {
    messageType = 'calm';
  } else if (total >= 5 && reactiveCount > 0 && (joyCount + calmCount) > 0) {
    messageType = 'mixed';
  }

  messages = COACHING_MESSAGES[messageType];
  const selectedMessage = messages[Math.floor(Math.random() * messages.length)];

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {language === 'en' ? selectedMessage.en : selectedMessage.si}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});


