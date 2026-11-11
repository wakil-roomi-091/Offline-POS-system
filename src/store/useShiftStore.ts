import { create } from 'zustand';
import type { ShiftRecord } from '../types';

interface ShiftState {
  currentShift: ShiftRecord | null;
  cashierName: string;
  station: string;
  currentCashDrawer: number;
  getExpectedCash: () => number;
  openShift: (openingFloat: number) => void;
  recordCashSale: (amount: number) => void;
  recordMovement: (type: 'pay_in' | 'pay_out', amount: number) => void;
  closeShift: (actualCounted: number) => ShiftRecord | null;
}

export const useShiftStore = create<ShiftState>((set, get) => ({
  cashierName: 'John Doe',
  station: 'Station 1 (Admin)',
  currentCashDrawer: 350.00,
  currentShift: {
    id: 'shift-101',
    cashierName: 'John Doe',
    station: 'Station 1 (Admin)',
    openedAt: Date.now() - 4 * 60 * 60 * 1000, // 4 hours ago
    openingFloat: 200.00,
    cashSales: 150.00,
    payIns: 0,
    payOuts: 0,
    expectedCash: 350.00,
    status: 'open',
  },

  getExpectedCash: () => {
    return get().currentShift?.expectedCash ?? get().currentCashDrawer;
  },

  openShift: (openingFloat: number) => {
    const shift: ShiftRecord = {
      id: `shift-${Date.now()}`,
      cashierName: get().cashierName,
      station: get().station,
      openedAt: Date.now(),
      openingFloat,
      cashSales: 0,
      payIns: 0,
      payOuts: 0,
      expectedCash: openingFloat,
      status: 'open',
    };
    set({ currentShift: shift, currentCashDrawer: openingFloat });
  },

  recordCashSale: (amount: number) => {
    const shift = get().currentShift;
    if (!shift) return;
    const updated: ShiftRecord = {
      ...shift,
      cashSales: shift.cashSales + amount,
      expectedCash: shift.expectedCash + amount,
    };
    set({
      currentShift: updated,
      currentCashDrawer: get().currentCashDrawer + amount,
    });
  },

  recordMovement: (type: 'pay_in' | 'pay_out', amount: number) => {
    const shift = get().currentShift;
    if (!shift) return;
    const isPayIn = type === 'pay_in';
    const updated: ShiftRecord = {
      ...shift,
      payIns: isPayIn ? shift.payIns + amount : shift.payIns,
      payOuts: !isPayIn ? shift.payOuts + amount : shift.payOuts,
      expectedCash: isPayIn ? shift.expectedCash + amount : shift.expectedCash - amount,
    };
    set({
      currentShift: updated,
      currentCashDrawer: isPayIn 
        ? get().currentCashDrawer + amount 
        : get().currentCashDrawer - amount,
    });
  },

  closeShift: (actualCounted: number) => {
    const shift = get().currentShift;
    if (!shift) return null;
    const closed: ShiftRecord = {
      ...shift,
      closedAt: Date.now(),
      actualCash: actualCounted,
      discrepancy: actualCounted - shift.expectedCash,
      status: 'closed',
    };
    set({ currentShift: null });
    return closed;
  },
}));
