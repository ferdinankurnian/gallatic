import { BlurView } from 'expo-blur';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Heart, Info, MoreVertical, Settings2, Share, Trash2 } from 'lucide-react-native';
import { Dimensions, ImageSourcePropType, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withDecay, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Props = {
  imageSize: number;
  stickerSource: ImageSourcePropType;
  onClose: () => void;
  onTranslateYChange: (value: number) => void;
  onScaleChange: (scale: number) => void;
  onHudToggle: () => void;
};

export function EmojiSticker({ imageSize, stickerSource, onClose, onTranslateYChange, onScaleChange, onHudToggle }: Props) {
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
          <Animated.Image
            source={stickerSource}
            resizeMode="contain"
            style={[imageStyle, { width: imageSize, height: imageSize }]}
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

  const handleClose = () => {
    router.back();
  };

  const handleTranslateYChange = (value: number) => {
    if (!isZoomed.value) {
      barOpacity.value = Math.max(0, 1 - value / 200);
    }
  };

  const handleScaleChange = (scale: number) => {
    isZoomed.value = scale > SCREEN_WIDTH;
    if (isZoomed.value) {
      barOpacity.value = 0;
    }
  };

  const handleHudToggle = () => {
    barOpacity.value = barOpacity.value > 0.5 ? 0 : 1;
  };

  const headerStyle = useAnimatedStyle(() => ({
    opacity: barOpacity.value,
  }));

  const bottomStyle = useAnimatedStyle(() => ({
    opacity: barOpacity.value,
  }));

  return (
    <View style={styles.container}>

      {/* Controls */}
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
                <Text style={styles.timeText}>21:00</Text>
              </View>
            </BlurView>
            <BlurView experimentalBlurMethod="dimezisBlurView" intensity={40} tint="dark" style={styles.Button}>
              <TouchableOpacity>
                <MoreVertical size={24} color="white" />
              </TouchableOpacity>
            </BlurView>
          </Animated.View>

          <EmojiSticker
            imageSize={SCREEN_WIDTH}
            stickerSource={{ uri: imageUri }}
            onClose={handleClose}
            onTranslateYChange={handleTranslateYChange}
            onScaleChange={handleScaleChange}
            onHudToggle={handleHudToggle}
          />
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
  imageContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    top: (SCREEN_HEIGHT - SCREEN_WIDTH) / 2,
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
});