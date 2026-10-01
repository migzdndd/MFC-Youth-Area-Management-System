import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';
import { Calendar, MapPin, QrCode } from 'lucide-react-native';

export default function EventsScreen() {
  const router = useRouter();

  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ['events-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Events & Conferences</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.accentCyan} style={styles.loader} />
        ) : (
          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            onRefresh={refetch}
            refreshing={isLoading}
            renderItem={({ item }) => (
              <View style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>{item.title}</Text>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>
                      {item.event_type ? item.event_type.toUpperCase() : 'EVENT'}
                    </Text>
                  </View>
                </View>

                <View style={styles.row}>
                  <Calendar size={14} color={Colors.accentCyan} />
                  <Text style={styles.rowText}>
                    {item.event_date ? new Date(item.event_date).toLocaleDateString() : 'Date TBD'}
                  </Text>
                </View>

                {item.location && (
                  <View style={styles.row}>
                    <MapPin size={14} color={Colors.accentCyan} />
                    <Text style={styles.rowText}>{item.location}</Text>
                  </View>
                )}

                {/* Servant Check-In Button */}
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={() => router.push(`/(app)/events/${item.id}/scan`)}
                >
                  <QrCode size={16} color="#fff" />
                  <Text style={styles.scanButtonText}>Scan Participant QR</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No upcoming events scheduled.</Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.pageBg,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    color: Colors.textLight,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  loader: {
    marginTop: 40,
  },
  eventCard: {
    backgroundColor: Colors.surfaceCard,
    borderColor: Colors.surfaceCardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  eventTitle: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  typeBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: Colors.accentCyan,
    fontSize: 10,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  rowText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentBlue,
    borderRadius: 10,
    paddingVertical: 10,
    gap: 8,
    marginTop: 12,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyText: {
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
});
