import { db } from '../db';
import type { 
  Product, 
  Transaction, 
  ShiftRecord, 
  CashMovement, 
  ExpenseRecord, 
  OrderBookingSheet,
  OrderBooker
} from '../types';

export interface BackupMetadata {
  app: string;
  version: string;
  createdAt: string;
  timestamp: number;
  environment: 'electron' | 'browser';
  reason?: string;
  counts: {
    products: number;
    transactions: number;
    expenses: number;
    shifts: number;
    cashMovements: number;
    bookingSheets: number;
    bookers: number;
    settings: number;
  };
}

export interface BackupPayload {
  metadata: BackupMetadata;
  products: Product[];
  transactions: Transaction[];
  expenses: ExpenseRecord[];
  shifts: ShiftRecord[];
  cashMovements: CashMovement[];
  bookingSheets: OrderBookingSheet[];
  bookers?: OrderBooker[];
  settings: { key: string; value: any }[];
}

export interface SnapshotSummary {
  id: string;
  timestamp: number;
  dateStr: string;
  reason: string;
  totalRecords: number;
  payload: BackupPayload;
}

const LOCAL_SNAPSHOTS_KEY = 'dinepos_local_snapshots_v1';
const MAX_LOCAL_SNAPSHOTS = 10;

/**
 * Service to manage offline database exports, imports, validations, and auto-snapshots.
 */
