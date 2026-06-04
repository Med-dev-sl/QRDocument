import { useEffect } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useResponsive } from '@/lib/responsive';

type Props = { visible: boolean; firstName: string; onFinish: () => void };

export default function SuccessModal({ visible, firstName, onFinish }: Props) {
  const { isSmall } = useResponsive();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const textSlide = useSharedValue(30);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSequence(
        withTiming(1.15, { duration: 400, easing: Easing.out(Easing.back(1.5)) }),
        withTiming(1, { duration: 200 }),
      );
      opacity.value = withTiming(1, { duration: 400 });
      textSlide.value = withDelay(400, withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }));
      textOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
      const timer = setTimeout(onFinish, 2500);
      return () => clearTimeout(timer);
    } else {
      scale.value = 0;
      opacity.value = 0;
      textSlide.value = 30;
      textOpacity.value = 0;
    }
  }, [visible]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  const textStyle = useAnimatedStyle(() => ({ transform: [{ translateY: textSlide.value }], opacity: textOpacity.value }));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.Image
          source={require('@/assets/images/icon.png')}
          style={[styles.icon, isSmall && styles.iconSmall, iconStyle]}
          resizeMode="contain"
        />
        <Animated.View style={textStyle}>
          <Text style={[styles.welcome, isSmall && styles.welcomeSmall]}>Welcome,</Text>
          <Text style={[styles.name, isSmall && styles.nameSmall]}>{firstName}!</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', gap: 24 },
  icon: { width: 100, height: 100 },
  iconSmall: { width: 72, height: 72 },
  welcome: { fontSize: 22, color: '#666', textAlign: 'center' },
  welcomeSmall: { fontSize: 18 },
  name: { fontSize: 32, fontWeight: '700', color: '#111', textAlign: 'center' },
  nameSmall: { fontSize: 26 },
});
