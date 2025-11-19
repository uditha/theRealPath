import { EmotionType, getEmotion } from './emotions';
import { WeeklyGrid } from '../services/emotion.service';

export interface EmotionLesson {
  emotion: EmotionType;
  poeticInsight: {
    en: string;
    si: string;
  };
  miniLesson: {
    en: string;
    si: string;
  };
  icon: string;
}

/**
 * Emotion-specific lesson templates
 * Based on Buddhist teachings for each core emotion
 */
export const EMOTION_LESSONS: Record<EmotionType, EmotionLesson> = {
  [EmotionType.JOY]: {
    emotion: EmotionType.JOY,
    icon: '🌞',
    poeticInsight: {
      en: 'A few warm petals opened in your week.',
      si: 'ඔබේ සතියේ උණුසුම් පෙති කිහිපයක් විවෘත විය.',
    },
    miniLesson: {
      en: 'Joy and calm help the mind open.\n\nWhen you notice these moments, even small ones, the mind learns to settle naturally.\n\nYou don\'t need to create joy — just recognise it when it appears.',
      si: 'සතුට සහ සන්සුන්තාව මනස විවෘත කිරීමට උපකාරී වේ.\n\nඔබ මෙම මොහොතුන් දැකීමේදී, කුඩා ඒවා වුවද, මනස ස්වභාවිකව ස්ථාවර වීමට ඉගෙන ගනී.\n\nඔබට සතුට නිර්මාණය කිරීමට අවශ්‍ය නැත — එය පෙනී යන විට හඳුනා ගන්න.',
    },
  },
  [EmotionType.CALM_CLARITY]: {
    emotion: EmotionType.CALM_CLARITY,
    icon: '🪷',
    poeticInsight: {
      en: 'Still water appeared in your week.',
      si: 'ඔබේ සතියේ නිශ්චල ජලය පෙනී ගියේය.',
    },
    miniLesson: {
      en: 'Calm isn\'t something you create.\n\nIt appears naturally when the mind stops chasing or resisting.\n\nEach moment you recognise calm, it grows stronger.',
      si: 'සන්සුන්තාව ඔබ නිර්මාණය කරන දෙයක් නොවේ.\n\nමනස අනුගමනය කිරීම හෝ ප්‍රතිරෝධය නවත්වන විට එය ස්වභාවිකව පෙනී යයි.\n\nඔබ සන්සුන්තාව හඳුනා ගන්නා සෑම මොහොතකම, එය වඩා ශක්තිමත් වේ.',
    },
  },
  [EmotionType.ANGER_AVERSION]: {
    emotion: EmotionType.ANGER_AVERSION,
    icon: '🔥',
    poeticInsight: {
      en: 'Sparks appeared often in your day.',
      si: 'ඔබේ දිනයේ තරංග බොහෝ විට පෙනී ගියේය.',
    },
    miniLesson: {
      en: 'Anger often arises when something blocks what we expect.\n\nTry pausing for one breath next time you feel the spark.\n\nThe pause itself weakens the anger immediately.',
      si: 'අප අපේක්ෂා කරන දෙයක් අවහිර වන විට කෝපය බොහෝ විට පැන නගී.\n\nඊළඟ වතාවේ ඔබ තරංගය දැනෙන විට හුස්මක් සඳහා නවත්වන්න.\n\nනවතීමම කෝපය වහාම දුර්වල කරයි.',
    },
  },
  [EmotionType.CRAVING]: {
    emotion: EmotionType.CRAVING,
    icon: '🌱',
    poeticInsight: {
      en: 'A growing vine tugged at your attention.',
      si: 'වර්ධනය වන වැලක් ඔබේ අවධානයට ඇදී ගියේය.',
    },
    miniLesson: {
      en: 'Craving is the mind reaching for something it thinks will complete it.\n\nWhen you notice the pull, ask: \'Is this a want or a need?\'\n\nAwareness softens the craving on its own.',
      si: 'තණ්හාව යනු මනස එය සම්පූර්ණ කරනු ඇතැයි සිතන දෙයක් සඳහා ළඟා වීමයි.\n\nඔබ ඇදීම දැකීමේදී, අසන්න: \'මෙය අවශ්‍යතාවක්ද නැතහොත් අවශ්‍යතාවක්ද?\'\n\nසැලකිල්ල තණ්හාව ස්වයංක්‍රීයව මෘදු කරයි.',
    },
  },
  [EmotionType.FEAR_CONFUSION]: {
    emotion: EmotionType.FEAR_CONFUSION,
    icon: '🌫️',
    poeticInsight: {
      en: 'Shadows passed through your week.',
      si: 'සෙවනැලි ඔබේ සතිය හරහා ගියේය.',
    },
    miniLesson: {
      en: 'Fear appears when the mind meets the unknown.\n\nYou don\'t need to remove fear — just name it gently: \'This is fear.\'\n\nNaming it gives the mind space to breathe.',
      si: 'මනස නොදන්නා දෙයකට මුණගැසෙන විට බිය පෙනී යයි.\n\nඔබට බිය ඉවත් කිරීමට අවශ්‍ය නැත — එය මෘදුවෙන් නම් කරන්න: \'මෙය බියයි.\'\n\nඑය නම් කිරීම මනසට හුස්ම ගැනීමට ඉඩක් ලබා දෙයි.',
    },
  },
  [EmotionType.SADNESS_GRIEF]: {
    emotion: EmotionType.SADNESS_GRIEF,
    icon: '💧',
    poeticInsight: {
      en: 'Blue drops touched your heart.',
      si: 'නිල් බිංදු ඔබේ හදවත ස්පර්ශ කළේය.',
    },
    miniLesson: {
      en: 'Sadness is the heart\'s way of showing it cared about something.\n\nLet yourself feel it without fighting.\n\nSoft attention turns sadness into understanding.',
      si: 'දුක යනු හදවත යමක් ගැන සැලකූ ආකාරය පෙන්වීමයි.\n\nඑයට එරෙහිව නොවී එය දැනීමට ඉඩ දෙන්න.\n\nමෘදු අවධානය දුක අවබෝධයක් බවට හරවයි.',
    },
  },
};

/**
 * Get lessons for emotions present in weekly data
 */
export const getEmotionLessons = (
  weeklyGrid: WeeklyGrid,
  language: 'en' | 'si'
): EmotionLesson[] => {
  // Count all emotions
  const emotionCounts: Record<EmotionType, number> = {} as Record<EmotionType, number>;
  
  weeklyGrid.days.forEach((day) => {
    day.tiles.forEach((tile) => {
      emotionCounts[tile.emotion] = (emotionCounts[tile.emotion] || 0) + 1;
    });
  });

  // Get unique emotions that appeared (sorted by frequency, descending)
  const presentEmotions = Object.entries(emotionCounts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([emotion]) => emotion as EmotionType);

  // Return lessons for each present emotion
  return presentEmotions.map((emotion) => EMOTION_LESSONS[emotion]);
};