export const backupService = {
  /**
   * Generates a complete backup payload of all tables in Dexie.
   */
  async generateBackupPayload(reason = 'Manual Backup'): Promise<BackupPayload> {
    const products = await db.products.toArray();
    const transactions = await db.transactions.toArray();
    const expenses = await db.expenses.toArray();
    const shifts = await db.shifts.toArray();
    const cashMovements = await db.cashMovements.toArray();
    const bookingSheets = await db.bookingSheets.toArray();
    const bookers = await db.bookers.toArray();
    const settings = await db.settings.toArray();

    const metadata: BackupMetadata = {
      app: 'DinePos',
      version: '2.4.1',
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
      environment: (window as any).electronAPI ? 'electron' : 'browser',
      reason,
      counts: {
        products: products.length,
        transactions: transactions.length,
        expenses: expenses.length,
        shifts: shifts.length,
        cashMovements: cashMovements.length,
        bookingSheets: bookingSheets.length,
        bookers: bookers.length,
        settings: settings.length
      }
    };

    return {
      metadata,
      products,
      transactions,
      expenses,
      shifts,
      cashMovements,
      bookingSheets,
      bookers,
      settings
    };
  },

  /**
   * Validates if a parsed object is a valid DinePos backup payload.
   */
  validateBackup(data: any): { valid: boolean; error?: string; counts?: BackupMetadata['counts'] } {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Invalid backup file: Not a valid JSON object.' };
    }

    // Support both new structure (metadata + tables) and legacy structure
    const hasProducts = Array.isArray(data.products);
    const hasTransactions = Array.isArray(data.transactions);

    if (!hasProducts && !hasTransactions) {
      return { 
        valid: false, 
        error: 'Invalid backup file: Missing critical database tables (products/transactions).' 
      };
    }

    const counts: BackupMetadata['counts'] = {
      products: data.products?.length || 0,
      transactions: data.transactions?.length || 0,
      expenses: data.expenses?.length || 0,
      shifts: data.shifts?.length || 0,
      cashMovements: data.cashMovements?.length || 0,
      bookingSheets: data.bookingSheets?.length || 0,
      bookers: data.bookers?.length || 0,
      settings: data.settings?.length || 0
    };

    return { valid: true, counts };
  },

  /**
   * Restores database from a verified payload inside an atomic Dexie transaction.
   * If any step fails, the transaction is rolled back and an emergency snapshot is preserved.
   */
  async restoreBackup(payload: BackupPayload | any): Promise<{ success: boolean; message: string }> {
    const validation = this.validateBackup(payload);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid backup structure.');
    }

    // 1. Take a safety snapshot of the current state before wiping/restoring
    await this.createAutoSnapshot('Pre-Restore Emergency Rollback');

    try {
      // 2. Perform atomic table replacement in a single Dexie read-write transaction
      await db.transaction(
        'rw',
        [
          db.products,
          db.transactions,
          db.expenses,
          db.shifts,
          db.cashMovements,
          db.bookingSheets,
          db.bookers,
          db.settings
        ],
        async () => {
          if (Array.isArray(payload.products)) {
            await db.products.clear();
            if (payload.products.length > 0) {
              await db.products.bulkAdd(payload.products);
            }
          }

          if (Array.isArray(payload.transactions)) {
            await db.transactions.clear();
            if (payload.transactions.length > 0) {
              await db.transactions.bulkAdd(payload.transactions);
            }
          }

          if (Array.isArray(payload.expenses)) {
            await db.expenses.clear();
            if (payload.expenses.length > 0) {
              await db.expenses.bulkAdd(payload.expenses);
            }
          }

          if (Array.isArray(payload.shifts)) {
            await db.shifts.clear();
            if (payload.shifts.length > 0) {
              await db.shifts.bulkAdd(payload.shifts);
            }
          }

          if (Array.isArray(payload.cashMovements)) {
            await db.cashMovements.clear();
            if (payload.cashMovements.length > 0) {
              await db.cashMovements.bulkAdd(payload.cashMovements);
            }
          }

          if (Array.isArray(payload.bookingSheets)) {
            await db.bookingSheets.clear();
            if (payload.bookingSheets.length > 0) {
              await db.bookingSheets.bulkAdd(payload.bookingSheets);
            }
          }

          if (Array.isArray(payload.bookers)) {
            await db.bookers.clear();
            if (payload.bookers.length > 0) {
              await db.bookers.bulkAdd(payload.bookers);
            }
          }

          if (Array.isArray(payload.settings)) {
            await db.settings.clear();
            if (payload.settings.length > 0) {
              await db.settings.bulkAdd(payload.settings);
            }
          }
        }
      );

      return {
        success: true,
        message: `Successfully restored ${validation.counts?.products ?? 0} products, ${validation.counts?.transactions ?? 0} transactions, and ${validation.counts?.bookingSheets ?? 0} booking slips.`
      };
    } catch (err: any) {
      console.error('[BackupService] Restore failed:', err);
      throw new Error(`Database restore failed: ${err.message || 'Unknown database error'}. Previous state was preserved in emergency snapshot.`);
    }
  },

  /**
   * Creates an auto-snapshot stored in local storage buffer AND electron local disk if available.
   */
  async createAutoSnapshot(reason = 'Automated Snapshot'): Promise<SnapshotSummary> {
    const payload = await this.generateBackupPayload(reason);
    const date = new Date();
    const dateStr = date.toLocaleString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const totalRecords = Object.values(payload.metadata.counts).reduce((a, b) => a + b, 0);

    const snapshot: SnapshotSummary = {
      id: `snap_${Date.now()}`,
      timestamp: Date.now(),
      dateStr,
      reason,
      totalRecords,
      payload
    };

    // 1. Store in local rotation list
    try {
      const existing = this.getLocalSnapshots();
      const updated = [snapshot, ...existing].slice(0, MAX_LOCAL_SNAPSHOTS);
      localStorage.setItem(LOCAL_SNAPSHOTS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[BackupService] Could not save snapshot to localStorage:', e);
    }

    // 2. If running under Electron, save snapshot to physical disk folder
    const electronAPI = (window as any).electronAPI;
    if (electronAPI && typeof electronAPI.saveAutoSnapshot === 'function') {
      try {
        await electronAPI.saveAutoSnapshot(JSON.stringify(payload, null, 2), snapshot.id);
      } catch (err) {
        console.warn('[BackupService] Electron native disk backup failed:', err);
      }
    }

    return snapshot;
  },

  /**
   * Retrieves rotation of local snapshots.
   */
  getLocalSnapshots(): SnapshotSummary[] {
    try {
      const raw = localStorage.getItem(LOCAL_SNAPSHOTS_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  /**
   * Clears old local snapshots.
   */
  clearLocalSnapshots(): void {
    localStorage.removeItem(LOCAL_SNAPSHOTS_KEY);
  },

  /**
   * Downloads or saves a JSON backup file to user machine.
   */
  async downloadBackupFile(
    payload: BackupPayload,
    filenamePrefix = 'DinePos_Backup'
  ): Promise<{ success: boolean; filePath?: string }> {
    const dateTag = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${filenamePrefix}_${dateTag}.json`;
    const jsonStr = JSON.stringify(payload, null, 2);

    const electronAPI = (window as any).electronAPI;
    if (electronAPI && typeof electronAPI.saveBackupFile === 'function') {
      try {
        const res = await electronAPI.saveBackupFile(filename, jsonStr);
        if (res?.success) {
          return { success: true, filePath: res.filePath };
        } else if (res?.canceled) {
          return { success: false };
        }
      } catch (err) {
        console.warn('Electron save dialog failed, using browser fallback:', err);
      }
    }

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true };
  },

  /**
   * Reads and parses a File object uploaded by user.
   */
  async readBackupFile(file: File): Promise<BackupPayload> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          resolve(parsed);
        } catch {
          reject(new Error('Selected file is not valid JSON.'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file from disk.'));
      reader.readAsText(file);
    });
  }
};
