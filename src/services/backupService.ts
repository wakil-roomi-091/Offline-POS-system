import { db } from '../db';
import type { 
  Product, 
  Transaction, 
  ShiftRecord, 
  CashMovement, 
  ExpenseRecord, 
  OrderBookingSheet,
  OrderBooker,
  Customer,
  CustomerLedgerEntry
} from '../types';

declare global {
  interface Window {
    electronAPI?: {
      saveAutoSnapshot?: (data: string, id: string) => Promise<{ success: boolean; filePath?: string }>;
      saveBackupFile?: (filename: string, content: string) => Promise<{ success: boolean; filePath?: string; canceled?: boolean }>;
      listLocalBackups?: () => Promise<{ directory?: string }>;
    };
  }
}

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
    customers?: number;
    customerLedgers?: number;
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
  customers?: Customer[];
  customerLedgers?: CustomerLedgerEntry[];
  settings: { key: string; value: unknown }[];
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
    const customers = await db.customers.toArray();
    const customerLedgers = await db.customerLedgers.toArray();
    const settings = await db.settings.toArray();

    const isElectron = Boolean(window.electronAPI);

    const metadata: BackupMetadata = {
      app: 'DinePos',
      version: '2.4.1',
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
      environment: isElectron ? 'electron' : 'browser',
      reason,
      counts: {
        products: products.length,
        transactions: transactions.length,
        expenses: expenses.length,
        shifts: shifts.length,
        cashMovements: cashMovements.length,
        bookingSheets: bookingSheets.length,
        bookers: bookers.length,
        customers: customers.length,
        customerLedgers: customerLedgers.length,
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
      customers,
      customerLedgers,
      settings
    };
  },

  /**
   * Validates if a parsed object is a valid DinePos backup payload.
   */
  validateBackup(data: unknown): { valid: boolean; error?: string; counts?: BackupMetadata['counts'] } {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Invalid backup file: Not a valid JSON object.' };
    }

    const payload = data as Partial<BackupPayload>;

    // Support both new structure (metadata + tables) and legacy structure
    const hasProducts = Array.isArray(payload.products);
    const hasTransactions = Array.isArray(payload.transactions);

    if (!hasProducts && !hasTransactions) {
      return { 
        valid: false, 
        error: 'Invalid backup file: Missing critical database tables (products/transactions).' 
      };
    }

    const counts: BackupMetadata['counts'] = {
      products: Array.isArray(payload.products) ? payload.products.length : 0,
      transactions: Array.isArray(payload.transactions) ? payload.transactions.length : 0,
      expenses: Array.isArray(payload.expenses) ? payload.expenses.length : 0,
      shifts: Array.isArray(payload.shifts) ? payload.shifts.length : 0,
      cashMovements: Array.isArray(payload.cashMovements) ? payload.cashMovements.length : 0,
      bookingSheets: Array.isArray(payload.bookingSheets) ? payload.bookingSheets.length : 0,
      bookers: Array.isArray(payload.bookers) ? payload.bookers.length : 0,
      customers: Array.isArray(payload.customers) ? payload.customers.length : 0,
      customerLedgers: Array.isArray(payload.customerLedgers) ? payload.customerLedgers.length : 0,
      settings: Array.isArray(payload.settings) ? payload.settings.length : 0
    };

    return { valid: true, counts };
  },

  /**
   * Restores database from a verified payload inside an atomic Dexie transaction.
   * If any step fails, the transaction is rolled back and an emergency snapshot is preserved.
   */
  async restoreBackup(payload: BackupPayload): Promise<{ success: boolean; message: string }> {
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
          db.customers,
          db.customerLedgers,
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

          if (Array.isArray(payload.customers)) {
            await db.customers.clear();
            if (payload.customers.length > 0) {
              await db.customers.bulkAdd(payload.customers);
            }
          }

          if (Array.isArray(payload.customerLedgers)) {
            await db.customerLedgers.clear();
            if (payload.customerLedgers.length > 0) {
              await db.customerLedgers.bulkAdd(payload.customerLedgers);
            }
          }

          if (Array.isArray(payload.settings)) {
            await db.settings.clear();
            if (payload.settings.length > 0) {
              await db.settings.bulkAdd(payload.settings as { key: string; value: any }[]);
            }
          }
        }
      );

      return {
        success: true,
        message: `Successfully restored ${validation.counts?.products ?? 0} products, ${validation.counts?.transactions ?? 0} transactions, and ${validation.counts?.bookingSheets ?? 0} booking slips.`
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown database error';
      console.error('[BackupService] Restore failed:', errMsg);
      throw new Error(`Database restore failed: ${errMsg}. Previous state was preserved in emergency snapshot.`);
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

    const counts = payload.metadata.counts;
    const totalRecords: number =
      (counts.products || 0) +
      (counts.transactions || 0) +
      (counts.expenses || 0) +
      (counts.shifts || 0) +
      (counts.cashMovements || 0) +
      (counts.bookingSheets || 0) +
      (counts.bookers || 0) +
      (counts.customers || 0) +
      (counts.customerLedgers || 0) +
      (counts.settings || 0);

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
    const electronAPI = window.electronAPI;
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

    const electronAPI = window.electronAPI;
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
