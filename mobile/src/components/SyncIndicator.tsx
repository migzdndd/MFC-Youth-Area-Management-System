import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors';
import { SyncQueue } from '../lib/syncQueue';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react-native';

export const SyncIndicator: React.FC = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = SyncQueue.subscribe((count, syncing) => {
      setPendingCount(count);
      setIsSyncing(syncing);
    });
    return unsubscribe;
  }, []);

  if (pendingCount === 0 && !isSyncing) {
    return null; // Hide when fully synced and online
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => SyncQueue.flush()}
      activeOpacity={0.8}
    >
      {isSyncing ? (
        <RefreshCw size={14} color={Colors.textLight} />
      ) : (
        <WifiOff size={14} color="#f59e0b" />
      )}
      <Text style={styles.text}>
        {isSyncing
          ? 'Syncing changes...'
          : `${pendingCount} offline change${pendingCount > 1 ? 's' : ''} queued (tap to sync)`}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0c273d',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e40af',
    alignSelf: 'center',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    color: Colors.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
});
