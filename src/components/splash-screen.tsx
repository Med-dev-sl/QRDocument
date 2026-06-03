import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const DURATION_ENTRANCE = 800;
const DURATION_PULSE = 1200;
const SPLASH_DISPLAY = 2500;

type Props = {
  onFinish?: () => void;
};

export default function SplashScreen({ onFinish }: Props) {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, {
      duration: DURATION_ENTRANCE,
      easing: Easing.out(Easing.back(2)),
    });
    opacity.value = withTiming(1, { duration: DURATION_ENTRANCE });

    const timer = setTimeout(() => {
      onFinish?.();
    }, SPLASH_DISPLAY);

    const pulseDelay = DURATION_ENTRANCE + 200;
    scale.value = withDelay(
      pulseDelay,
      withRepeat(
        withSequence(
          withTiming(1.08, { duration: DURATION_PULSE / 2, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: DURATION_PULSE / 2, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );

    return () => clearTimeout(timer);
  }, []);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('@/assets/images/icon.png')}
        style={[styles.icon, imageStyle]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 200,
    height: 200,
  },
});
