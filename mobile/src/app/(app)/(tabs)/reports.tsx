import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { SyncQueue } from '../../../lib/syncQueue';
import { useAuth } from '../../../providers/AuthProvider';
import * as ImagePicker from 'expo-image-picker';
import { Award, Camera, Heart, Send } from 'lucide-react-native';

export default function ReportsAndGIGScreen() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'GIG' | 'REPORT'>('GIG');

  // GIG Form state
  const [gigAmount, setGigAmount] = useState('');
  const [gigNotes, setGigNotes] = useState('');

  // Report Form state
  const [reportTitle, setReportTitle] = useState('');
  const [reportSummary, setReportSummary] = useState('');
  const [reportPhoto, setReportPhoto] = useState<string | null>(null);

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].uri) {
      setReportPhoto(result.assets[0].uri);
    }
  };

  const handleSubmitGIG = async () => {
    if (!gigAmount) {
      Alert.alert('Missing Field', 'Please enter contribution amount.');
      return;
    }

    await SyncQueue.enqueue('LOG_GIG', {
      memberId: profile?.id,
      amount: parseFloat(gigAmount),
      notes: gigNotes,
    });

    Alert.alert('GIG Recorded', 'God Is Generous contribution queued for sync.');
    setGigAmount('');
    setGigNotes('');
  };

  const handleSubmitReport = async () => {
    if (!reportTitle || !reportSummary) {
      Alert.alert('Missing Fields', 'Please enter report title and summary.');
      return;
    }

    await SyncQueue.enqueue('SUBMIT_REPORT', {
      chapterId: profile?.chapter_id || 'unassigned',
      title: reportTitle,
      summary: reportSummary,
      photoUrl: reportPhoto,
    });

    Alert.alert('Report Submitted', 'Chapter activity report queued for sync.');
    setReportTitle('');
    setReportSummary('');
    setReportPhoto(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Stewardship & Activity Reports</Text>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'GIG' && styles.activeTab]}
            onPress={() => setActiveTab('GIG')}
          >
            <Heart size={16} color={activeTab === 'GIG' ? '#fff' : Colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'GIG' && styles.activeTabText]}>
              God Is Generous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'REPORT' && styles.activeTab]}
            onPress={() => setActiveTab('REPORT')}
          >
            <Award size={16} color={activeTab === 'REPORT' ? '#fff' : Colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'REPORT' && styles.activeTabText]}>
              Activity Report
            </Text>
          </TouchableOpacity>
        </View>

        {/* GIG Form */}
        {activeTab === 'GIG' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Log GIG Contribution</Text>
            <Text style={styles.cardSubtitle}>
              Record stewardship and financial gifts given for youth ministry activities.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount (PHP ₱)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={gigAmount}
                onChangeText={setGigAmount}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes / Purpose</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="e.g. Household offering, youth camp sponsorship"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                value={gigNotes}
                onChangeText={setGigNotes}
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitGIG}>
              <Send size={16} color="#fff" />
              <Text style={styles.submitBtnText}>Submit GIG Log</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Chapter Activity Report Form */
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Submit Activity Report</Text>
            <Text style={styles.cardSubtitle}>
              Report completed household assemblies, youth camps, or community service.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Report Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Chapter Household Meeting"
                placeholderTextColor={Colors.textMuted}
                value={reportTitle}
                onChangeText={setReportTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Summary / Highlights</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="Summary of pastoral topics discussed and attendee count..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={4}
                value={reportSummary}
                onChangeText={setReportSummary}
              />
            </View>

            {/* Photo Attachment */}
            <TouchableOpacity style={styles.photoPicker} onPress={handlePickPhoto}>
              <Camera size={18} color={Colors.accentCyan} />
              <Text style={styles.photoPickerText}>
                {reportPhoto ? 'Photo Attached (Tap to change)' : 'Attach Photo / Receipt'}
              </Text>
            </TouchableOpacity>

            {reportPhoto && (
              <Image source={{ uri: reportPhoto }} style={styles.photoPreview} />
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitReport}>
              <Send size={16} color="#fff" />
              <Text style={styles.submitBtnText}>Submit Activity Report</Text>
            </TouchableOpacity>
          </View>
        )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  activeTab: {
    backgroundColor: Colors.accentBlue,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  activeTabText: {
    color: '#ffffff',
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderColor: Colors.surfaceCardBorder,
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
  },
  cardTitle: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textLight,
    fontSize: 14,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  photoPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: Colors.accentCyan,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  photoPickerText: {
    color: Colors.accentCyan,
    fontSize: 13,
    fontWeight: '700',
  },
  photoPreview: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 14,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentBlue,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
    marginTop: 6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
