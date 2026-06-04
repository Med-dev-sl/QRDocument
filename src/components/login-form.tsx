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
import SuccessModal from './success-modal';
import ErrorModal from './error-modal';

export default function LoginForm() {
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
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <SuccessModal
        visible={showSuccess}
        firstName={userName}
        onFinish={() => router.replace('/dashboard')}
      />

      <ErrorModal
        visible={error.visible}
        message={error.message}
        onDismiss={() => setError({ visible: false, message: '' })}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 32,
  },
  form: {
    gap: 14,
    width: '100%',
    maxWidth: 400,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    color: '#111',
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#111',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
