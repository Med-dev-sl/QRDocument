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

export default function Dashboard() {
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
      if (!getToken()) {
        router.replace('/login');
        return;
      }
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const handleLogout = () => {
    setToken(null);
    router.replace('/login');
  };

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
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchData} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.headerIcon}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.name}>{profile?.firstName}!</Text>
              {profile?.role && (
                <View style={[
                  styles.roleBadge,
                  { backgroundColor: profile.role === 'SUPER_ADMIN' ? '#FEF2F2' : '#F0FDF4' },
                ]}>
                  <Text style={[
                    styles.roleText,
                    { color: profile.role === 'SUPER_ADMIN' ? '#DC2626' : '#16A34A' },
                  ]}>
                    {profile.role === 'SUPER_ADMIN' ? 'Super Admin' : profile.role}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#EEF2FF' }]}>
            <Text style={[styles.statNumber, { color: '#4F46E5' }]}>
              {data?.stats.totalDocuments ?? 0}
            </Text>
            <Text style={styles.statLabel}>Documents</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
            <Text style={[styles.statNumber, { color: '#16A34A' }]}>
              {data?.stats.totalUsers ?? 0}
            </Text>
            <Text style={styles.statLabel}>Users</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFF7ED' }]}>
            <Text style={[styles.statNumber, { color: '#EA580C' }]}>
              {data?.stats.totalCategories ?? 0}
            </Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <Pressable style={styles.actionCard} onPress={() => router.push('/upload')}>
            <Text style={styles.actionIcon}>↑</Text>
            <Text style={styles.actionLabel}>Upload PDF</Text>
          </Pressable>
          <Pressable style={styles.actionCard} onPress={() => router.push('/documents')}>
            <Text style={styles.actionIcon}>📄</Text>
            <Text style={styles.actionLabel}>Documents</Text>
          </Pressable>

        </View>

        {/* Recent Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Documents</Text>
          {data?.recentDocuments.length === 0 ? (
            <Text style={styles.empty}>No documents yet</Text>
          ) : (
            data?.recentDocuments.slice(0, 5).map((doc) => (
              <View key={doc.documentId} style={styles.docItem}>
                <View style={styles.docDot} />
                <View style={styles.docInfo}>
                  <Text style={styles.docTitle} numberOfLines={1}>
                    {doc.title}
                  </Text>
                  <Text style={styles.docMeta}>
                    {doc.uploadedBy} · {doc.uploadedAt}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>


      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'white',
    padding: 8,
  },
  greeting: {
    fontSize: 16,
    color: '#64748B',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row', gap: 12, marginBottom: 28,
  },
  actionCard: {
    flex: 1, backgroundColor: 'white', borderRadius: 14, padding: 16,
    alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  actionIcon: { fontSize: 24 },
  actionLabel: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  empty: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  docDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#208AEF',
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
    marginBottom: 2,
  },
  docMeta: {
    fontSize: 12,
    color: '#94A3B8',
  },
  logoutBtn: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
});
