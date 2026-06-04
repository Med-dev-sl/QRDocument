import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { useResponsive } from '@/lib/responsive';

type Props = { visible: boolean; message: string; onDismiss: () => void };

export default function ErrorModal({ visible, message, onDismiss }: Props) {
  const { isSmall } = useResponsive();
  const shake = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      shake.value = withSequence(
        withTiming(-12, { duration: 60 }), withTiming(12, { duration: 60 }),
        withTiming(-8, { duration: 60 }), withTiming(8, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
    } else {
      opacity.value = 0;
      shake.value = 0;
    }
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }], opacity: opacity.value }));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Animated.View style={[styles.card, isSmall && styles.cardSmall, cardStyle]}>
          <Animated.Image
            source={require('@/assets/images/icon.png')}
            style={[styles.icon, isSmall && styles.iconSmall]}
            resizeMode="contain"
          />
          <Text style={styles.title}>Oops!</Text>
          <Text style={styles.message}>{message}</Text>
          <Pressable style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]} onPress={onDismiss}>
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: 'white', borderRadius: 24, padding: 32, alignItems: 'center',
    gap: 12, width: '100%', maxWidth: 340,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 10,
  },
  cardSmall: { padding: 24, maxWidth: 300 },
  icon: { width: 56, height: 56, tintColor: '#dc2626' },
  iconSmall: { width: 44, height: 44 },
  title: { fontSize: 22, fontWeight: '700', color: '#dc2626' },
  message: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22 },
  button: { backgroundColor: '#dc2626', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32, marginTop: 8, minHeight: 44, justifyContent: 'center' },
  buttonText: { color: 'white', fontSize: 15, fontWeight: '600' },
});
