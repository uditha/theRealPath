import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { getGentleGuidanceForDate } from '../../utils/gentleGuidance';

export default function GentleGuidance() {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const guidance = getGentleGuidanceForDate();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={styles.icon}>🌼</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          {language === 'en' ? "Today's Gentle Guidance" : 'අද මෘදු මගපෙන්වීම'}
        </Text>
      </View>
      <Text style={[styles.guidanceText, { color: colors.textSecondary }]}>
        {language === 'en' ? guidance.en : guidance.si}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  icon: {
    fontSize: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  guidanceText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});


