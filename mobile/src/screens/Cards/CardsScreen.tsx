import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { contentService } from '../../services/content.service';
import { logger } from '../../utils/logger';

const createStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: 16, fontSize: 16, color: colors.textSecondary },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  cardContainer: { width: '48%', marginBottom: 16 },
  cardLocked: { opacity: 0.5 },
  card: { aspectRatio: 0.7, borderRadius: 16, borderWidth: 2, overflow: 'hidden', backgroundColor: colors.card, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  cardImage: { width: '100%', height: '100%' },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', padding: 12 },
  cardName: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 },
  rarityBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  rarityText: { fontSize: 10, fontWeight: '600', color: '#FFFFFF', textTransform: 'uppercase' },
  lockedContent: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface },
  lockedIcon: { fontSize: 32, marginBottom: 8 },
  lockedText: { fontSize: 24, fontWeight: 'bold', color: colors.textTertiary },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: colors.card, borderRadius: 24, padding: 24, width: '100%', maxWidth: 400, alignItems: 'center' },
  modalImage: { width: '100%', height: 300, borderRadius: 16, marginBottom: 16 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 12, textAlign: 'center' },
  modalDescription: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 16, lineHeight: 24 },
  modalRarity: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginBottom: 24 },
  modalRarityText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 1 },
  modalCloseButton: { backgroundColor: colors.button, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12 },
  modalCloseText: { fontSize: 16, fontWeight: '600', color: colors.buttonText },
});

export default function CardsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language, t } = useLanguage();
  const [allCards, setAllCards] = useState<any[]>([]);
  const [userCards, setUserCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const [allCardsData, userCardsData] = await Promise.all([
        contentService.getAllCards(),
        contentService.getUserCards(),
      ]);
      setAllCards(allCardsData);
      setUserCards(userCardsData.map((uc: any) => uc.card?.id || uc.cardId));
    } catch (error) {
      logger.error('Error loading cards', error);
    } finally {
      setLoading(false);
    }
  };

  const isUnlocked = (cardId: string) => {
    return userCards.includes(cardId);
  };

  const getRarityColor = (rarity: string) => {
    const rarityColors: { [key: string]: string } = {
      common: colors.textSecondary,
      rare: colors.primary,
      epic: '#9B59B6',
      legendary: colors.accent,
    };
    return rarityColors[rarity] || colors.textSecondary;
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading cards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('cards')}</Text>
          <Text style={styles.subtitle}>
            {userCards.length} / {allCards.length} {language === 'en' ? 'collected' : 'එකතු කරන ලද'}
          </Text>
        </View>

        <View style={styles.grid}>
          {allCards.map((card) => {
            const unlocked = isUnlocked(card.id);
            return (
              <TouchableOpacity
                key={card.id}
                style={[
                  styles.cardContainer,
                  !unlocked && styles.cardLocked,
                ]}
                onPress={() => {
                  navigation.navigate('CardDetail', { cardId: card.id });
                }}
              >
                <View style={[styles.card, { borderColor: getRarityColor(card.rarity) }]}>
                  {unlocked ? (
                    <>
                      <Image
                        source={{ uri: card.imageUrl }}
                        style={styles.cardImage}
                        resizeMode="cover"
                      />
                      <View style={styles.cardOverlay}>
                        <Text style={styles.cardName}>
                          {language === 'en' ? card.nameEn : card.nameSi}
                        </Text>
                        <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(card.rarity) }]}>
                          <Text style={styles.rarityText}>{card.rarity}</Text>
                        </View>
                      </View>
                    </>
                  ) : (
                    <View style={styles.lockedContent}>
                      <Text style={styles.lockedIcon}>🔒</Text>
                      <Text style={styles.lockedText}>?</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Card Detail Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCard && (
              <>
                <Image
                  source={{ uri: selectedCard.imageUrl }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
                <Text style={styles.modalTitle}>
                  {language === 'en' ? selectedCard.nameEn : selectedCard.nameSi}
                </Text>
                <Text style={styles.modalDescription}>
                  {language === 'en' ? selectedCard.descriptionEn : selectedCard.descriptionSi}
                </Text>
                <View style={[styles.modalRarity, { backgroundColor: getRarityColor(selectedCard.rarity) }]}>
                  <Text style={styles.modalRarityText}>{selectedCard.rarity.toUpperCase()}</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalCloseText}>{t('back')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
      </View>
    </SafeAreaView>
  );
}
