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
import { useResponsive } from '@/lib/responsive';

export default function DocumentsScreen() {
  const { isSmall, width, contentMaxWidth } = useResponsive();
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

  const contentPadding = Math.max(16, (width - contentMaxWidth) / 2);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: contentPadding }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDocs} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Documents</Text>
          <Pressable style={({ pressed }) => [styles.addBtn, pressed && styles.btnPressed]} onPress={() => router.push('/upload')}>
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
            style={({ pressed }) => [styles.docCard, pressed && styles.docCardPressed]}
            onPress={() => router.push({ pathname: '/document/[id]', params: { id: doc.documentId } })}
          >
            <View style={[styles.docIcon, isSmall && styles.docIconSmall]}>
              <Text style={styles.docIconText}>PDF</Text>
            </View>
            <View style={styles.docInfo}>
              <Text style={styles.docTitle} numberOfLines={1}>{doc.title}</Text>
              <Text style={styles.docMeta}>{doc.documentId} · {(doc.fileSize / 1024).toFixed(0)} KB</Text>
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
  scroll: { paddingTop: 16, paddingBottom: 32, alignSelf: 'center', width: '100%' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, minHeight: 44 },
  title: { fontSize: 24, fontWeight: '700', color: '#0F172A' },
  addBtn: { backgroundColor: '#0F172A', borderRadius: 10, paddingHorizontal: 16, minHeight: 40, justifyContent: 'center' },
  btnPressed: { opacity: 0.7 },
  addBtnText: { color: 'white', fontSize: 14, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 16 },
  emptyText: { fontSize: 16, color: '#94A3B8' },
  emptyBtn: { backgroundColor: '#EFF6FF', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12, minHeight: 44, justifyContent: 'center' },
  emptyBtnText: { color: '#208AEF', fontWeight: '600' },
  docCard: {
    flexDirection: 'row', backgroundColor: 'white', borderRadius: 14,
    padding: 14, marginBottom: 10, gap: 14, minHeight: 64,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  docCardPressed: { opacity: 0.7 },
  docIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  docIconSmall: { width: 36, height: 36 },
  docIconText: { fontSize: 12, fontWeight: '800', color: '#DC2626' },
  docInfo: { flex: 1, justifyContent: 'center' },
  docTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginBottom: 2 },
  docMeta: { fontSize: 13, color: '#64748B', marginBottom: 1 },
  docDate: { fontSize: 12, color: '#94A3B8' },
});
