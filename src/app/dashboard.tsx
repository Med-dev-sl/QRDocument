import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { apiGet, getToken, setToken, type DashboardResponse, type UserProfile } from '@/api';
import { useResponsive } from '@/lib/responsive';

export default function Dashboard() {
  const { isSmall, isLarge, padding, contentMaxWidth, width } = useResponsive();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [userRes, dashRes] = await Promise.all([
        apiGet<UserProfile>('/api/users/me'),
        apiGet<DashboardResponse>('/api/dashboard/stats'),
      ]);
      setProfile(userRes);
      setData(dashRes);
    } catch (err: any) {
      if (!getToken()) { router.replace('/login'); return; }
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const handleLogout = () => { setToken(null); router.replace('/login'); };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#208AEF" />
      </View>
    );
  }

  const contentPadding = Math.max(padding, (width - contentMaxWidth) / 2);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: contentPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={[styles.headerIcon, isSmall && styles.headerIconSmall]}
              resizeMode="contain"
            />
            <View style={styles.headerText}>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={[styles.name, isSmall && styles.nameSmall]} numberOfLines={1}>{profile?.firstName}!</Text>
              {profile?.role && (
                <View style={[styles.roleBadge, { backgroundColor: profile.role === 'SUPER_ADMIN' ? '#FEF2F2' : '#F0FDF4' }]}>
                  <Text style={[styles.roleText, { color: profile.role === 'SUPER_ADMIN' ? '#DC2626' : '#16A34A' }]}>
                    {profile.role === 'SUPER_ADMIN' ? 'Super Admin' : profile.role}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <Pressable style={({ pressed }) => [styles.logoutBtn, pressed && styles.btnPressed]} onPress={handleLogout}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>
        </View>

        <View style={[styles.statsRow, isLarge && { maxWidth: 600 }]}>
          <View style={[styles.statCard, { backgroundColor: '#EEF2FF' }]}>
            <Text style={[styles.statNumber, { color: '#4F46E5' }]}>{data?.stats.totalDocuments ?? 0}</Text>
            <Text style={styles.statLabel}>Documents</Text>
          </View>
          {profile?.role === 'SUPER_ADMIN' && (
            <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
              <Text style={[styles.statNumber, { color: '#16A34A' }]}>{data?.stats.totalUsers ?? 0}</Text>
              <Text style={styles.statLabel}>Users</Text>
            </View>
          )}
          <View style={[styles.statCard, { backgroundColor: '#FFF7ED' }]}>
            <Text style={[styles.statNumber, { color: '#EA580C' }]}>{data?.stats.totalCategories ?? 0}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable style={({ pressed }) => [styles.actionCard, pressed && styles.cardPressed]} onPress={() => router.push('/upload')}>
            <Text style={styles.actionIcon}>↑</Text>
            <Text style={styles.actionLabel}>Upload PDF</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.actionCard, pressed && styles.cardPressed]} onPress={() => router.push('/documents')}>
            <Text style={styles.actionIcon}>📄</Text>
            <Text style={styles.actionLabel}>Documents</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Documents</Text>
          {data?.recentDocuments.length === 0 ? (
            <Text style={styles.empty}>No documents yet</Text>
          ) : (
            data?.recentDocuments.slice(0, 5).map((doc) => (
              <Pressable
                key={doc.documentId}
                style={({ pressed }) => [styles.docItem, pressed && styles.docItemPressed]}
                onPress={() => router.push({ pathname: '/document/[id]', params: { id: doc.documentId } })}
              >
                <View style={styles.docDot} />
                <View style={styles.docInfo}>
                  <Text style={styles.docTitle} numberOfLines={1}>{doc.title}</Text>
                  <Text style={styles.docMeta}>{doc.uploadedBy} · {doc.uploadedAt}</Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  scroll: { paddingTop: 16, paddingBottom: 32, alignSelf: 'center', width: '100%' },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minHeight: 44 },
  headerText: { flex: 1 },
  headerIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'white' },
  headerIconSmall: { width: 40, height: 40 },
  greeting: { fontSize: 14, color: '#64748B' },
  name: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  nameSmall: { fontSize: 18 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  roleText: { fontSize: 12, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionCard: {
    flex: 1, backgroundColor: 'white', borderRadius: 14, padding: 16, alignItems: 'center',
    gap: 8, minHeight: 80, justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  cardPressed: { opacity: 0.7 },
  actionIcon: { fontSize: 24 },
  actionLabel: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24, width: '100%' },
  statCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 4, minHeight: 80, justifyContent: 'center' },
  statNumber: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  section: {
    backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#0F172A', marginBottom: 12 },
  empty: { color: '#94A3B8', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  docItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', minHeight: 48 },
  docItemPressed: { opacity: 0.6, backgroundColor: '#F8FAFC' },
  docDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#208AEF' },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 15, fontWeight: '500', color: '#0F172A', marginBottom: 2 },
  docMeta: { fontSize: 12, color: '#94A3B8' },
  logoutBtn: {
    backgroundColor: '#FEF2F2', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: '#FECACA', minHeight: 44, justifyContent: 'center',
  },
  btnPressed: { opacity: 0.7 },
  logoutText: { color: '#DC2626', fontSize: 13, fontWeight: '600' },
});
