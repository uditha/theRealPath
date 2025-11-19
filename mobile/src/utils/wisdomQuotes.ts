export interface WisdomQuote {
  en: string;
  si: string;
}

/**
 * Daily wisdom quotes for the HomeScreen
 * Rotates based on date (same quote per day)
 */
export const WISDOM_QUOTES: WisdomQuote[] = [
  {
    en: 'May your steps today be gentle.',
    si: 'අද ඔබේ පියවර නිර්මල වේවා.',
  },
  {
    en: 'Let the mind settle like clear water.',
    si: 'මනස පැහැදිලි ජලයක් මෙන් සන්සුන් වීමට ඉඩ දෙන්න.',
  },
  {
    en: 'You don\'t need to be perfect, only aware.',
    si: 'ඔබට පරිපූර්ණ වීමට අවශ්‍ය නැත, සැලකිලිමත් වීම පමණක්.',
  },
  {
    en: 'Observe. Release. Smile.',
    si: 'නිරීක්ෂණය කරන්න. මුදා හරින්න. හිනා වන්න.',
  },
  {
    en: 'Little by little, the path reveals itself.',
    si: 'කුඩා කුඩාවෙන්, මාර්ගය එයම හෙළි වේ.',
  },
  {
    en: 'Anger seen is anger softened.',
    si: 'දුටු කෝපය මෘදු කෝපයකි.',
  },
  {
    en: 'Each breath is a new beginning.',
    si: 'සෑම හුස්මක්ම නව ආරම්භයකි.',
  },
  {
    en: 'The present moment is your teacher.',
    si: 'වර්තමාන මොහොත ඔබේ ගුරුවරයාය.',
  },
  {
    en: 'Watch thoughts like clouds passing.',
    si: 'වලාකුළු ගමන් කරනවා මෙන් සිතුවිලි නරඹන්න.',
  },
  {
    en: 'Compassion starts with yourself.',
    si: 'කරුණාව ආරම්භ වන්නේ ඔබෙන්මය.',
  },
  {
    en: 'In stillness, wisdom arises.',
    si: 'නිශ්චලතාවයේදී, ඥානය පැන නගී.',
  },
  {
    en: 'Every emotion is a messenger.',
    si: 'සෑම හැඟීමක්ම දූතයෙකි.',
  },
  {
    en: 'The path unfolds one step at a time.',
    si: 'මාර්ගය එක් පියවරක් එක් පියවරක් වශයෙන් හෙළි වේ.',
  },
  {
    en: 'Kindness is the highest practice.',
    si: 'කරුණාව උත්තරීතර පුරුදුවයි.',
  },
  {
    en: 'Where attention goes, awareness grows.',
    si: 'අවධානය යන තැන, සැලකිල්ල වර්ධනය වේ.',
  },
];

/**
 * Get wisdom quote for a specific date
 * Uses date hash to ensure same quote per day
 */
export function getWisdomQuoteForDate(date: Date = new Date()): WisdomQuote {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const hash = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % WISDOM_QUOTES.length;
  return WISDOM_QUOTES[index];
}


