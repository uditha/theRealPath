import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const WISDOM_QUOTES = [
  {
    en: 'In this garden, no weed is judged; all nourish the soil.',
    si: 'මෙම උද්‍යානයේ, කිසිදු වල් පැළයක් විනිශ්චය නොකරනු ලැබේ; සියල්ලම පස පෝෂණය කරයි.',
  },
  {
    en: 'See how they come, and how they go.',
    si: 'ඒවා පැමිණෙන ආකාරය සහ යන ආකාරය බලන්න.',
  },
  {
    en: 'Each emotion is a teacher, each moment a lesson.',
    si: 'සෑම හැඟීමක්ම ගුරුවරයෙක්, සෑම මොහොතක්ම පාඩමකි.',
  },
  {
    en: 'Like dewdrops on lotus leaves, emotions arise and dissolve.',
    si: 'පියුම් කොළවල මීදුම් බිංදු මෙන්, හැඟීම් පැන නගින අතර විසුරුවා හරිනු ලැබේ.',
  },
];

interface ContemplativeInterludeProps {
  index: number;
}

const ContemplativeInterlude = React.memo(function ContemplativeInterlude({
  index,
}: ContemplativeInterludeProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const quote = WISDOM_QUOTES[index % WISDOM_QUOTES.length];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={styles.lotus}>🪷</Text>
        <Text style={[styles.quote, { color: colors.textSecondary }]}>
          {language === 'en' ? quote.en : quote.si}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 40,
    paddingHorizontal: 24,
    marginVertical: 16,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lotus: {
    fontSize: 32,
    marginBottom: 16,
    opacity: 0.6,
  },
  quote: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: '90%',
  },
});

export default ContemplativeInterlude;

