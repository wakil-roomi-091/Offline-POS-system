import { create } from 'zustand';
import type { ShiftRecord } from '../types';
import { db } from '../db';

interface ShiftState {
  currentShift: ShiftRecord | null;
  cashierName: string;
  station: string;
  currentCashDrawer: number;
  getExpectedCash: () => number;
  initShift: () => Promise<void>;
  openShift: (openingFloat: number) => Promise<ShiftRecord>;
  recordCashSale: (amount: number) => Promise<void>;
  recordNonCashSale: (method: string, amount: number) => Promise<void>;
  recordMovement: (type: 'pay_in' | 'pay_out', amount: number) => Promise<void>;
  closeShift: (
    actualCounted: number,
    notes?: string,
    witnessPin?: string,
    denominations?: Record<string, number>
  ) => Promise<ShiftRecord | null>;
}

const DEFAULT_SHIFT_ID = 'shift-101';

export const useShiftStore = create<ShiftState>((set, get) => ({
  cashierName: 'John Doe',
  station: 'Station 1 (Admin)',
  currentCashDrawer: 15000,
  currentShift: {
    id: DEFAULT_SHIFT_ID,
    cashierName: 'John Doe',
    station: 'Station 1 (Admin)',
    openedAt: Date.now() - 4 * 60 * 60 * 1000,
    openingFloat: 15000,
    cashSales: 0,
    cardSales: 0,
    easypaisaSales: 0,
    jazzcashSales: 0,
    payIns: 0,
    payOuts: 0,
    expectedCash: 15000,
    status: 'open',
  },

  getExpectedCash: () => {
    return get().currentShift?.expectedCash ?? get().currentCashDrawer;
  },

  initShift: async () => {
    try {
      const openShift = await db.shifts.where('status').equals('open').first();
      if (openShift) {
        set({
          currentShift: openShift,
          currentCashDrawer: openShift.expectedCash,
          cashierName: openShift.cashierName,
          station: openShift.station,
        });
      } else {
        // Check if default shift exists in DB, if not persist the active default shift
        const existing = await db.shifts.get(DEFAULT_SHIFT_ID);
        if (!existing) {
          const fallback = get().currentShift;
          if (fallback) {
            await db.shifts.put(fallback);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load active shift from Dexie:', err);
    }
  },

  openShift: async (openingFloat: number) => {
    const shift: ShiftRecord = {
      id: `shift-${Date.now()}`,
      cashierName: get().cashierName,
      station: get().station,
      openedAt: Date.now(),
      openingFloat,
      cashSales: 0,
      cardSales: 0,
      easypaisaSales: 0,
      jazzcashSales: 0,
      otherSales: 0,
      totalSales: 0,
      payIns: 0,
      payOuts: 0,
      drawerExpenses: 0,
      expectedCash: openingFloat,
      status: 'open',
    };

    await db.shifts.put(shift);
    set({ currentShift: shift, currentCashDrawer: openingFloat });
    return shift;
  },

  recordCashSale: async (amount: number) => {
    const shift = get().currentShift;
    if (!shift) return;
    const updated: ShiftRecord = {
      ...shift,
      cashSales: shift.cashSales + amount,
      totalSales: (shift.totalSales || 0) + amount,
      expectedCash: shift.expectedCash + amount,
    };
    await db.shifts.put(updated);
    set({
      currentShift: updated,
      currentCashDrawer: get().currentCashDrawer + amount,
    });
  },

  recordNonCashSale: async (method: string, amount: number) => {
    const shift = get().currentShift;
    if (!shift) return;
    const updated: ShiftRecord = {
      ...shift,
      cardSales: method === 'card' ? (shift.cardSales || 0) + amount : shift.cardSales,
      easypaisaSales: method === 'easypaisa' ? (shift.easypaisaSales || 0) + amount : shift.easypaisaSales,
      jazzcashSales: method === 'jazzcash' ? (shift.jazzcashSales || 0) + amount : shift.jazzcashSales,
      otherSales: !['card', 'easypaisa', 'jazzcash', 'cash'].includes(method) ? (shift.otherSales || 0) + amount : shift.otherSales,
      totalSales: (shift.totalSales || 0) + amount,
    };
    await db.shifts.put(updated);
    set({ currentShift: updated });
  },

  recordMovement: async (type: 'pay_in' | 'pay_out', amount: number) => {
    const shift = get().currentShift;
    if (!shift) return;
    const isPayIn = type === 'pay_in';
    const updated: ShiftRecord = {
      ...shift,
      payIns: isPayIn ? shift.payIns + amount : shift.payIns,
      payOuts: !isPayIn ? shift.payOuts + amount : shift.payOuts,
      expectedCash: isPayIn ? shift.expectedCash + amount : shift.expectedCash - amount,
    };
    await db.shifts.put(updated);
    set({
      currentShift: updated,
      currentCashDrawer: isPayIn 
        ? get().currentCashDrawer + amount 
        : get().currentCashDrawer - amount,
    });
  },

  closeShift: async (
    actualCounted: number,
    notes?: string,
    witnessPin?: string,
    denominations?: Record<string, number>
  ) => {
    const shift = get().currentShift;
    if (!shift) return null;

    const zReportNumber = `Z-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const closed: ShiftRecord = {
      ...shift,
      closedAt: Date.now(),
      actualCash: actualCounted,
      discrepancy: actualCounted - shift.expectedCash,
      status: 'closed',
      closingNotes: notes,
      witnessPin,
      denominationsCount: denominations,
      zReportNumber,
    };

    await db.shifts.put(closed);
    set({ currentShift: null, currentCashDrawer: 0 });
    return closed;
  },
}));
