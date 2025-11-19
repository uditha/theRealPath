import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'si';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

const LANGUAGE_STORAGE_KEY = '@realpath_language';

// Simple translations for UI labels
const translations: { [key: string]: { en: string; si: string } } = {
  welcome: { en: 'Welcome back', si: 'ආපසු සාදරයෙන් පිළිගනිමු' },
  continueJourney: { en: "Continue Today's Journey", si: 'අද ගමන දිගටම කරගෙන යන්න' },
  todayProgress: { en: "Today's Progress", si: 'අද ප්‍රගතිය' },
  lessonsDone: { en: 'Lessons Done', si: 'කරන ලද පාඩම්' },
  xpEarned: { en: 'XP Earned', si: 'ලබාගත් XP' },
  streak: { en: 'Streak', si: 'අඛණ්ඩතාව' },
  path: { en: 'Path', si: 'මාර්ගය' },
  review: { en: 'Review', si: 'සමාලෝචනය' },
  cards: { en: 'Cards', si: 'කාඩ්' },
  profile: { en: 'Profile', si: 'පැතිකඩ' },
  settings: { en: 'Settings', si: 'සැකසීම්' },
  calmLesson: { en: 'Calm Lesson', si: 'සන්සුන් පාඩම' },
  continue: { en: 'Continue', si: 'දිගටම' },
  next: { en: 'Next', si: 'ඊළඟ' },
  back: { en: 'Back', si: 'ආපසු' },
  startQuiz: { en: 'Start Quiz', si: 'ප්‍රශ්න පත්‍රය ආරම්භ කරන්න' },
  submitQuiz: { en: 'Submit Quiz', si: 'ප්‍රශ්න පත්‍රය ඉදිරිපත් කරන්න' },
  quizComplete: { en: 'Quiz Complete!', si: 'ප්‍රශ්න පත්‍රය සම්පූර්ණයි!' },
  lessonComplete: { en: 'Lesson Complete!', si: 'පාඩම සම්පූර්ණයි!' },
  earned: { en: 'Earned', si: 'ලබාගත්තා' },
  newCard: { en: 'New Card', si: 'නව කාඩ්' },
  unlocked: { en: 'Unlocked', si: 'අගුළු හරින ලද' },
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLang === 'en' || savedLang === 'si') {
        setLanguageState(savedLang);
      }
    } catch (error) {
      console.error('Error loading language', error);
    } finally {
      setIsInitialized(true);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Error saving language', error);
    }
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  if (!isInitialized) {
    return null;
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = React.useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

