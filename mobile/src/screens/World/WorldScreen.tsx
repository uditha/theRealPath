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
import { contentService, World } from '../../services/content.service';
import { logger } from '../../utils/logger';

const createStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: 16, fontSize: 16, color: colors.textSecondary },
  header: { backgroundColor: colors.card, padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  worldName: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  worldNameSi: { fontSize: 18, color: colors.textSecondary },
  chapterSection: { backgroundColor: colors.card, margin: 16, padding: 20, borderRadius: 12, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  chapterTitle: { fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: 4 },
  chapterTitleSi: { fontSize: 16, color: colors.textSecondary, marginBottom: 8 },
  lessonCount: { fontSize: 14, color: colors.primary, marginBottom: 12 },
  viewButton: { backgroundColor: colors.button, padding: 12, borderRadius: 8, alignItems: 'center' },
  viewButtonText: { color: colors.buttonText, fontSize: 16, fontWeight: '600' },
});

export default function WorldScreen({ route, navigation }: any) {
  const { worldId } = route.params;
  const { colors } = useTheme();
  const [world, setWorld] = useState<World | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorld();
  }, [worldId]);

  const loadWorld = async () => {
    try {
      const worldData = await contentService.getWorldById(worldId);
      setWorld(worldData);
    } catch (error) {
      logger.error('Error loading world', error);
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

  if (!world) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <Text>World not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.worldName}>{world.nameEn}</Text>
        <Text style={styles.worldNameSi}>{world.nameSi}</Text>
      </View>

      {world.chapters.map((chapter) => (
        <View key={chapter.id} style={styles.chapterSection}>
          <Text style={styles.chapterTitle}>{chapter.nameEn}</Text>
          <Text style={styles.chapterTitleSi}>{chapter.nameSi}</Text>
          <Text style={styles.lessonCount}>
            {chapter.lessonCount} {chapter.lessonCount === 1 ? 'Lesson' : 'Lessons'}
          </Text>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => navigation.navigate('Chapter', { chapterId: chapter.id })}
          >
            <Text style={styles.viewButtonText}>View Chapter</Text>
          </TouchableOpacity>
        </View>
      ))}
      </ScrollView>
    </SafeAreaView>
  );
}