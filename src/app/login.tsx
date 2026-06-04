import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import LoginForm from '@/components/login-form';
import { useResponsive } from '@/lib/responsive';

export default function LoginScreen() {
  const { isSmall } = useResponsive();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={[styles.icon, isSmall && styles.iconSmall]}
          resizeMode="contain"
        />
        <LoginForm />
      </View>
      <Pressable style={({ pressed }) => [styles.footer, pressed && { opacity: 0.7 }]} onPress={() => router.replace('/register')}>
        <Text style={styles.footerText}>
          Don't have an account?{' '}
          <Text style={styles.footerLink}>Sign Up</Text>
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  icon: { width: 140, height: 140 },
  iconSmall: { width: 100, height: 100 },
  footer: { alignItems: 'center', paddingBottom: 32, paddingTop: 8, minHeight: 44, justifyContent: 'center' },
  footerText: { fontSize: 14, color: '#666' },
  footerLink: { color: '#111', fontWeight: '600' },
});
