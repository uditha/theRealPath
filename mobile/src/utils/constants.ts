// API Configuration
// For iOS Simulator/Android Emulator: use localhost
// For physical devices: replace localhost with your computer's IP address
// Example: 'http://192.168.1.100:3000/api'
// To find your IP: ifconfig (Mac/Linux) or ipconfig (Windows)
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://your-production-api.com/api';

// OpenAI API Configuration
export const OPENAI_API_KEY = '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';

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  USER_DATA: '@user_data',
  EMOTION_DAILY_GRIDS: '@emotion_daily_grids',
  EMOTION_WEEKLY_REFLECTIONS: '@emotion_weekly_reflections',
  EMOTION_LAST_VIEW_MODE: '@emotion_last_view_mode',
  EMOTION_ONBOARDING_COMPLETED: '@emotion_onboarding_completed',
  DAILY_WISDOM_SHOWN_DATE: '@daily_wisdom_date',
  KALYANAMITTA_SHOWN_DATE: '@kalyanamitta_date',
  MINDFUL_PAUSES_COUNT: '@mindful_pauses_count',
  GENTLE_GUIDANCE_DATE: '@gentle_guidance_date',
};

