import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { logger } from '../utils/logger';

// Safely import native modules with error handling
let VideoView: any;
let useVideoPlayer: any;

try {
  const videoModule = require('expo-video');
  VideoView = videoModule.VideoView;
  useVideoPlayer = videoModule.useVideoPlayer;
} catch (error) {
  console.warn('expo-video not available:', error);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface InlineVideoPlayerProps {
  videoUri: string;
  title?: string;
  width?: number | string;
  height?: number;
  autoPlay?: boolean;
  showControls?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

export default function InlineVideoPlayer({
  videoUri,
  title,
  width = '100%',
  height = 200,
  autoPlay = false,
  showControls = true,
  onPlay,
  onPause,
  onEnd,
  onError,
}: InlineVideoPlayerProps) {
  // Check if required native modules are available
  if (!VideoView || !useVideoPlayer) {
    return (
      <View style={[styles.container, { width, height }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="videocam-off" size={32} color="#999" />
          <Text style={styles.errorText}>Video player not available</Text>
        </View>
      </View>
    );
  }

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlayButton, setShowPlayButton] = useState(!autoPlay);
  const player = useVideoPlayer(videoUri || '', (player) => {
    try {
      player.loop = false;
      if (autoPlay && videoUri) {
        setTimeout(() => {
          try {
            player.play();
            setIsPlaying(true);
          } catch (error) {
            logger.error('Error auto-playing video', error);
          }
        }, 100);
      }
    } catch (error) {
      logger.error('Error initializing video player', error);
    }
  });

  // Handle video end
  useEffect(() => {
    if (!player || !videoUri) return;

    try {
      const subscription = player.addListener('playToEnd', () => {
        setIsPlaying(false);
        setShowPlayButton(true);
        if (onEnd) {
          onEnd();
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
  }, [videoUri, player, onEnd]);

  const handlePlayPause = () => {
    if (!player) return;

    try {
      if (isPlaying) {
        player.pause();
        setIsPlaying(false);
        setShowPlayButton(true);
        if (onPause) {
          onPause();
        }
      } else {
        player.play();
        setIsPlaying(true);
        setShowPlayButton(false);
        if (onPlay) {
          onPlay();
        }
      }
    } catch (error) {
      logger.error('Error toggling play/pause', error);
      if (onError) {
        onError(error);
      }
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (!videoUri) {
    return null;
  }

  return (
    <View style={[styles.container, { width, height }]}>
      {player && (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          nativeControls={false}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          onLoad={handleLoad}
        />
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      )}

      {/* Play/Pause Overlay */}
      {showControls && (
        <TouchableOpacity
          style={styles.controlsOverlay}
          activeOpacity={0.9}
          onPress={handlePlayPause}
        >
          {showPlayButton && (
            <View style={styles.playButtonContainer}>
              <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)']}
                style={styles.playButton}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={32}
                  color="#FFFFFF"
                />
              </LinearGradient>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Title */}
      {title && showControls && (
        <View style={styles.titleContainer}>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.titleGradient}
          >
            <Text style={styles.titleText} numberOfLines={1}>
              {title}
            </Text>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  titleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  titleGradient: {
    paddingVertical: 4,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  errorText: {
    color: '#999',
    fontSize: 12,
    marginTop: 8,
  },
});







