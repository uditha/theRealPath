import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  StatusBar,
  ActivityIndicator,
} from 'react-native';

// Safely import native modules with error handling
let VideoView: any;
let useVideoPlayer: any;
let GestureHandlerRootView: any;
let GestureDetector: any;
let Gesture: any;
let useSharedValue: any;
let useAnimatedStyle: any;
let withSpring: any;
let runOnJS: any;

try {
  const videoModule = require('expo-video');
  VideoView = videoModule.VideoView;
  useVideoPlayer = videoModule.useVideoPlayer;
} catch (error) {
  console.warn('expo-video not available:', error);
}

try {
  const gestureModule = require('react-native-gesture-handler');
  GestureHandlerRootView = gestureModule.GestureHandlerRootView;
  GestureDetector = gestureModule.GestureDetector;
  Gesture = gestureModule.Gesture;
} catch (error) {
  console.warn('react-native-gesture-handler not available:', error);
}

try {
  const reanimatedModule = require('react-native-reanimated');
  useSharedValue = reanimatedModule.useSharedValue;
  useAnimatedStyle = reanimatedModule.useAnimatedStyle;
  withSpring = reanimatedModule.withSpring;
  runOnJS = reanimatedModule.runOnJS;
} catch (error) {
  console.warn('react-native-reanimated not available:', error);
}

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logger } from '../utils/logger';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TikTokVideoPlayerProps {
  videos: Array<{ id: string; uri: string; title?: string }>;
  initialIndex?: number;
  onClose: () => void;
  onVideoEnd?: (videoId: string) => void;
}

