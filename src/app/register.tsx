import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import RegisterForm from '@/components/register-form';
import { useResponsive } from '@/lib/responsive';

export default function RegisterScreen() {
  const { isSmall } = useResponsive();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={[styles.icon, isSmall && styles.iconSmall]}
          resizeMode="contain"
        />
        <RegisterForm />
      </View>
      <Pressable style={({ pressed }) => [styles.footer, pressed && { opacity: 0.7 }]} onPress={() => router.replace('/login')}>
        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Text style={styles.footerLink}>Sign In</Text>
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  icon: { width: 120, height: 120 },
  iconSmall: { width: 80, height: 80 },
  footer: { alignItems: 'center', paddingBottom: 32, paddingTop: 8, minHeight: 44, justifyContent: 'center' },
  footerText: { fontSize: 14, color: '#666' },
  footerLink: { color: '#111', fontWeight: '600' },
});
