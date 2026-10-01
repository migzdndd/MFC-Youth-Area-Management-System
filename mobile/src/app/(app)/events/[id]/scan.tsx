import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../../constants/Colors';
import { SyncQueue } from '../../../../lib/syncQueue';
import { ArrowLeft, CheckCircle, RefreshCw } from 'lucide-react-native';

export default function EventQRScanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [lastScannedMember, setLastScannedMember] = useState<string | null>(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionCard}>
          <Text style={styles.title}>Camera Permission Required</Text>
          <Text style={styles.subtitle}>
            Camera access is required to scan event participant QR codes.
          </Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      // Data expected format: JSON string or member_id UUID
      let memberId = data;
      try {
        const parsed = JSON.parse(data);
        memberId = parsed.member_id || parsed.id || data;
      } catch {
        // Raw UUID string
      }

      setLastScannedMember(memberId);

      // Queue attendance check-in offline-first
      await SyncQueue.enqueue('CHECK_IN', {
        eventId: id,
        memberId: memberId,
        paymentStatus: 'paid',
      });

      Alert.alert(
        'Check-In Recorded',
        `Member check-in saved! (${memberId.substring(0, 8)}...)`,
        [{ text: 'Scan Next', onPress: () => setScanned(false) }]
      );
    } catch (err: any) {
      Alert.alert('Scan Error', err.message || 'Invalid QR code format');
      setScanned(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={Colors.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Participant Check-In</Text>
      </View>

      {/* Camera View */}
      <View style={styles.cameraFrame}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
        <View style={styles.overlayFrame} />
      </View>

      {/* Status Footer */}
      <View style={styles.footer}>
        {lastScannedMember && (
          <View style={styles.scannedBadge}>
            <CheckCircle size={16} color={Colors.success} />
            <Text style={styles.scannedText}>
              Last Check-In: {lastScannedMember.substring(0, 12)}...
            </Text>
          </View>
        )}

        {scanned && (
          <TouchableOpacity
            style={styles.rescanBtn}
            onPress={() => setScanned(false)}
          >
            <RefreshCw size={16} color="#fff" />
            <Text style={styles.rescanBtnText}>Tap to Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.pageBg,
  },
  permissionCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: '800',
  },
  cameraFrame: {
    flex: 1,
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  overlayFrame: {
    position: 'absolute',
    top: '25%',
    left: '15%',
    width: '70%',
    height: '45%',
    borderWidth: 2,
    borderColor: Colors.accentCyan,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: Colors.accentBlue,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  scannedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 10,
  },
  scannedText: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
  rescanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accentBlue,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  rescanBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
