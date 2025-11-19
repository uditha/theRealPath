import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

interface SimpleVideoPlayerProps {
  visible: boolean;
  videoUri: string;
  title?: string;
  onClose: () => void;
  onVideoEnd?: () => void;
}

export default function SimpleVideoPlayer({
  visible,
  videoUri,
  title,
  onClose,
  onVideoEnd,
}: SimpleVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const insets = useSafeAreaInsets();
  const resetKeyRef = useRef(0);
  const prevVisibleRef = useRef(visible);

  // Create video player
  const player = useVideoPlayer && videoUri ? useVideoPlayer(videoUri, (player) => {
    try {
      player.loop = false;
    } catch (error) {
      console.error('Error initializing video player', error);
    }
  }) : null;

  // Handle video end
  useEffect(() => {
    if (!player || !visible) return;

    try {
      const subscription = player.addListener('playToEnd', () => {
        setIsPlaying(false);
        if (onVideoEnd) {
          onVideoEnd();
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
      console.error('Error setting up video listener', error);
    }
  }, [player, visible, onVideoEnd]);

  // Reset video when modal opens (increment reset key)
  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      // Modal just opened - reset the video by incrementing the key
      resetKeyRef.current += 1;
    }
    prevVisibleRef.current = visible;
  }, [visible]);

  // Auto-play when modal opens
  useEffect(() => {
    if (visible && player && videoUri) {
      setIsLoading(true);
      setShowControls(true);
      // Wait a bit for video to load, then play
      const playTimer = setTimeout(() => {
        try {
          if (player) {
            player.play();
            setIsPlaying(true);
          }
        } catch (error) {
          console.error('Error playing video', error);
          setIsLoading(false);
        }
      }, 300);
      
      return () => clearTimeout(playTimer);
    } else if (!visible && player) {
      // Pause when modal closes
      try {
        player.pause();
        setIsPlaying(false);
        setIsLoading(false);
      } catch (error) {
        console.error('Error pausing video', error);
      }
    }
  }, [visible, player, videoUri]);

  // Auto-hide controls after 3 seconds (only when playing)
  useEffect(() => {
    if (!visible || !showControls || !isPlaying) return;

    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showControls, visible, isPlaying]);

  const handlePlayPause = () => {
    if (!player) return;

    try {
      if (isPlaying) {
        player.pause();
        setIsPlaying(false);
      } else {
        player.play();
        setIsPlaying(true);
      }
      setShowControls(true);
    } catch (error) {
      console.error('Error toggling play/pause', error);
    }
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  if (!VideoView || !useVideoPlayer) {
    return (
      <Modal
        visible={visible}
        animationType="fade"
        transparent={false}
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Ionicons name="videocam-off" size={48} color="#999" />
            <Text style={styles.errorText}>
              Video player requires a development build.{'\n'}
              Please rebuild the app with: npx expo run:ios
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  if (!videoUri) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar hidden />
      <View style={styles.container}>
        {player && (
          <VideoView
            key={`video-${resetKeyRef.current}`}
            player={player}
            style={styles.video}
            contentFit="contain"
            nativeControls={false}
            fullscreenOptions={{ enterFullscreenButton: false, exitFullscreenButton: false }}
            allowsPictureInPicture={false}
            onLoadStart={() => {
              setIsLoading(true);
            }}
            onLoad={() => {
              setIsLoading(false);
              // Ensure video plays after loading
              if (visible && !isPlaying) {
                try {
                  player.play();
                  setIsPlaying(true);
                } catch (error) {
                  console.error('Error playing after load', error);
                }
              }
            }}
          />
        )}

        {/* Loading Indicator - only show when actually loading */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}

        {/* Show play button overlay when not playing */}
        {!isPlaying && !isLoading && (
          <View style={styles.playOverlay}>
            <TouchableOpacity
              onPress={handlePlayPause}
              style={styles.bigPlayButton}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']}
                style={styles.bigPlayButtonGradient}
              >
                <Ionicons name="play" size={64} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Controls Overlay */}
        <TouchableOpacity
          style={styles.controlsOverlay}
          activeOpacity={1}
          onPress={toggleControls}
        >
          {showControls && (
            <LinearGradient
              colors={['rgba(0,0,0,0.7)', 'transparent', 'transparent', 'rgba(0,0,0,0.7)']}
              style={styles.gradient}
            >
              {/* Top Bar */}
              <View style={[styles.topBar, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={28} color="#FFFFFF" />
                </TouchableOpacity>
                {title && (
                  <Text style={styles.videoTitle} numberOfLines={1}>
                    {title}
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
                    name={isPlaying ? 'pause' : 'play'}
                    size={48}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>

              {/* Bottom Bar */}
              <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]} />
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    padding: 12,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  bigPlayButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  bigPlayButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
});

