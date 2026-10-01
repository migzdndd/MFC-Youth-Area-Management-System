import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { useAuth } from '../../../providers/AuthProvider';
import { SyncIndicator } from '../../../components/SyncIndicator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { Users, Calendar, Award, ShieldAlert } from 'lucide-react-native';

export default function DashboardScreen() {
  const { profile } = useAuth();

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [membersCount, eventsCount, gigCount] = await Promise.all([
        supabase.from('members').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('gig_contributions').select('*', { count: 'exact', head: true }),
      ]);

      return {
        members: membersCount.count || 0,
        events: eventsCount.count || 0,
        gig: gigCount.count || 0,
      };
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.accentCyan} />}
      >
        <SyncIndicator />

        {/* Hero Header */}
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>MFC YOUTH & KIDS MINISTRIES</Text>
          <Text style={styles.greeting}>Welcome, {profile?.full_name || 'Servant'}</Text>
          <View style={styles.roleChip}>
            <ShieldAlert size={12} color={Colors.accentCyan} />
            <Text style={styles.roleText}>
              ROLE: {profile?.role ? profile.role.replace('_', ' ').toUpperCase() : 'MEMBER'}
            </Text>
          </View>
        </View>

        {/* Metrics Section */}
        <Text style={styles.sectionTitle}>Area Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Users size={20} color={Colors.accentCyan} />
              <Text style={styles.statBadge}>Active</Text>
            </View>
            <Text style={styles.statNumber}>{stats?.members ?? '-'}</Text>
            <Text style={styles.statLabel}>Total Members</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Calendar size={20} color={Colors.accentCyan} />
              <Text style={styles.statBadge}>Scheduled</Text>
            </View>
            <Text style={styles.statNumber}>{stats?.events ?? '-'}</Text>
            <Text style={styles.statLabel}>Events & Camps</Text>
          </View>

          <View style={[styles.statCard, styles.fullWidthStat]}>
            <View style={styles.statHeader}>
              <Award size={20} color={Colors.accentCyan} />
              <Text style={styles.statBadge}>Community</Text>
            </View>
            <Text style={styles.statNumber}>{stats?.gig ?? '-'}</Text>
            <Text style={styles.statLabel}>GIG Contributions Recorded</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.pageBg,
  },
  container: {
    padding: 16,
  },
  heroCard: {
    backgroundColor: Colors.primaryNavy,
    borderColor: Colors.borderDark,
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
  },
  kicker: {
    color: Colors.accentCyan,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  greeting: {
    color: Colors.textLight,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: Colors.textLight,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surfaceCard,
    borderColor: Colors.surfaceCardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  fullWidthStat: {
    minWidth: '100%',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statBadge: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statNumber: {
    color: Colors.textLight,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 12,
  },
});
