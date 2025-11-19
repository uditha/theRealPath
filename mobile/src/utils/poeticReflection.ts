import { EmotionType, getEmotion, EMOTIONS } from './emotions';
import { WeeklyGrid } from '../services/emotion.service';

interface PoeticInsight {
  type: 'opening' | 'dominant' | 'pattern' | 'observation' | 'closing';
  textEn: string;
  textSi: string;
}

/**
 * Template-based poetic reflection generator
 * No external APIs - pure template system with emotion data mapping
 */

const OPENING_TEMPLATES: Array<{ textEn: string; textSi: string }> = [
  {
    textEn: 'Your week carried the weight of blue rains',
    textSi: 'ඔබේ සතිය නිල් වැසි බර රැගෙන ගියේය',
  },
  {
    textEn: 'This week, your garden told a story',
    textSi: 'මෙම සතියේ, ඔබේ උයන කතාවක් කීවේය',
  },
  {
    textEn: 'Seven days of emotional weather',
    textSi: 'හැඟීම්කාරී කාලගුණික දින හතක්',
  },
];

const CLOSING_TEMPLATES: Array<{ textEn: string; textSi: string }> = [
  {
    textEn: 'Remember: These patterns are neither good nor bad. They simply reflect your awareness practice.',
    textSi: 'මතක තබා ගන්න: මෙම රටා හොඳ හෝ නරක නොවේ. ඒවා ඔබේ සැලකිල්ල පුරුදුව පිළිබිඹු කරයි.',
  },
  {
    textEn: 'Each emotion is a seed. Mindfulness is the gardener who watches everything.',
    textSi: 'සෑම හැඟීමක්ම බීජයකි. සැලකිල්ල යනු සියල්ල නරඹන උයන්වැවියාය.',
  },
  {
    textEn: 'Your awareness grows with each observation.',
    textSi: 'ඔබේ සැලකිල්ල සෑම නිරීක්ෂණයකින්ම වර්ධනය වේ.',
  },
];

const getEmotionMetaphor = (emotion: EmotionType, language: 'en' | 'si'): string => {
  const emotionDef = getEmotion(emotion);
  
  const metaphors: Record<EmotionType, { en: string; si: string }> = {
    [EmotionType.JOY]: { en: 'golden flowers', si: 'රන්වන් මල්' },
    [EmotionType.CALM_CLARITY]: { en: 'calm waters', si: 'සන්සුන් ජලය' },
    [EmotionType.SADNESS_GRIEF]: { en: 'blue rains', si: 'නිල් වැසි' },
    [EmotionType.ANGER_AVERSION]: { en: 'sparks', si: 'තරංග' },
    [EmotionType.FEAR_CONFUSION]: { en: 'shadows', si: 'සෙවනැලි' },
    [EmotionType.CRAVING]: { en: 'vines', si: 'වැල්' },
  };

  return language === 'en' ? metaphors[emotion].en : metaphors[emotion].si;
};

const getTimeMetaphor = (timeOfDay: string, language: 'en' | 'si'): string => {
  const metaphors: Record<string, { en: string; si: string }> = {
    morning: { en: 'morning light', si: 'උදෑසන ආලෝකය' },
    afternoon: { en: 'afternoon warmth', si: 'දවල් උණුසුම' },
    evening: { en: 'evening shadows', si: 'සවස් සෙවනැලි' },
    night: { en: 'night stillness', si: 'රාත්‍රියේ නිශ්චලතාව' },
  };

  return language === 'en' ? metaphors[timeOfDay].en : metaphors[timeOfDay].si;
};

/**
 * Generate poetic insights from weekly grid data
 */
