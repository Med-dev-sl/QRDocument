import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import RegisterForm from '@/components/register-form';

export default function RegisterScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.icon}
          resizeMode="contain"
        />
        <RegisterForm />
      </View>
      <Pressable style={styles.footer} onPress={() => router.replace('/login')}>
        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Text style={styles.footerLink}>Sign In</Text>
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  icon: {
    width: 180,
    height: 180,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  footerLink: {
    color: '#111',
    fontWeight: '600',
  },
});
