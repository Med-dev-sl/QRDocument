import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { apiGet, getToken, type Document, type DocumentsResponse } from '@/api';

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await apiGet<DocumentsResponse>('/api/documents');
      setDocuments(res.documents);
    } catch {
      if (!getToken()) router.replace('/login');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocs(); }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#208AEF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDocs} />}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Documents</Text>
          <Pressable style={styles.addBtn} onPress={() => router.push('/upload')}>
            <Text style={styles.addBtnText}>+ Upload</Text>
          </Pressable>
        </View>

        {documents.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No documents yet</Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.push('/upload')}>
              <Text style={styles.emptyBtnText}>Upload your first PDF</Text>
            </Pressable>
          </View>
        ) : documents.map(doc => (
          <Pressable
            key={doc.id}
            style={styles.docCard}
            onPress={() => router.push({ pathname: '/document/[id]', params: { id: doc.documentId } })}
          >
            <View style={styles.docIcon}>
              <Text style={styles.docIconText}>PDF</Text>
            </View>
            <View style={styles.docInfo}>
              <Text style={styles.docTitle} numberOfLines={1}>{doc.title}</Text>
              <Text style={styles.docMeta}>
                {doc.documentId} · {(doc.fileSize / 1024).toFixed(0)} KB
              </Text>
              <Text style={styles.docDate}>{doc.uploadedAt}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  scroll: { padding: 24, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#0F172A' },
  addBtn: { backgroundColor: '#0F172A', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  addBtnText: { color: 'white', fontSize: 14, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 16 },
  emptyText: { fontSize: 16, color: '#94A3B8' },
  emptyBtn: { backgroundColor: '#EFF6FF', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnText: { color: '#208AEF', fontWeight: '600' },
  docCard: {
    flexDirection: 'row', backgroundColor: 'white', borderRadius: 14,
    padding: 16, marginBottom: 12, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  docIcon: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: '#FEF2F2',
    alignItems: 'center', justifyContent: 'center',
  },
  docIconText: { fontSize: 12, fontWeight: '800', color: '#DC2626' },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A', marginBottom: 4 },
  docMeta: { fontSize: 13, color: '#64748B', marginBottom: 2 },
  docDate: { fontSize: 12, color: '#94A3B8' },
});
