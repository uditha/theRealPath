import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { KusalaBalance } from '../../utils/kusalaCalculator';

interface KusalaMeterProps {
  balance: KusalaBalance;
}

export default function KusalaMeter({ balance }: KusalaMeterProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();

  if (balance.total === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {language === 'en'
          ? 'Balance Meter (Awareness, not judgment)'
          : 'සමතුලිත මීටරය (සැලකිල්ල, විනිශ්චය නොවේ)'}
      </Text>
      <View style={[styles.barContainer, { backgroundColor: colors.border }]}>
        {/* Wholesome (green) */}
        {balance.wholesomePercent > 0 && (
          <View
            style={[
              styles.segment,
              {
                width: `${balance.wholesomePercent}%`,
                backgroundColor: '#A8E6CF', // Pale green
              },
            ]}
          />
        )}
        {/* Unwholesome (red) */}
        {balance.unwholesomePercent > 0 && (
          <View
            style={[
              styles.segment,
              {
                width: `${balance.unwholesomePercent}%`,
                backgroundColor: '#FFB3BA', // Pale red
              },
            ]}
          />
        )}
        {/* Neutral (blue) */}
        {balance.neutralPercent > 0 && (
          <View
            style={[
              styles.segment,
              {
                width: `${balance.neutralPercent}%`,
                backgroundColor: '#BAE1FF', // Pale blue
              },
            ]}
          />
        )}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#A8E6CF' }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            {language === 'en' ? 'Mindful' : 'සැලකිලිමත්'} ({balance.wholesomePercent}%)
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FFB3BA' }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            {language === 'en' ? 'Reactive' : 'ප්‍රතික්‍රියාකාරී'} ({balance.unwholesomePercent}%)
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 12,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  barContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 8,
  },
  segment: {
    height: '100%',
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 11,
  },
});


