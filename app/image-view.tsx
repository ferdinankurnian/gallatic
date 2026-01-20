import { BlurView } from 'expo-blur';
import { Image as ExpoImage } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Heart, Info, MoreVertical, Play, Pause, Settings2, Share, Trash2 } from 'lucide-react-native';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withDecay, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useRef, useEffect } from 'react';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedImage = Animated.createAnimatedComponent(ExpoImage);

type Props = {
  imageSize: number;
  stickerSource: any;
  onClose: () => void;
  onTranslateYChange: (value: number) => void;
  onScaleChange: (scale: number) => void;
  onHudToggle: () => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: () => void;
};

export function EmojiSticker({ imageSize, stickerSource, onClose, onTranslateYChange, onScaleChange, onHudToggle, onLoadStart, onLoadEnd, onError }: Props) {
  const scaleImage = useSharedValue(imageSize);
  const savedScale = useSharedValue(imageSize);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const singleTap = Gesture.Tap()
    .maxDuration(250)
    .maxDeltaX(10)
    .maxDeltaY(10)
    .onEnd(() => {
      runOnJS(onHudToggle)();
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDeltaX(10)
    .maxDeltaY(10)
    .onStart(() => {
      const newScale = scaleImage.value === imageSize ? imageSize * 2 : imageSize;
      scaleImage.value = withSpring(newScale);
      if (newScale === imageSize) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
      runOnJS(onScaleChange)(newScale);
    });

  const imageStyle = useAnimatedStyle(() => {
    return {
      width: scaleImage.value,
      height: scaleImage.value,
    };
  });

  const pinch = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scaleImage.value;
    })
    .onUpdate(event => {
      const newScale = Math.max(imageSize, Math.min(savedScale.value * event.scale, imageSize * 3));
      scaleImage.value = newScale;
      const maxTranslate = (newScale - imageSize) / 2;
      translateX.value = Math.max(-maxTranslate, Math.min(maxTranslate, translateX.value));
      translateY.value = Math.max(-maxTranslate, Math.min(maxTranslate, translateY.value));
      runOnJS(onScaleChange)(newScale);
    })
    .onEnd(() => {
      savedScale.value = scaleImage.value;
    });

  const drag = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onChange(event => {
      'worklet';
      if (scaleImage.value > imageSize) {
        const maxTranslateX = (scaleImage.value - imageSize) / 2;
        const maxTranslateY = Math.max(0, (scaleImage.value - SCREEN_HEIGHT) / 2);
        translateX.value = Math.max(-maxTranslateX, Math.min(maxTranslateX, savedTranslateX.value + event.translationX));
        translateY.value = Math.max(-maxTranslateY, Math.min(maxTranslateY, savedTranslateY.value + event.translationY));
        runOnJS(onTranslateYChange)(translateY.value);
      } else {
        translateY.value = Math.max(0, event.translationY);
        runOnJS(onTranslateYChange)(translateY.value);
      }
    })
    .onEnd(event => {
      'worklet';
      if (scaleImage.value === imageSize && event.translationY > 150 && event.velocityY > 50) {
        setTimeout(() => {
          runOnJS(onClose)();
        }, 100);
      } else if (scaleImage.value > imageSize) {
        const maxTranslateX = (scaleImage.value - imageSize) / 2;
        const maxTranslateY = Math.max(0, (scaleImage.value - SCREEN_HEIGHT) / 2);
        translateX.value = withDecay({
          velocity: event.velocityX,
          clamp: [-maxTranslateX, maxTranslateX],
          deceleration: 0.997,
        });
        translateY.value = withDecay({
          velocity: event.velocityY,
          clamp: [-maxTranslateY, maxTranslateY],
          deceleration: 0.997,
        });
      } else if (scaleImage.value === imageSize) {
        translateY.value = withSpring(0, { damping: 50, stiffness: 500 });
        runOnJS(onTranslateYChange)(0);
      }
    });

  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: scaleImage.value > imageSize ? translateX.value : 0,
        },
        {
          translateY: translateY.value,
        },
      ],
      opacity: scaleImage.value === imageSize ?
        1 - Math.max(0, translateY.value) / (SCREEN_HEIGHT * 0.6) :
        1,
    };
  });

  const composed = Gesture.Simultaneous(
    Gesture.Exclusive(doubleTap, singleTap),
    pinch,
    drag
  );

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <GestureDetector gesture={composed}>
        <Animated.View style={containerStyle}>
          <AnimatedImage
            source={stickerSource}
            cachePolicy="disk"
            contentFit="contain"
            style={[imageStyle, { width: imageSize, height: imageSize }]}
            onLoadStart={onLoadStart}
            onLoadEnd={onLoadEnd}
            onError={onError}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export default function ImageView() {
  const params = useLocalSearchParams();
  const barOpacity = useSharedValue(1);
  const isZoomed = useSharedValue(false);

  const imageUri = Array.isArray(params.uri) ? params.uri[0] : params.uri as string;
  const isVideo = imageUri.match(/\.(mp4|mov|avi|mkv|webm)$/i) !== null;
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const player = useVideoPlayer(imageUri || '');
  const videoRef = useRef<VideoView>(null);

  const handleClose = useCallback(() => {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    }
    router.back();
  }, [isPlaying, player]);

  const handleTranslateYChange = useCallback((value: number) => {
    if (!isZoomed.value) {
      barOpacity.value = Math.max(0, 1 - value / 200);
    }
  }, [barOpacity, isZoomed]);

  const handleScaleChange = useCallback((scale: number) => {
    isZoomed.value = scale > SCREEN_WIDTH;
    if (isZoomed.value) {
      barOpacity.value = 0;
    }
  }, [barOpacity, isZoomed]);

  const handleHudToggle = useCallback(() => {
    barOpacity.value = barOpacity.value > 0.5 ? 0 : 1;
    setShowControls(!showControls);
  }, [barOpacity, showControls]);

  const handleImageLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
  }, []);

  const handleImageLoadEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  }, [isPlaying, player]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (showControls && !isZoomed.value) {
        setShowControls(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [showControls, isZoomed.value]);

  useEffect(() => {
    const subscription = player.addListener('statusChange', (status: any) => {
      if (status.isLoaded) {
        setIsLoading(false);
        setHasError(false);
        setDuration(status.durationMillis / 1000);
      }
      if (status.isPlaying !== undefined) {
        setIsPlaying(status.isPlaying);
      }
      if (status.positionMillis !== undefined) {
        setCurrentTime(status.positionMillis / 1000);
      }
    });

    return () => subscription.remove();
  }, [player]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: barOpacity.value,
  }));

  const bottomStyle = useAnimatedStyle(() => ({
    opacity: barOpacity.value,
  }));

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill]} pointerEvents="box-none">
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Header */}
          <Animated.View style={[styles.header, styles.bar, headerStyle]}>
            <BlurView experimentalBlurMethod="dimezisBlurView" intensity={40} tint="dark" style={styles.Button}>
              <TouchableOpacity onPress={handleClose}>
                <ChevronLeft size={24} color="white" />
              </TouchableOpacity>
            </BlurView>
            <BlurView experimentalBlurMethod="dimezisBlurView" intensity={40} tint="dark" style={[styles.Button, styles.dateBlurView]}>
              <View style={styles.dateContainer}>
                <Text style={styles.dateText}>25 December</Text>
                <Text style={styles.timeText}>{isVideo ? formatTime(currentTime) : '21:00'}</Text>
              </View>
            </BlurView>
            <BlurView experimentalBlurMethod="dimezisBlurView" intensity={40} tint="dark" style={styles.Button}>
              <TouchableOpacity>
                <MoreVertical size={24} color="white" />
              </TouchableOpacity>
            </BlurView>
          </Animated.View>

          {!isVideo && (
            <EmojiSticker
              imageSize={SCREEN_WIDTH}
              stickerSource={{ uri: imageUri }}
              onClose={handleClose}
              onTranslateYChange={handleTranslateYChange}
              onScaleChange={handleScaleChange}
              onHudToggle={handleHudToggle}
              onLoadStart={handleImageLoadStart}
              onLoadEnd={handleImageLoadEnd}
              onError={handleImageError}
            />
          )}

          {isVideo && (
            <VideoView
              ref={videoRef}
              style={styles.video}
              player={player}
              nativeControls={false}
              allowsFullscreen
              allowsPictureInPicture
            />
          )}

          {isLoading && !isVideo && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
          {hasError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load image</Text>
            </View>
          )}

          {/* Bottom controls */}
          <Animated.View style={[styles.bottom, styles.bar, bottomStyle]}>
            <BlurView experimentalBlurMethod="dimezisBlurView" intensity={40} tint="dark" style={styles.Button}>
              <TouchableOpacity>
                <Share size={24} color="white" />
              </TouchableOpacity>
            </BlurView>
            <BlurView experimentalBlurMethod="dimezisBlurView" intensity={40} tint="dark" style={styles.Button}>
              <TouchableOpacity>
                <Heart size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity>
                <Info size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity>
                <Settings2 size={24} color="white" />
              </TouchableOpacity>
            </BlurView>
            <BlurView experimentalBlurMethod="dimezisBlurView" intensity={40} tint="dark" style={styles.Button}>
              <TouchableOpacity>
                <Trash2 size={24} color="white" />
              </TouchableOpacity>
            </BlurView>
          </Animated.View>

          {isVideo && showControls && (
            <Animated.View style={[styles.videoControlsContainer, bottomStyle]}>
              <BlurView experimentalBlurMethod="dimezisBlurView" intensity={40} tint="dark" style={styles.videoControlBlur}>
                <TouchableOpacity onPress={togglePlayback} style={styles.playPauseButton}>
                  {isPlaying ? <Pause size={28} color="white" /> : <Play size={28} color="white" />}
                </TouchableOpacity>
                <View style={styles.sliderContainer}>
                  <Text style={styles.timeTextSmall}>{formatTime(currentTime)}</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${(currentTime / (duration || 1)) * 100}%` }]} />
                    <View style={[styles.sliderThumb, { left: `${(currentTime / (duration || 1)) * 100}%` }]} />
                  </View>
                  <Text style={styles.timeTextSmall}>{formatTime(duration)}</Text>
                </View>
              </BlurView>
            </Animated.View>
          )}
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  Button: {
    padding: 10,
    borderRadius: 50,
    overflow: 'hidden',
    borderColor: '#6d6d6d88',
    borderWidth: 2,
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  dateBlurView: {
    paddingHorizontal: 20,
    paddingVertical: 7,
  },
  dateContainer: {
    flexDirection: 'column',
    gap: 2,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
  },
  bar: {
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  bottom: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingBottom: 16,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    paddingTop: 16,
  },
  videoControls: {
    bottom: 100,
  },
  videoControlsContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  videoControlBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  playPauseButton: {
    padding: 5,
  },
  sliderContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    top: '50%',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    marginTop: -6,
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: '#000',
  },
  dateText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  timeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  timeTextSmall: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    minWidth: 40,
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -20,
    marginLeft: -20,
    zIndex: 2,
  },
  errorContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -30,
    marginLeft: -100,
    width: 200,
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});
