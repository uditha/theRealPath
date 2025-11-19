import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { contentService } from '../../services/content.service';
import { logger } from '../../utils/logger';

export default function CardDetailScreen({ route, navigation }: any) {
  const { cardId } = route.params;
  const { colors } = useTheme();
  const { language, t } = useLanguage();
  const [card, setCard] = useState<any>(null);
  const [userHasCard, setUserHasCard] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCard();
  }, [cardId]);

  const loadCard = async () => {
    try {
      const [allCards, userCards] = await Promise.all([
        contentService.getAllCards(),
        contentService.getUserCards(),
      ]);
      
      const foundCard = allCards.find((c) => c.id === cardId);
      if (foundCard) {
        setCard(foundCard);
        setUserHasCard(userCards.some((uc: any) => uc.card?.id === cardId || uc.cardId === cardId));
      }
    } catch (error) {
      logger.error('Error loading card', error);
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.loadingText}>Loading card...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!card) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>
            {language === 'en' ? 'Card not found' : 'කාඩ් හමු නොවීය'}
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>
              {language === 'en' ? 'Go Back' : 'ආපසු යන්න'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Card Image */}
        <View style={styles.imageContainer}>
          {userHasCard ? (
            <Image
              source={{ uri: card.imageUrl }}
              style={styles.cardImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.lockedImageContainer}>
              <Text style={styles.lockedIcon}>🔒</Text>
              <Text style={styles.lockedText}>
                {language === 'en' ? 'Locked' : 'අගුළු දමා ඇත'}
              </Text>
            </View>
          )}
        </View>

        {/* Card Info */}
        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.cardName}>
              {language === 'en' ? card.nameEn : card.nameSi}
            </Text>
            <View
              style={[
                styles.rarityBadge,
                { backgroundColor: getRarityColor(card.rarity) },
              ]}
            >
              <Text style={styles.rarityText}>
                {card.rarity.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.description}>
            {language === 'en' ? card.descriptionEn : card.descriptionSi}
          </Text>

          {!userHasCard && card.unlockCondition && (
            <View style={styles.unlockInfo}>
              <Text style={styles.unlockTitle}>
                {language === 'en' ? 'How to unlock:' : 'අගුළු හැරීමේ ක්‍රමය:'}
              </Text>
              <Text style={styles.unlockText}>
                {language === 'en'
                  ? 'Complete lessons to unlock this card'
                  : 'මෙම කාඩ් අගුළු හැරීමට පාඩම් සම්පූර්ණ කරන්න'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: colors.button,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    width: '100%',
    height: 400,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  lockedImageContainer: {
    alignItems: 'center',
  },
  lockedIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  lockedText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  infoContainer: {
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  rarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rarityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  unlockInfo: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unlockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  unlockText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});










