import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { Search, Phone, MessageSquare, Filter } from 'lucide-react-native';

const CATEGORIES = ['ALL', 'YOUTH', 'KIDS', 'LIT', 'CAMPUS'];

export default function DirectoryScreen() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  const { data: members, isLoading, refetch } = useQuery({
    queryKey: ['directory-members', activeCategory],
    queryFn: async () => {
      let query = supabase.from('members').select('*').order('first_name', { ascending: true });
      if (activeCategory !== 'ALL') {
        query = query.eq('ministry_section', activeCategory.toLowerCase());
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const filteredMembers = (members || []).filter((m) => {
    const fullName = `${m.first_name || ''} ${m.last_name || ''}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  const handleCall = (phoneNumber?: string) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleSMS = (phoneNumber?: string) => {
    if (phoneNumber) {
      Linking.openURL(`sms:${phoneNumber}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Pastoral Directory</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search member name..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Category Filters */}
        <View style={styles.filterContainer}>
          <FlatList
            horizontal
            data={CATEGORIES}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  activeCategory === item && styles.activeFilterChip,
                ]}
                onPress={() => setActiveCategory(item)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    activeCategory === item && styles.activeFilterChipText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Member List */}
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.accentCyan} style={styles.loader} />
        ) : (
          <FlatList
            data={filteredMembers}
            keyExtractor={(item) => item.id}
            onRefresh={refetch}
            refreshing={isLoading}
            renderItem={({ item }) => (
              <View style={styles.memberCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.first_name?.[0] || 'M'}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {item.first_name} {item.last_name}
                  </Text>
                  <Text style={styles.memberDetails}>
                    {item.ministry_section ? item.ministry_section.toUpperCase() : 'MEMBER'} • {item.chapter || 'Chapter Unassigned'}
                  </Text>
                </View>
                <View style={styles.actions}>
                  {item.contact_number && (
                    <>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleCall(item.contact_number)}
                      >
                        <Phone size={16} color={Colors.accentCyan} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleSMS(item.contact_number)}
                      >
                        <MessageSquare size={16} color={Colors.accentCyan} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No members found.</Text>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderColor: Colors.borderDark,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: Colors.textLight,
    fontSize: 14,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.borderDark,
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: Colors.accentBlue,
    borderColor: Colors.accentBlue,
  },
  filterChipText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  activeFilterChipText: {
    color: '#ffffff',
  },
  loader: {
    marginTop: 40,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderColor: Colors.surfaceCardBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.accentBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: Colors.textLight,
    fontSize: 15,
    fontWeight: '700',
  },
  memberDetails: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
});
