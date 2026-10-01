import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { useAuth } from '../../../providers/AuthProvider';
import { User, LogOut, ShieldCheck, Fingerprint, BookOpen } from 'lucide-react-native';

export default function ProfileScreen() {
  const { profile, signOut, biometricSupported } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Servant Profile</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <User size={32} color="#fff" />
          </View>
          <Text style={styles.fullName}>{profile?.full_name || 'MFC Servant'}</Text>
          <Text style={styles.email}>{profile?.email}</Text>

          <View style={styles.roleBadge}>
            <ShieldCheck size={14} color={Colors.accentCyan} />
            <Text style={styles.roleText}>
              {profile?.role ? profile.role.replace('_', ' ').toUpperCase() : 'MEMBER'}
            </Text>
          </View>
        </View>

        {/* Settings & Preferences */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Security & Features</Text>

          <View style={styles.row}>
            <Fingerprint size={20} color={Colors.accentCyan} />
            <Text style={styles.rowText}>
              Biometric Quick Unlock ({biometricSupported ? 'Supported' : 'Unavailable'})
            </Text>
          </View>

          <View style={styles.row}>
            <BookOpen size={20} color={Colors.accentCyan} />
            <Text style={styles.rowText}>Offline Daily Scripture Readings Enabled</Text>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <LogOut size={18} color="#fff" />
          <Text style={styles.signOutBtnText}>Sign Out of Account</Text>
        </TouchableOpacity>
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
  title: {
    color: Colors.textLight,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderColor: Colors.surfaceCardBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accentBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  fullName: {
    color: Colors.textLight,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  email: {
    color: Colors.textMuted,
    fontSize: 13,
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  roleText: {
    color: Colors.accentCyan,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: Colors.surfaceCard,
    borderColor: Colors.surfaceCardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  sectionHeader: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
  },
  rowText: {
    color: Colors.textLight,
    fontSize: 13,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.danger,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 10,
  },
  signOutBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
