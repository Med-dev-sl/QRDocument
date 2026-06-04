import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { API_URL, apiGet, getToken, type Document } from '@/api';
import { useResponsive } from '@/lib/responsive';
import ErrorModal from '@/components/error-modal';

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isSmall, width, contentMaxWidth } = useResponsive();
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState({ visible: false, message: '' });
  const fileModule = useRef<any>(null);

  useEffect(() => {
    apiGet<Document>(`/api/documents/${id}`)
      .then(setDoc)
      .catch(err => setError({ visible: true, message: err.message }))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    import('expo-file-system').then(m => { fileModule.current = m; });
  }, []);

  const downloadUrl = `${API_URL}/api/documents/${id}/download`;
  const qrUrl = `${API_URL}/api/documents/${id}/qr`;
  const publicUrl = `${API_URL}/api/documents/public/${id}/download`;

  useEffect(() => {
    if (!doc || Platform.OS === 'web' || !fileModule.current) return;
    const { File, Paths } = fileModule.current;
    File.downloadFileAsync(downloadUrl, new File(Paths.document, `${doc.documentId}.pdf`), {
      headers: { Authorization: `Bearer ${getToken()}` },
      idempotent: true,
    })
      .then(() => setCached(true))
      .catch(() => {});
  }, [doc]);

  const handleDownload = async () => {
    if (!doc) return;
    if (Platform.OS === 'web' || !fileModule.current) {
      try {
        const resp = await fetch(downloadUrl, { headers: { Authorization: `Bearer ${getToken()}` } });
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err: any) {
        setError({ visible: true, message: err.message });
      }
      return;
    }

    setDownloading(true);
    try {
      const { File, Paths } = fileModule.current;
      const file = await File.downloadFileAsync(downloadUrl, new File(Paths.document, `${doc.documentId}.pdf`), {
        headers: { Authorization: `Bearer ${getToken()}` },
        idempotent: true,
      });
      setCached(true);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf' });
      } else {
        Alert.alert('Downloaded', 'File saved to device');
      }
    } catch (err: any) {
      setError({ visible: true, message: err.message });
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `Document: ${doc?.documentId} - ${doc?.title}\n\n${publicUrl}` });
    } catch {}
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#208AEF" />
      </View>
    );
  }

  if (!doc) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><Text style={styles.errorText}>Document not found</Text></View>
      </SafeAreaView>
    );
  }

  const contentPadding = Math.max(16, (width - contentMaxWidth) / 2);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: contentPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.headerCard}>
          <Text style={[styles.docTitle, isSmall && styles.docTitleSmall]}>{doc.title}</Text>
          <Text style={styles.docId}>{doc.documentId}</Text>
          {doc.description && <Text style={styles.desc}>{doc.description}</Text>}
          <Text style={styles.meta}>{(doc.fileSize / 1024).toFixed(0)} KB · {doc.uploadedAt}</Text>
          {cached && <Text style={styles.cachedBadge}>✓ Available offline</Text>}
        </View>

        <View style={styles.qrSection}>
          <Text style={styles.sectionTitle}>QR Code</Text>
          <Image
            source={{ uri: qrUrl }}
            style={[styles.qrImage, isSmall && styles.qrImageSmall]}
            resizeMode="contain"
          />
          <Text style={styles.qrHint}>Scan this QR code with any phone camera to view the document</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.downloadBtn, pressed && { opacity: 0.8 }]}
          onPress={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.downloadBtnText}>{cached ? 'Share PDF' : 'Download & Share PDF'}</Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.7 }]}
          onPress={handleShare}
        >
          <Text style={styles.shareBtnText}>Share Document Link</Text>
        </Pressable>
      </ScrollView>

      <ErrorModal visible={error.visible} message={error.message} onDismiss={() => setError({ visible: false, message: '' })} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  scroll: { paddingTop: 8, paddingBottom: 40, alignSelf: 'center', width: '100%' },
  errorText: { fontSize: 16, color: '#94A3B8' },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 8, marginLeft: -8 },
  backArrow: { fontSize: 22, color: '#0F172A' },
  headerCard: {
    backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  docTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  docTitleSmall: { fontSize: 18 },
  docId: { fontSize: 14, color: '#208AEF', fontWeight: '600', marginBottom: 8 },
  desc: { fontSize: 14, color: '#64748B', lineHeight: 20, marginBottom: 8 },
  meta: { fontSize: 13, color: '#94A3B8' },
  cachedBadge: { fontSize: 12, color: '#22C55E', fontWeight: '600', marginTop: 6 },
  qrSection: {
    backgroundColor: 'white', borderRadius: 16, padding: 24, marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#0F172A', marginBottom: 16, alignSelf: 'flex-start' },
  qrImage: { width: 200, height: 200, marginBottom: 12 },
  qrImageSmall: { width: 160, height: 160 },
  qrHint: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
  downloadBtn: {
    backgroundColor: '#0F172A', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginBottom: 12, minHeight: 48, justifyContent: 'center',
  },
  downloadBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  shareBtn: {
    backgroundColor: 'white', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', minHeight: 48, justifyContent: 'center',
  },
  shareBtnText: { color: '#208AEF', fontSize: 16, fontWeight: '600' },
});
