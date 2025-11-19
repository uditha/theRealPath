export enum EmotionType {
  JOY = 'joy', // Wholesome
  CALM_CLARITY = 'calm_clarity', // Wholesome
  CRAVING = 'craving', // Unwholesome
  ANGER_AVERSION = 'anger_aversion', // Unwholesome
  FEAR_CONFUSION = 'fear_confusion', // Unwholesome
  SADNESS_GRIEF = 'sadness_grief', // Feeling tone
}

export type EmotionCategory = 'pleasant' | 'unpleasant' | 'neutral';

export interface EmotionDefinition {
  type: EmotionType;
  emoji: string;
  color: string;
  labelEn: string;
  labelSi: string;
  category: EmotionCategory;
}

export const EMOTIONS: EmotionDefinition[] = [
  {
    type: EmotionType.JOY,
    emoji: '😊',
    color: '#FFD700', // Soft yellow / gold - naturally uplifting
    labelEn: 'Joy',
    labelSi: 'සතුට',
    category: 'pleasant',
  },
  {
    type: EmotionType.CALM_CLARITY,
    emoji: '🪷',
    color: '#87CEEB', // Sky blue - clarity and calm
    labelEn: 'Calm',
    labelSi: 'සන්සුන්',
    category: 'pleasant',
  },
  {
    type: EmotionType.CRAVING,
    emoji: '🔥',
    color: '#FF8C42', // Orange - energy / desire
    labelEn: 'Craving',
    labelSi: 'තණ්හාව',
    category: 'unpleasant',
  },
  {
    type: EmotionType.ANGER_AVERSION,
    emoji: '😠',
    color: '#FF6B6B', // Soft red - instantly recognized
    labelEn: 'Anger',
    labelSi: 'කෝපය',
    category: 'unpleasant',
  },
  {
    type: EmotionType.FEAR_CONFUSION,
    emoji: '😨',
    color: '#9B59B6', // Purple / deep violet - natural fear tone
    labelEn: 'Fear',
    labelSi: 'බිය',
    category: 'unpleasant',
  },
  {
    type: EmotionType.SADNESS_GRIEF,
    emoji: '😢',
    color: '#5B9BD5', // Muted blue - intuitive sadness tone
    labelEn: 'Sadness',
    labelSi: 'දුක',
    category: 'unpleasant',
  },
];

/**
 * Maps old emotion types to new ones for backward compatibility
 */
const migrateEmotionType = (oldType: string): EmotionType => {
  const migrationMap: Record<string, EmotionType> = {
    'sadness': EmotionType.SADNESS_GRIEF,
    'anger': EmotionType.ANGER_AVERSION,
    'fear': EmotionType.FEAR_CONFUSION,
    'aversion': EmotionType.ANGER_AVERSION,
    'anxiety': EmotionType.FEAR_CONFUSION,
    'gratitude': EmotionType.JOY,
    'peace': EmotionType.CALM_CLARITY,
    'equanimity': EmotionType.CALM_CLARITY,
    // New types pass through
    'joy': EmotionType.JOY,
    'calm_clarity': EmotionType.CALM_CLARITY,
    'craving': EmotionType.CRAVING,
    'anger_aversion': EmotionType.ANGER_AVERSION,
    'fear_confusion': EmotionType.FEAR_CONFUSION,
    'sadness_grief': EmotionType.SADNESS_GRIEF,
  };
  
  return migrationMap[oldType] || EmotionType.JOY; // Default to JOY if unknown
};

export const getEmotion = (type: EmotionType | string): EmotionDefinition => {
  // Migrate old emotion types
  const migratedType = migrateEmotionType(type as string);
  const emotion = EMOTIONS.find(e => e.type === migratedType);
  if (!emotion) {
    // Fallback to JOY if still not found
    return EMOTIONS[0];
  }
  return emotion;
};

export const getEmotionLabel = (type: EmotionType, language: 'en' | 'si'): string => {
  const emotion = getEmotion(type);
  return language === 'en' ? emotion.labelEn : emotion.labelSi;
};

