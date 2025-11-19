import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { WeeklyGrid } from '../../services/emotion.service';
import { EmotionType, EMOTIONS, getEmotionLabel, getEmotion } from '../../utils/emotions';

interface ReflectionSummaryCardProps {
  weeklyGrid?: WeeklyGrid;
  onEmotionPress?: (emotion: EmotionType) => void;
}

const ReflectionSummaryCard = React.memo(function ReflectionSummaryCard({
  weeklyGrid,
  onEmotionPress,
}: ReflectionSummaryCardProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();

  // Calculate emotion totals for the week
  const emotionTotals = React.useMemo(() => {
    if (!weeklyGrid) return {};
    
    const totals: Record<EmotionType, number> = {} as Record<EmotionType, number>;
    EMOTIONS.forEach(emotion => {
      totals[emotion.type] = 0;
    });
    
    weeklyGrid.days.forEach(day => {
      day.tiles.forEach(tile => {
        totals[tile.emotion] = (totals[tile.emotion] || 0) + 1;
      });
    });
    
    return totals;
  }, [weeklyGrid]);

  // Find dominant emotion
  const dominantEmotion = React.useMemo(() => {
    const entries = Object.entries(emotionTotals) as [EmotionType, number][];
    if (entries.length === 0) return null;
    
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    return sorted[0][1] > 0 ? sorted[0] : null;
  }, [emotionTotals]);

  // Generate insight text
  const insight = React.useMemo(() => {
    if (!weeklyGrid || !dominantEmotion) return null;
    
    const [emotionType, count] = dominantEmotion;
    const emotionLabel = getEmotionLabel(emotionType, language);
    
    // Find peak day for dominant emotion
    let peakDay = 0;
    let peakCount = 0;
    weeklyGrid.days.forEach((day, index) => {
      const dayCount = day.tiles.filter(t => t.emotion === emotionType).length;
      if (dayCount > peakCount) {
        peakCount = dayCount;
        peakDay = index;
      }
    });
    
    const dayNames = language === 'en' 
      ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      : ['ඉරිදා', 'සඳුදා', 'අඟහරුවාදා', 'බදාදා', 'බ්‍රහස්පතින්දා', 'සිකුරාදා', 'සෙනසුරාදා'];
    
    if (peakCount > 0) {
      return language === 'en'
        ? `Your ${emotionLabel.toLowerCase()} moments peaked on ${dayNames[peakDay]} - what made that day special?`
        : `ඔබේ ${emotionLabel.toLowerCase()} මොහොත ${dayNames[peakDay]} දිනයේදී උච්චතමය විය - එම දිනය විශේෂ කළේ කුමක්ද?`;
    }
    
    return null;
  }, [weeklyGrid, dominantEmotion, language]);

  // Get top 3 emotions for quick summary
  const topEmotions = React.useMemo(() => {
    const entries = Object.entries(emotionTotals) as [EmotionType, number][];
    return entries
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [emotionTotals]);

  if (!weeklyGrid || topEmotions.length === 0) {
    return null;
  }

  const [dominantType, dominantCount] = dominantEmotion || [null, 0];
  const dominantEmotionDef = dominantType ? getEmotion(dominantType) : null;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Summary Text */}
      <View style={styles.summarySection}>
        <Text style={[styles.summaryText, { color: colors.text }]}>
          {language === 'en' ? 'This week, you experienced' : 'මෙම සතියේ, ඔබ අත්විඳියා'}
        </Text>
        <View style={styles.emotionList}>
          {topEmotions.map(([emotionType, count], index) => {
            const emotionDef = getEmotion(emotionType);
            const isDominant = emotionType === dominantType;
            return (
              <TouchableOpacity
                key={emotionType}
                onPress={() => onEmotionPress?.(emotionType)}
                activeOpacity={0.7}
                style={styles.emotionChip}
              >
                <Text style={[
                  styles.emotionChipText,
                  { 
                    color: isDominant ? emotionDef.color : colors.textSecondary,
                    fontWeight: isDominant ? '700' : '500',
                  },
                ]}>
                  {getEmotionLabel(emotionType, language)} {count}
                </Text>
                {isDominant && (
                  <View style={[styles.dominantBadge, { backgroundColor: emotionDef.color }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Insight */}
      {insight && (
        <View style={[styles.insightSection, { borderTopColor: colors.border }]}>
          <Text style={[styles.insightText, { color: colors.textSecondary }]}>
            {insight}
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summarySection: {
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  emotionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emotionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  emotionChipText: {
    fontSize: 13,
  },
  dominantBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 6,
    opacity: 0.8,
  },
  insightSection: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
  },
  insightText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});

export default ReflectionSummaryCard;

