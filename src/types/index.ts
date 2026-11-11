export type CategoryType = 'all' | 'coffee' | 'food' | 'drinks' | 'desserts' | string;

export interface ProductVariation {
  id?: string;
  name: string;
  price: number;
  sku?: string;
}

export interface Product {
  id: string;
  name: string;
  category: CategoryType;
  price: number;
  costPrice?: number;
  stock: number;
  sku?: string;
  icon: string;
  isAvailable: boolean;
  dietaryTag?: 'Non-Veg' | 'Veg' | 'Egg-Only' | 'Vegan' | string;
  description?: string;
  variations?: ProductVariation[];
  isMultiSize?: boolean;
  isComplimentary?: boolean;
  showOnPos?: boolean;
  portionSize?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  qty: number;
  icon: string;
  notes?: string;
  variation?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'qr' | 'split' | 'easypaisa' | 'jazzcash';

export interface Transaction {
  id: string;
  orderNumber: number;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountReceived?: number;
  changeDue?: number;
  status: 'completed' | 'refunded' | 'voided';
  timestamp: number;
  cashierName: string;
  station: string;
  notes?: string;
  referenceId?: string;
}

export interface ShiftRecord {
  id: string;
  cashierName: string;
  station: string;
  openedAt: number;
  closedAt?: number;
  openingFloat: number;
  cashSales: number;
  payIns: number;
  payOuts: number;
  expectedCash: number;
  actualCash?: number;
  discrepancy?: number;
  status: 'open' | 'closed';
}

export interface CashMovement {
  id: string;
  shiftId: string;
  type: 'pay_in' | 'pay_out';
  amount: number;
  reason: string;
  timestamp: number;
  cashierName: string;
}

export interface ExpenseRecord {
  id: string;
  description: string;
  category: string;
  amount: number;
  paymentMethod: string;
  timestamp: number;
  loggedBy: string;
  vendor?: string;
  paymentSource?: string;
  receiptNumber?: string;
  subDescription?: string;
}

export interface StoreSettings {
  storeName: string;
  subTitle: string;
  stationName: string;
  cashierName: string;
  taxRate: number; // e.g. 0.08 (8%)
  currencySymbol: string;
  address: string;
  phone: string;
  receiptHeader: string;
  receiptFooter: string;
  printerEnabled: boolean;
  offlineSyncStatus: 'synced' | 'syncing' | 'offline';
}

export interface BookingRecord {
  id: string; // e.g. '#BKG-2024-1082'
  bookerId: string;
  dateStr: string; // e.g. 'Today, 24 Oct'
  outletsCount: number; // e.g. 18
  bookedUnits: number; // e.g. 320
  returnUnits: number; // e.g. 12
  deliveredUnits: number; // e.g. 308
  actualSales: number; // e.g. 84200
  status: 'Reconciled' | 'Pending' | 'Dispatched';
}

export interface OrderBooker {
  id: string; // e.g. '#BKR-0101'
  name: string;
  avatarInitials: string;
  avatarColor: string;
  joinedDate: string;
  phone: string;
  hasWhatsApp?: boolean;
  area: string;
  areaKey: string;
  todayBookings: number;
  todayUnits: number;
  todaySales: number;
  status: 'Active' | 'Inactive';
  statusNote?: string;
  address?: string;
  notes?: string;
  totalBookingsSheets?: number;
  totalBookedUnits?: number;
  totalDeliveredUnits?: number;
  totalReturnedUnits?: number;
  totalActualSales?: number;
  rawGrossBookedValue?: number;
}

export interface BookingSheetItem {
  id: string;
  name: string;
  variation: string;
  unitPrice: number;
  qty: number;
  total: number;
}

export interface OrderBookingSheet {
  id: string; // e.g. '#BKG-2024-0482'
  physicalSlipNo: string; // e.g. '#TK-8841'
  dateTime: string; // e.g. 'Today, 05:20 PM'
  bookerName: string; // e.g. 'Tariq Mehmood'
  bookerId: string; // e.g. '#BKR-0101'
  bookerZone: string; // e.g. 'Gulberg Zone'
  shopName: string; // e.g. 'Al-Madina Super Store'
  shopAddress: string; // e.g. 'Shop #12, G-Block, Gulberg III'
  areaZone: string; // e.g. 'Gulberg III (Main Mkt)'
  itemsCount: number;
  skusCount: number;
  totalQty: number;
  bookingValue: number;
  status: 'Recorded' | 'Partially Delivered' | 'Completed' | 'Draft' | 'Cancelled';
  targetDispatchTime?: string;
  managerNotes?: string;
  items?: BookingSheetItem[];
}

export type ActiveTab = 
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'transactions'
  | 'expenses'
  | 'cash_closing'
  | 'order_bookers'
  | 'order_booking'
  | 'reports'
  | 'settings';
