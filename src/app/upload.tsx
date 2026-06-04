import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { apiGet, apiUpload, getToken, type Category, type CategoriesResponse, type UploadResponse } from '@/api';
import { useResponsive } from '@/lib/responsive';
import SuccessModal from '@/components/success-modal';
import ErrorModal from '@/components/error-modal';

export default function UploadScreen() {
  const { isSmall, width, contentMaxWidth } = useResponsive();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState({ visible: false, message: '' });

  useEffect(() => {
    apiGet<CategoriesResponse>('/api/categories')
      .then(res => setCategories(res.categories))
      .catch(() => {});
  }, []);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (!result.canceled && result.assets?.[0]) setFile(result.assets[0]);
    } catch {
      setError({ visible: true, message: 'Failed to pick file' });
    }
  };

  const handleUpload = async () => {
    if (!title || !file) {
      setError({ visible: true, message: 'Title and file are required' });
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('title', title);
      if (description) form.append('description', description);
      if (selectedCategory) form.append('categoryId', String(selectedCategory));
      if (Platform.OS === 'web' && (file as any).file) {
        form.append('file', (file as any).file);
      } else {
        form.append('file', { uri: file.uri, name: file.name, type: 'application/pdf' } as any);
      }
      await apiUpload<UploadResponse>('/api/documents/upload', form);
      setShowSuccess(true);
    } catch (err: any) {
      setError({ visible: true, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const contentPadding = Math.max(16, (width - contentMaxWidth) / 2);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: contentPadding }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Upload Document</Text>
        <Text style={styles.subtitle}>Select a PDF to upload</Text>

        <View style={isSmall ? styles.formCompact : styles.form}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Document title"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Optional description"
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
            {categories.map(cat => (
              <Pressable
                key={cat.id}
                style={({ pressed }) => [styles.chip, selectedCategory === cat.id && styles.chipActive, pressed && { opacity: 0.7 }]}
                onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              >
                <Text style={[styles.chipText, selectedCategory === cat.id && styles.chipTextActive]}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable style={({ pressed }) => [styles.filePicker, pressed && { opacity: 0.7 }]} onPress={pickFile}>
            <Text style={styles.filePickerText} numberOfLines={1}>
              {file ? file.name : 'Tap to select PDF'}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.button, loading && styles.btnDisabled, pressed && !loading && styles.btnPressed]}
            onPress={handleUpload}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Upload</Text>}
          </Pressable>
        </View>
      </ScrollView>

      <SuccessModal visible={showSuccess} firstName="" onFinish={() => router.back()} />
      <ErrorModal visible={error.visible} message={error.message} onDismiss={() => setError({ visible: false, message: '' })} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { paddingTop: 16, paddingBottom: 40, alignSelf: 'center', width: '100%' },
  title: { fontSize: 24, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#64748B', marginBottom: 20 },
  form: { gap: 2 },
  formCompact: { gap: 0 },
  label: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16,
    color: '#0F172A', backgroundColor: 'white', marginBottom: 4, minHeight: 48,
  },
  textArea: { height: 80 },
  categoryRow: { marginBottom: 12, minHeight: 44 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: 'white', borderWidth: 1, borderColor: '#E2E8F0',
    marginRight: 8, minHeight: 40, justifyContent: 'center',
  },
  chipActive: { backgroundColor: '#208AEF', borderColor: '#208AEF' },
  chipText: { fontSize: 14, color: '#64748B' },
  chipTextActive: { color: 'white', fontWeight: '600' },
  filePicker: {
    borderWidth: 2, borderColor: '#208AEF', borderStyle: 'dashed',
    borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 20, marginTop: 8,
    backgroundColor: '#EFF6FF', minHeight: 56, justifyContent: 'center',
  },
  filePickerText: { color: '#208AEF', fontSize: 15, fontWeight: '500' },
  button: {
    backgroundColor: '#0F172A', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', minHeight: 48, justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnPressed: { opacity: 0.8 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
