import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { contentService } from '../../services/content.service';
import { logger } from '../../utils/logger';

const createStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: 16, fontSize: 16, color: colors.textSecondary },
  header: { backgroundColor: colors.card, padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  chapterName: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  chapterNameSi: { fontSize: 18, color: colors.textSecondary },
  lessonCard: { backgroundColor: colors.card, margin: 16, padding: 20, borderRadius: 16, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  lessonHeader: { marginBottom: 12 },
  lessonTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 4 },
  lessonTitleSi: { fontSize: 14, color: colors.textSecondary },
  lessonFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpReward: { fontSize: 14, fontWeight: '600', color: colors.primary },
  startText: { fontSize: 16, fontWeight: '600', color: colors.primary },
});

export default function ChapterScreen({ route, navigation }: any) {
  const { chapterId } = route.params;
  const { colors } = useTheme();
  const [chapter, setChapter] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChapter();
  }, [chapterId]);

  const loadChapter = async () => {
    try {
      const chapterData = await contentService.getChapterById(chapterId);
      setChapter(chapterData);
      
      // Load lessons for this chapter
      const lessonsData = await contentService.getLessonsByChapter(chapterId);
      setLessons(lessonsData);
    } catch (error) {
      logger.error('Error loading chapter', error);
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.chapterName}>{chapter?.nameEn || 'Chapter'}</Text>
        <Text style={styles.chapterNameSi}>{chapter?.nameSi || ''}</Text>
      </View>

      {lessons.map((lesson) => (
        <TouchableOpacity
          key={lesson.id}
          style={styles.lessonCard}
          onPress={() => navigation.navigate('Lesson', { lessonId: lesson.id })}
        >
          <View style={styles.lessonHeader}>
            <Text style={styles.lessonTitle}>{lesson.titleEn}</Text>
            <Text style={styles.lessonTitleSi}>{lesson.titleSi}</Text>
          </View>
          <View style={styles.lessonFooter}>
            <Text style={styles.xpReward}>{lesson.xpReward} XP</Text>
            <Text style={styles.startText}>Start →</Text>
          </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}