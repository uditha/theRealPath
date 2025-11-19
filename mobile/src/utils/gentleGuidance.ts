export interface GentleGuidance {
  en: string;
  si: string;
}

/**
 * Daily gentle guidance micro-tasks
 * Rotates based on date (same guidance per day)
 */
export const GENTLE_GUIDANCE: GentleGuidance[] = [
  {
    en: 'Notice one breath before reacting today.',
    si: 'අද ප්‍රතික්‍රියා කිරීමට පෙර හුස්මක් දැනගන්න.',
  },
  {
    en: 'During commute, observe sounds without naming them.',
    si: 'ගමන් අතරතුර, නම් නොදී ශබ්ද නිරීක්ෂණය කරන්න.',
  },
  {
    en: 'Offer silent kindness to someone you meet.',
    si: 'ඔබ හමුවන යමෙකුට නිහඬ කරුණාවක් ලබා දෙන්න.',
  },
  {
    en: 'Try 30 seconds of non-doing now.',
    si: 'දැන් කිසිවක් නොකිරීමේ තත්පර 30 ක් උත්සාහ කරන්න.',
  },
  {
    en: 'Feel your feet on the ground three times today.',
    si: 'අද තුන් වරක් ඔබේ පාද භූමියේ දැනීමට උත්සාහ කරන්න.',
  },
  {
    en: 'Before eating, pause and appreciate.',
    si: 'ආහාර ගැනීමට පෙර, නතර වී අගය කරන්න.',
  },
  {
    en: 'Notice three things you can see right now.',
    si: 'දැන් ඔබට දැකිය හැකි දේවල් තුනක් දැනගන්න.',
  },
  {
    en: 'Let one judgment pass without acting on it.',
    si: 'එක් විනිශ්චයක් ක්‍රියා කිරීමෙන් තොරව ගමන් කිරීමට ඉඩ දෙන්න.',
  },
  {
    en: 'Take one mindful step with full attention.',
    si: 'සම්පූර්ණ අවධානයෙන් එක් සැලකිලිමත් පියවරක් ගන්න.',
  },
  {
    en: 'Observe one emotion without changing it.',
    si: 'එය වෙනස් නොකර එක් හැඟීමක් නිරීක්ෂණය කරන්න.',
  },
  {
    en: 'Send a wish for happiness to someone.',
    si: 'යමෙකුට සතුටක් සඳහා ආශාවක් යවන්න.',
  },
  {
    en: 'Notice where tension lives in your body.',
    si: 'ඔබේ ශරීරයේ ආතතිය ජීවත් වන තැන දැනගන්න.',
  },
  {
    en: 'Listen to one sound completely, from start to end.',
    si: 'ආරම්භයේ සිට අවසානය දක්වා සම්පූර්ණයෙන් ශබ්දයක් සවන් දෙන්න.',
  },
  {
    en: 'Before speaking, take one breath.',
    si: 'කතා කිරීමට පෙර, හුස්මක් ගන්න.',
  },
  {
    en: 'Notice the space between thoughts.',
    si: 'සිතුවිලි අතර අවකාශය දැනගන්න.',
  },
];

/**
 * Get gentle guidance for a specific date
 * Uses date hash to ensure same guidance per day
 */
export function getGentleGuidanceForDate(date: Date = new Date()): GentleGuidance {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const hash = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % GENTLE_GUIDANCE.length;
  return GENTLE_GUIDANCE[index];
}


