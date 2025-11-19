import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { DailyGrid } from '../../services/emotion.service';
import { EmotionType, getEmotion } from '../../utils/emotions';
import { calculatePondColor, getDominantEmotion, calculateColorIntensity } from '../../utils/colorBlending';
import PondRipple from './PondRipple';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const POND_SIZE = Math.min(SCREEN_WIDTH - 80, Math.min(SCREEN_HEIGHT * 0.4, 320));
const POND_CENTER = POND_SIZE / 2;

export interface GardenPondRef {
  addRipple: (emotion: EmotionType) => void;
}

interface GardenPondProps {
  dailyGrid?: DailyGrid;
}

/**
 * Pond-based emotion visualization
 * Each emotion tap adds a colored ripple, and the pond's color blends to represent the day's mood
 */
const GardenPond = forwardRef<GardenPondRef, GardenPondProps>((props, ref) => {
  const { dailyGrid } = props;
  const { colors } = useTheme();
  const { language } = useLanguage();
  const [ripples, setRipples] = useState<Array<{ id: number; emotion: EmotionType }>>([]);
  const rippleIdRef = useRef(0);
  const pondColorAnim = useRef(new Animated.Value(0)).current;
  const [pondColor, setPondColor] = useState('#000000');
  const [pondIntensity, setPondIntensity] = useState(0.2);

  // Calculate pond color from tiles
  useEffect(() => {
    if (dailyGrid && dailyGrid.tiles.length > 0) {
      const newColor = calculatePondColor(dailyGrid.tiles);
      const intensity = calculateColorIntensity(dailyGrid.tiles);
      
      // Animate color transition
      Animated.timing(pondColorAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }).start(() => {
        setPondColor(newColor);
        setPondIntensity(intensity);
        pondColorAnim.setValue(0);
      });
    } else {
      // No brown - use transparent dark when empty
      setPondColor('#000000');
      setPondIntensity(0.2);
    }
  }, [dailyGrid]);

  // Add ripple when emotion is tapped
  const addRipple = (emotion: EmotionType) => {
    const id = rippleIdRef.current++;
    setRipples((prev) => [...prev, { id, emotion }]);
    
    // Remove ripple after animation completes
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 800);
  };

  // Expose addRipple function to parent via ref
  useImperativeHandle(ref, () => ({
    addRipple,
  }));

  const tiles = dailyGrid?.tiles || [];
  const dominantEmotion = getDominantEmotion(tiles);
  const totalCount = tiles.length;

  // Convert hex to RGB for gradient
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 78, g: 52, b: 46 };
  };

  const rgb = hexToRgb(pondColor);
  // Use pure emotion colors without brown blending
  const gradientColors = [
    `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${pondIntensity})`,
    `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${pondIntensity * 0.8})`,
    `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${pondIntensity * 0.6})`,
    `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${pondIntensity * 0.4})`,
  ] as const;

  if (!dailyGrid || dailyGrid.tiles.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <View style={styles.pondContainer}>
          {/* Info overlay - Top of circle */}
          <View style={styles.infoOverlay}>
            <Text style={[styles.countText, { color: colors.text }]}>
              0 {language === 'en' ? 'emotions' : 'හැඟීම්'}
            </Text>
          </View>
          
          <View style={[styles.pond, { width: POND_SIZE, height: POND_SIZE, borderRadius: POND_SIZE / 2 }]}>
            <LinearGradient
              colors={['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.1)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </View>
        </View>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {language === 'en'
            ? 'Tap an emotion below to add ripples to your pond'
            : 'ඔබේ තඩියට රැළි එක් කිරීමට පහත හැඟීමක් තට්ටු කරන්න'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.pondContainer}>
        {/* Info overlay - Top of circle */}
        <View style={styles.infoOverlay}>
          <Text style={[styles.countText, { color: colors.text }]}>
            {totalCount} {language === 'en' ? 'emotions' : 'හැඟීම්'}
          </Text>
          {dominantEmotion && (
            <Text style={[styles.dominantText, { color: colors.textSecondary }]}>
              {language === 'en' ? 'Most: ' : 'වැඩියෙන්: '}
              {language === 'en'
                ? getEmotion(dominantEmotion).labelEn
                : getEmotion(dominantEmotion).labelSi}
            </Text>
          )}
        </View>

        {/* Pond */}
        <View style={[styles.pond, { width: POND_SIZE, height: POND_SIZE, borderRadius: POND_SIZE / 2 }]}>
          <LinearGradient
            colors={gradientColors}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          >
            {/* Subtle water texture */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const radius = POND_SIZE * 0.3;
              const x = POND_CENTER + Math.cos(angle) * radius;
              const y = POND_CENTER + Math.sin(angle) * radius;
              
              return (
                <View
                  key={i}
                  style={[
                    styles.waterTexture,
                    {
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: `rgba(255, 255, 255, ${0.1 + Math.random() * 0.1})`,
                      left: x - 2,
                      top: y - 2,
                    },
                  ]}
                />
              );
            })}
          </LinearGradient>

          {/* Ripples */}
          {ripples.map((ripple) => (
            <PondRipple key={ripple.id} emotion={ripple.emotion} />
          ))}

          {/* Center highlight */}
          <View
            style={[
              styles.centerHighlight,
              {
                width: POND_SIZE * 0.2,
                height: POND_SIZE * 0.2,
                borderRadius: POND_SIZE * 0.1,
                backgroundColor: `rgba(255, 255, 255, ${pondIntensity * 0.2})`,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingTop: 60,
    minHeight: 300,
  },
  pondContainer: {
    width: POND_SIZE,
    height: POND_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pond: {
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  waterTexture: {
    position: 'absolute',
  },
  centerHighlight: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -(POND_SIZE * 0.1),
    marginLeft: -(POND_SIZE * 0.1),
  },
  infoOverlay: {
    position: 'absolute',
    top: -50,
    alignItems: 'center',
    width: '100%',
    zIndex: 10,
  },
  countText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dominantText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 20,
  },
});

export default GardenPond;