export const generatePoeticInsights = (
  weeklyGrid: WeeklyGrid,
  language: 'en' | 'si'
): PoeticInsight[] => {
  const insights: PoeticInsight[] = [];

  // Calculate total tiles
  const totalTiles = weeklyGrid.days.reduce((sum, day) => sum + day.tiles.length, 0);

  if (totalTiles === 0) {
    insights.push({
      type: 'observation',
      textEn: 'No emotions were noted this week. That\'s okay—awareness grows with practice.',
      textSi: 'මෙම සතියේ හැඟීම් සටහන් නොකළේය. එය හොඳයි—පුරුදුවෙන් සැලකිල්ල වර්ධනය වේ.',
    });
    return insights;
  }

  // Opening
  const openingTemplate = OPENING_TEMPLATES[Math.floor(Math.random() * OPENING_TEMPLATES.length)];
  insights.push({
    type: 'opening',
    textEn: openingTemplate.textEn,
    textSi: openingTemplate.textSi,
  });

  // Count emotions by type
  const emotionCounts: Record<EmotionType, number> = {} as Record<EmotionType, number>;
  EMOTIONS.forEach((emotion) => {
    emotionCounts[emotion.type] = 0;
  });

  weeklyGrid.days.forEach((day) => {
    day.tiles.forEach((tile) => {
      emotionCounts[tile.emotion] = (emotionCounts[tile.emotion] || 0) + 1;
    });
  });

  // Find most frequent emotion
  const mostFrequent = Object.entries(emotionCounts).reduce((a, b) =>
    emotionCounts[a[0] as EmotionType] > emotionCounts[b[0] as EmotionType] ? a : b
  );

  if (mostFrequent[1] > 0) {
    const emotion = mostFrequent[0] as EmotionType;
    const count = mostFrequent[1];
    const metaphor = getEmotionMetaphor(emotion, language);
    const emotionLabel = language === 'en' 
      ? getEmotion(emotion).labelEn.toLowerCase()
      : getEmotion(emotion).labelSi.toLowerCase();

    insights.push({
      type: 'dominant',
      textEn: `but ${metaphor} bloomed most often (${count} times).`,
      textSi: `නමුත් ${metaphor} බොහෝ විට පිපුණේය (${count} වතාවක්).`,
    });
  }

  // Find least frequent emotion (if significant)
  const leastFrequent = Object.entries(emotionCounts)
    .filter(([_, count]) => count > 0)
    .reduce((a, b) => (emotionCounts[a[0] as EmotionType] < emotionCounts[b[0] as EmotionType] ? a : b));

  if (leastFrequent && leastFrequent[1] > 0 && leastFrequent[1] < totalTiles * 0.1) {
    const emotion = leastFrequent[0] as EmotionType;
    const metaphor = getEmotionMetaphor(emotion, language);
    
    insights.push({
      type: 'pattern',
      textEn: `${metaphor} remained hidden, like seeds waiting in the soil.`,
      textSi: `${metaphor} සැඟවී තිබුණි, පසෙහි බලා සිටින බීජ මෙන්.`,
    });
  }

  // Time pattern
  const hourCounts = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  weeklyGrid.days.forEach((day) => {
    day.tiles.forEach((tile) => {
      if (tile.hour >= 6 && tile.hour < 12) hourCounts.morning++;
      else if (tile.hour >= 12 && tile.hour < 17) hourCounts.afternoon++;
      else if (tile.hour >= 17 && tile.hour < 22) hourCounts.evening++;
      else hourCounts.night++;
    });
  });

  const mostActiveTime = Object.entries(hourCounts).reduce((a, b) =>
    a[1] > b[1] ? a : b
  );

  if (mostActiveTime[1] > 0) {
    const timeMetaphor = getTimeMetaphor(mostActiveTime[0], language);
    insights.push({
      type: 'pattern',
      textEn: `Emotions appeared most in the ${timeMetaphor}.`,
      textSi: `හැඟීම් වැඩියෙන් පෙනී ගියේ ${timeMetaphor} වේ.`,
    });
  }

  // Closing
  const closingTemplate = CLOSING_TEMPLATES[Math.floor(Math.random() * CLOSING_TEMPLATES.length)];
  insights.push({
    type: 'closing',
    textEn: closingTemplate.textEn,
    textSi: closingTemplate.textSi,
  });

  return insights;
};

