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
import SuccessModal from '@/components/success-modal';
import ErrorModal from '@/components/error-modal';

export default function UploadScreen() {
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Upload Document</Text>
        <Text style={styles.subtitle}>Select a PDF to upload</Text>

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
        />

        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
          {categories.map(cat => (
            <Pressable
              key={cat.id}
              style={[styles.chip, selectedCategory === cat.id && styles.chipActive]}
              onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
            >
              <Text style={[styles.chipText, selectedCategory === cat.id && styles.chipTextActive]}>
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable style={styles.filePicker} onPress={pickFile}>
          <Text style={styles.filePickerText}>
            {file ? file.name : 'Tap to select PDF'}
          </Text>
        </Pressable>

        <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleUpload} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Upload</Text>}
        </Pressable>
      </ScrollView>

      <SuccessModal visible={showSuccess} firstName="" onFinish={() => router.back()} />
      <ErrorModal visible={error.visible} message={error.message} onDismiss={() => setError({ visible: false, message: '' })} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#64748B', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 15,
    color: '#0F172A', backgroundColor: 'white', marginBottom: 16,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  categoryRow: { marginBottom: 16 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'white', borderWidth: 1, borderColor: '#E2E8F0',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#208AEF', borderColor: '#208AEF' },
  chipText: { fontSize: 14, color: '#64748B' },
  chipTextActive: { color: 'white', fontWeight: '600' },
  filePicker: {
    borderWidth: 2, borderColor: '#208AEF', borderStyle: 'dashed',
    borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 24,
    backgroundColor: '#EFF6FF',
  },
  filePickerText: { color: '#208AEF', fontSize: 15, fontWeight: '500' },
  button: {
    backgroundColor: '#0F172A', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
