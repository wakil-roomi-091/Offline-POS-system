import { create } from 'zustand';
import type { ActiveTab, Product, Transaction } from '../types';

interface UIState {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Search filter bar
  globalSearch: string;
  setGlobalSearch: (q: string) => void;

  // Modals
  paymentModalOpen: boolean;
  setPaymentModalOpen: (open: boolean) => void;

  saleSuccessModalOpen: boolean;
  setSaleSuccessModalOpen: (open: boolean) => void;

  variationModalOpen: boolean;
  setVariationModalOpen: (open: boolean) => void;
  selectedProductForVariation: Product | null;
  setSelectedProductForVariation: (prod: Product | null) => void;

  productFormModalOpen: boolean;
  setProductFormModalOpen: (open: boolean) => void;
  editingProduct: Product | null;
  setEditingProduct: (prod: Product | null) => void;

  openingCashModalOpen: boolean;
  setOpeningCashModalOpen: (open: boolean) => void;

  cashMovementModalOpen: boolean;
  setCashMovementModalOpen: (open: boolean) => void;
  cashMovementType: 'pay_in' | 'pay_out';
  setCashMovementType: (type: 'pay_in' | 'pay_out') => void;

  receiptPreviewModalOpen: boolean;
  setReceiptPreviewModalOpen: (open: boolean) => void;

  transactionDetailsModalOpen: boolean;
  setTransactionDetailsModalOpen: (open: boolean) => void;
  selectedTransaction: Transaction | null;
  setSelectedTransaction: (tx: Transaction | null) => void;

  lastCompletedTransaction: Transaction | null;
  setLastCompletedTransaction: (tx: Transaction | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'pos',
  setActiveTab: (tab) => set({ activeTab: tab }),

  globalSearch: '',
  setGlobalSearch: (q) => set({ globalSearch: q }),

  paymentModalOpen: false,
  setPaymentModalOpen: (open) => set({ paymentModalOpen: open }),

  saleSuccessModalOpen: false,
  setSaleSuccessModalOpen: (open) => set({ saleSuccessModalOpen: open }),

  variationModalOpen: false,
  setVariationModalOpen: (open) => set({ variationModalOpen: open }),
  selectedProductForVariation: null,
  setSelectedProductForVariation: (prod) => set({ selectedProductForVariation: prod }),

  productFormModalOpen: false,
  setProductFormModalOpen: (open) => set({ productFormModalOpen: open }),
  editingProduct: null,
  setEditingProduct: (prod) => set({ editingProduct: prod }),

  openingCashModalOpen: false,
  setOpeningCashModalOpen: (open) => set({ openingCashModalOpen: open }),

  cashMovementModalOpen: false,
  setCashMovementModalOpen: (open) => set({ cashMovementModalOpen: open }),
  cashMovementType: 'pay_in',
  setCashMovementType: (type) => set({ cashMovementType: type }),

  receiptPreviewModalOpen: false,
  setReceiptPreviewModalOpen: (open) => set({ receiptPreviewModalOpen: open }),

  transactionDetailsModalOpen: false,
  setTransactionDetailsModalOpen: (open) => set({ transactionDetailsModalOpen: open }),
  selectedTransaction: null,
  setSelectedTransaction: (tx) => set({ selectedTransaction: tx }),

  lastCompletedTransaction: null,
  setLastCompletedTransaction: (tx) => set({ lastCompletedTransaction: tx }),
}));
