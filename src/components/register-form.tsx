import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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

export default function RegisterForm() {
  const { isSmall, padding, contentMaxWidth } = useResponsive();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [userName, setUserName] = useState('');
  const [error, setError] = useState({ visible: false, message: '' });

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError({ visible: true, message: 'Please fill in all fields' });
      return;
    }
    if (password !== confirmPassword) {
      setError({ visible: true, message: 'Passwords do not match' });
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost<AuthResponse>('/api/auth/register', { firstName, lastName, email, password });
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingHorizontal: padding }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.inner, { maxWidth: contentMaxWidth }]}>
            <Text style={[styles.title, isSmall && styles.titleSmall]}>Create Account</Text>
            <Text style={styles.subtitle}>Fill in your details to get started</Text>

            <View style={styles.form}>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="First Name"
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                  returnKeyType="next"
                  value={firstName}
                  onChangeText={setFirstName}
                />
                <View style={styles.rowGap} />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Last Name"
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                  returnKeyType="next"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>

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
                returnKeyType="next"
                value={password}
                onChangeText={setPassword}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#999"
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <Pressable
                style={({ pressed }) => [styles.button, pressed && styles.btnPressed]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Create Account</Text>}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SuccessModal visible={showSuccess} firstName={userName} onFinish={() => router.replace('/dashboard')} />
      <ErrorModal visible={error.visible} message={error.message} onDismiss={() => setError({ visible: false, message: '' })} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', width: '100%' },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 24 },
  inner: { width: '100%', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#111', marginBottom: 4 },
  titleSmall: { fontSize: 24 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 28 },
  form: { gap: 14, width: '100%' },
  row: { flexDirection: 'row' },
  rowGap: { width: 12 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16,
    color: '#111', backgroundColor: '#f9f9f9', minHeight: 48,
  },
  halfInput: { flex: 1 },
  button: {
    backgroundColor: '#111', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 8, minHeight: 48, justifyContent: 'center',
  },
  btnPressed: { opacity: 0.8 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
