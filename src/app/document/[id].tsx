import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { API_URL, apiGet, getToken, type Document } from '@/api';
import ErrorModal from '@/components/error-modal';

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState({ visible: false, message: '' });

  useEffect(() => {
    apiGet<Document>(`/api/documents/${id}`)
      .then(setDoc)
      .catch(err => setError({ visible: true, message: err.message }))
      .finally(() => setLoading(false));
  }, [id]);

  const qrUrl = `${API_URL}/api/documents/${id}/qr`;
  const downloadUrl = `${API_URL}/api/documents/${id}/download`;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const file = await File.downloadFileAsync(downloadUrl, Paths.document, {
        headers: { Authorization: `Bearer ${getToken()}` },
        idempotent: true,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf' });
      } else {
        Alert.alert('Downloaded', `Saved to device`);
      }
    } catch (err: any) {
      setError({ visible: true, message: err.message });
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `View document ${doc?.documentId} - ${doc?.title}\n\nDownload: ${downloadUrl}\nScan QR: ${qrUrl}`,
      });
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>

        <View style={styles.headerCard}>
          <Text style={styles.docTitle}>{doc.title}</Text>
          <Text style={styles.docId}>{doc.documentId}</Text>
          {doc.description && <Text style={styles.desc}>{doc.description}</Text>}
          <Text style={styles.meta}>{(doc.fileSize / 1024).toFixed(0)} KB · {doc.uploadedAt}</Text>
        </View>

        <View style={styles.qrSection}>
          <Text style={styles.sectionTitle}>QR Code</Text>
          <Image
            source={{ uri: qrUrl }}
            style={styles.qrImage}
            resizeMode="contain"
          />
          <Text style={styles.qrHint}>Scan this QR code to view the document offline</Text>
        </View>

        <Pressable style={styles.downloadBtn} onPress={handleDownload} disabled={downloading}>
          {downloading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.downloadBtnText}>Download & Share PDF</Text>
          )}
        </Pressable>

        <Pressable style={styles.shareBtn} onPress={handleShare}>
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
  scroll: { padding: 24, paddingBottom: 40 },
  back: { fontSize: 16, color: '#208AEF', fontWeight: '500', marginBottom: 20 },
  errorText: { fontSize: 16, color: '#94A3B8' },
  headerCard: {
    backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  docTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  docId: { fontSize: 14, color: '#208AEF', fontWeight: '600', marginBottom: 8 },
  desc: { fontSize: 14, color: '#64748B', lineHeight: 20, marginBottom: 8 },
  meta: { fontSize: 13, color: '#94A3B8' },
  qrSection: {
    backgroundColor: 'white', borderRadius: 16, padding: 24, marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#0F172A', marginBottom: 16, alignSelf: 'flex-start' },
  qrImage: { width: 200, height: 200, marginBottom: 12 },
  qrHint: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
  downloadBtn: {
    backgroundColor: '#0F172A', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginBottom: 12,
  },
  downloadBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  shareBtn: {
    backgroundColor: 'white', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0',
  },
  shareBtnText: { color: '#208AEF', fontSize: 16, fontWeight: '600' },
});
