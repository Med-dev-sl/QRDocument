import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { apiPost, setToken, type AuthResponse } from '@/api';
import { useResponsive } from '@/lib/responsive';
import SuccessModal from './success-modal';
import ErrorModal from './error-modal';

export default function LoginForm() {
  const { isSmall, padding, contentMaxWidth } = useResponsive();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [userName, setUserName] = useState('');
  const [error, setError] = useState({ visible: false, message: '' });

  const handleLogin = async () => {
    if (!email || !password) {
      setError({ visible: true, message: 'Please fill in all fields' });
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost<AuthResponse>('/api/auth/login', { email, password });
      setToken(res.token);
      setUserName(res.user.firstName);
      setShowSuccess(true);
    } catch (err: any) {
      setError({ visible: true, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        style={[styles.container, { paddingHorizontal: padding }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.inner, { maxWidth: contentMaxWidth }]}>
          <Text style={[styles.title, isSmall && styles.titleSmall]}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              value={password}
              onChangeText={setPassword}
            />

            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.btnPressed]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Sign In</Text>}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <SuccessModal visible={showSuccess} firstName={userName} onFinish={() => router.replace('/dashboard')} />
      <ErrorModal visible={error.visible} message={error.message} onDismiss={() => setError({ visible: false, message: '' })} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  inner: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  titleSmall: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 28,
  },
  form: {
    gap: 14,
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111',
    backgroundColor: '#f9f9f9',
    minHeight: 48,
  },
  button: {
    backgroundColor: '#111',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 48,
    justifyContent: 'center',
  },
  btnPressed: { opacity: 0.8 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