export default function TikTokVideoPlayer({
  videos,
  initialIndex = 0,
  onClose,
  onVideoEnd,
}: TikTokVideoPlayerProps) {
  // Check if required native modules are available
  if (!VideoView || !useVideoPlayer || !useSharedValue || !GestureHandlerRootView) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#FFF', fontSize: 16, textAlign: 'center', margin: 20 }}>
          Video player requires a development build.{'\n'}
          Please rebuild the app with: npx expo run:ios
        </Text>
        <TouchableOpacity onPress={onClose} style={{ marginTop: 20, padding: 12, backgroundColor: '#333', borderRadius: 8 }}>
          <Text style={{ color: '#FFF' }}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const currentVideo = videos[currentIndex];
  
  // Create video player - initialize with current video URI
  // The hook will recreate when the URI changes
  const player = useVideoPlayer(currentVideo?.uri || '', (player) => {
    try {
      player.loop = false;
      if (currentVideo?.uri) {
        // Small delay to ensure player is ready
        setTimeout(() => {
          try {
            player.play();
          } catch (error) {
            logger.error('Error auto-playing video', error);
          }
        }, 100);
      }
    } catch (error) {
      logger.error('Error initializing video player', error);
    }
  });

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    if (showControls) {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
      controlsTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, [showControls]);

  // Handle video end and auto-advance
  useEffect(() => {
    if (!currentVideo || !player || !currentVideo.uri) return;
    
    try {
      // Handle video end
      const subscription = player.addListener('playToEnd', () => {
        if (onVideoEnd) {
          onVideoEnd(currentVideo.id);
        }
        // Auto-advance to next video if available
        if (currentIndex < videos.length - 1) {
          handleNext();
        }
      });
      
      return () => {
        try {
          subscription.remove();
        } catch (error) {
          // Ignore cleanup errors
        }
      };
    } catch (error) {
      logger.error('Error setting up video listener', error);
    }
  }, [currentIndex, currentVideo?.id, currentVideo?.uri, player]);

  const handlePlayPause = () => {
    if (!player) return;
    
    try {
      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
    } catch (error) {
      logger.error('Error toggling play/pause', error);
    }
  };

  const handleNext = () => {
    if (currentIndex < videos.length - 1) {
      translateY.value = withSpring(-SCREEN_HEIGHT, {
        damping: 20,
        stiffness: 90,
      }, () => {
        runOnJS(setCurrentIndex)(currentIndex + 1);
        translateY.value = SCREEN_HEIGHT;
        translateY.value = withSpring(0);
      });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      translateY.value = withSpring(SCREEN_HEIGHT, {
        damping: 20,
        stiffness: 90,
      }, () => {
        runOnJS(setCurrentIndex)(currentIndex - 1);
        translateY.value = -SCREEN_HEIGHT;
        translateY.value = withSpring(0);
      });
    }
  };

  const panGesture = Gesture?.Pan ? Gesture.Pan()
    .onUpdate((event) => {
      translateY.value = event.translationY;
      // Fade out when swiping
      opacity.value = 1 - Math.abs(event.translationY) / SCREEN_HEIGHT;
    })
    .onEnd((event) => {
      const threshold = SCREEN_HEIGHT * 0.2;
      if (event.translationY > threshold && currentIndex > 0) {
        // Swipe down - previous video
        handlePrevious();
      } else if (event.translationY < -threshold && currentIndex < videos.length - 1) {
        // Swipe up - next video
        handleNext();
      } else {
        // Spring back
        translateY.value = withSpring(0);
        opacity.value = withSpring(1);
      }
    }) : null;

  let AnimatedView: any;
  try {
    AnimatedView = require('react-native-reanimated').default.View;
  } catch {
    AnimatedView = View;
  }
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));


  const toggleControls = () => {
    setShowControls(!showControls);
  };

  if (!currentVideo || videos.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: '#FFFFFF', fontSize: 16 }}>No videos available</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
      <GestureHandlerRootView style={styles.container}>
      <StatusBar hidden />
      {GestureDetector && panGesture ? (
        <GestureDetector gesture={panGesture}>
          <AnimatedView style={[styles.container, animatedStyle]}>
          {/* Video */}
          {player && currentVideo && (
            <VideoView
              player={player}
              style={styles.video}
              contentFit="cover"
              nativeControls={false}
              allowsFullscreen={false}
              allowsPictureInPicture={false}
            />
          )}

          {/* Loading Indicator */}
          {player && (!player.duration || player.duration === 0) && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          )}

          {/* Controls Overlay */}
          {showControls && (
            <TouchableOpacity
              style={styles.controlsOverlay}
              activeOpacity={1}
              onPress={toggleControls}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.7)', 'transparent', 'transparent', 'rgba(0,0,0,0.7)']}
                style={styles.gradient}
              >
                {/* Top Bar */}
                <View style={[styles.topBar, { paddingTop: insets.top }]}>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close" size={28} color="#FFFFFF" />
                  </TouchableOpacity>
                  {currentVideo.title && (
                    <Text style={styles.videoTitle} numberOfLines={1}>
                      {currentVideo.title}
                    </Text>
                  )}
                  <View style={styles.spacer} />
                </View>

                {/* Center Play/Pause Button */}
                <View style={styles.centerControls}>
                  <TouchableOpacity
                    onPress={handlePlayPause}
                    style={styles.playPauseButton}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={player?.playing ? 'pause' : 'play'}
                      size={48}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>

                {/* Bottom Bar */}
                <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
                  <View style={styles.videoInfo}>
                    <Text style={styles.videoCounter}>
                      {currentIndex + 1} / {videos.length}
                    </Text>
                  </View>
                  <View style={styles.navigationButtons}>
                    {currentIndex > 0 && (
                      <TouchableOpacity onPress={handlePrevious} style={styles.navButton}>
                        <Ionicons name="chevron-up" size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                    {currentIndex < videos.length - 1 && (
                      <TouchableOpacity onPress={handleNext} style={styles.navButton}>
                        <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Tap to show controls */}
          {!showControls && (
            <TouchableOpacity
              style={styles.tapArea}
              activeOpacity={1}
              onPress={toggleControls}
            />
          )}
          </AnimatedView>
        </GestureDetector>
      ) : (
        <View style={styles.container}>
          <Text style={{ color: '#FFF' }}>Gesture handler not available</Text>
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  spacer: {
    width: 40,
  },
  centerControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  videoInfo: {
    flex: 1,
  },
  videoCounter: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

