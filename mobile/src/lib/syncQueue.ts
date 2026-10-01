import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export interface PendingMutation {
  id: string;
  type: 'CHECK_IN' | 'LOG_GIG' | 'SUBMIT_REPORT';
  payload: Record<string, any>;
  timestamp: number;
  retries: number;
}

const QUEUE_STORAGE_KEY = 'mfc_offline_mutation_queue_v1';

type SyncListener = (pendingCount: number, isSyncing: boolean) => void;
const listeners: Set<SyncListener> = new Set();
let isSyncing = false;

export const SyncQueue = {
  subscribe(listener: SyncListener) {
    listeners.add(listener);
    this.getQueue().then((q) => listener(q.length, isSyncing));
    return () => {
      listeners.delete(listener);
    };
  },

  privateNotify(queueLength: number) {
    listeners.forEach((fn) => fn(queueLength, isSyncing));
  },

  async getQueue(): Promise<PendingMutation[]> {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async enqueue(type: PendingMutation['type'], payload: Record<string, any>): Promise<PendingMutation> {
    const queue = await this.getQueue();
    const newItem: PendingMutation = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
      retries: 0,
    };
    queue.push(newItem);
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    this.privateNotify(queue.length);

    // Attempt background flush if online
    this.flush();
    return newItem;
  },

  async flush(): Promise<{ successCount: number; errorCount: number }> {
    if (isSyncing) return { successCount: 0, errorCount: 0 };
    isSyncing = true;
    let queue = await this.getQueue();
    this.privateNotify(queue.length);

    if (queue.length === 0) {
      isSyncing = false;
      this.privateNotify(0);
      return { successCount: 0, errorCount: 0 };
    }

    let successCount = 0;
    let errorCount = 0;
    const remaining: PendingMutation[] = [];

    for (const item of queue) {
      try {
        let success = false;
        if (item.type === 'CHECK_IN') {
          const { error } = await supabase.from('event_participants').upsert({
            event_id: item.payload.eventId,
            member_id: item.payload.memberId,
            attended: true,
            attended_at: new Date(item.timestamp).toISOString(),
            payment_status: item.payload.paymentStatus || 'paid',
          });
          if (!error) success = true;
        } else if (item.type === 'LOG_GIG') {
          const { error } = await supabase.from('gig_contributions').insert({
            member_id: item.payload.memberId,
            amount: item.payload.amount,
            notes: item.payload.notes,
            created_at: new Date(item.timestamp).toISOString(),
          });
          if (!error) success = true;
        } else if (item.type === 'SUBMIT_REPORT') {
          const { error } = await supabase.from('activity_reports').insert({
            chapter_id: item.payload.chapterId,
            title: item.payload.title,
            summary: item.payload.summary,
            photo_url: item.payload.photoUrl || null,
            created_at: new Date(item.timestamp).toISOString(),
          });
          if (!error) success = true;
        }

        if (success) {
          successCount++;
        } else {
          item.retries += 1;
          remaining.push(item);
          errorCount++;
        }
      } catch (err) {
        item.retries += 1;
        remaining.push(item);
        errorCount++;
      }
    }

    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(remaining));
    isSyncing = false;
    this.privateNotify(remaining.length);
    return { successCount, errorCount };
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
    this.privateNotify(0);
  },
};
