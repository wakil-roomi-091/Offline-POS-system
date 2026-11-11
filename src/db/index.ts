import Dexie, { type Table } from 'dexie';
import type { 
  Product, 
  Transaction, 
  ShiftRecord, 
  CashMovement, 
  ExpenseRecord, 
  StoreSettings,
  OrderBookingSheet
} from '../types';

export class DinePosDatabase extends Dexie {
  products!: Table<Product, string>;
  transactions!: Table<Transaction, string>;
  shifts!: Table<ShiftRecord, string>;
  cashMovements!: Table<CashMovement, string>;
  expenses!: Table<ExpenseRecord, string>;
  bookingSheets!: Table<OrderBookingSheet, string>;
  settings!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('DinePosDB');
    this.version(1).stores({
      products: 'id, name, category, price, isAvailable',
      transactions: 'id, orderNumber, timestamp, status, paymentMethod',
      shifts: 'id, openedAt, status',
      cashMovements: 'id, shiftId, timestamp',
      expenses: 'id, category, timestamp',
      settings: 'key'
    });
    this.version(2).stores({
      bookingSheets: 'id, physicalSlipNo, bookerId, status, dateTime'
    });
  }
}

export const db = new DinePosDatabase();

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    sku: '#PRD-0101',
    name: 'Chicken Biryani (Special)',
    category: 'Rice & Biryani',
    portionSize: 'Single / Double (2 Variations)',
    price: 450,
    costPrice: 220,
    stock: 48,
    icon: '🍛',
    dietaryTag: 'Non-Veg',
    isAvailable: true,
    isMultiSize: true,
    variations: [
      { name: 'Single / Half', price: 450, sku: 'SKU-CB-S' },
      { name: 'Double / Full', price: 850, sku: 'SKU-CB-F' }
    ],
    description: 'Aromatic basmati rice cooked with marinated chicken and special blend of desi spices. Served with raita.'
  },
  {
    id: 'p2',
    sku: '#PRD-0102',
    name: 'Chicken Karahi (Desi Ghee)',
    category: 'Main Curries & Karahi',
    portionSize: 'Half (0.5kg) / Full (1kg)',
    price: 1200,
    costPrice: 650,
    stock: 32,
    icon: '🍲',
    dietaryTag: 'Non-Veg',
    isAvailable: true,
    isMultiSize: true,
    variations: [
      { name: 'Half (0.5kg)', price: 1200, sku: 'SKU-CK-H' },
      { name: 'Full (1kg)', price: 2200, sku: 'SKU-CK-F' }
    ],
    description: 'Fresh chicken simmered in clay handi with desi ghee, ginger juliennes, green chillies, and crushed black pepper.'
  },
  {
    id: 'p3',
    sku: '#PRD-0103',
    name: 'Mutton Seekh Kebab (4 pcs)',
    category: 'BBQ & Grills',
    portionSize: 'Standard Plate (4 pcs)',
    price: 780,
    costPrice: 380,
    stock: 25,
    icon: '🍢',
    dietaryTag: 'Non-Veg',
    isAvailable: true,
    description: 'Minced mutton skewers seasoned with ground herbs, char-grilled over charcoal embers.'
  },
  {
    id: 'p4',
    sku: '#PRD-0104',
    name: 'Garlic Roghani Naan',
    category: 'Tandoor & Breads',
    portionSize: 'Standard Piece',
    price: 90,
    costPrice: 25,
    stock: 120,
    icon: '🫓',
    dietaryTag: 'Veg',
    isAvailable: true,
    description: 'Soft tandoori flatbread brushed with garlic butter and toasted sesame seeds.'
  },
  {
    id: 'p5',
    sku: '#PRD-0105',
    name: 'Karak Doodh Patti Chai',
    category: 'Beverages',
    portionSize: 'Regular / Large Cup',
    price: 120,
    costPrice: 35,
    stock: 80,
    icon: '☕',
    dietaryTag: 'Veg',
    isAvailable: true,
    isMultiSize: true,
    variations: [
      { name: 'Regular Cup', price: 120, sku: 'SKU-KC-R' },
      { name: 'Large Cup', price: 180, sku: 'SKU-KC-L' }
    ],
    description: 'Slow-brewed strong tea cooked in whole milk with crushed green cardamom.'
  },
  {
    id: 'p6',
    sku: '#PRD-0106',
    name: 'Raita & Mint Chutney',
    category: 'Extras & Condiments',
    portionSize: 'Complimentary Add-on',
    price: 0,
    costPrice: 10,
    stock: 200,
    icon: '🥗',
    dietaryTag: 'Veg',
    isAvailable: true,
    isComplimentary: true,
    description: 'Whipped fresh yogurt blended with wild mint, coriander, and roasted cumin.'
  },
  {
    id: 'p7',
    sku: '#PRD-0107',
    name: 'Fresh Lime Sprite',
    category: 'Beverages',
    portionSize: 'Standard Glass (300ml)',
    price: 220,
    costPrice: 80,
    stock: 0,
    icon: '🥤',
    dietaryTag: 'Veg',
    isAvailable: false,
    description: 'Chilled lemon-lime soda infused with squeezed key limes, mint, and black salt.'
  },
  {
    id: 'p8',
    sku: '#PRD-0108',
    name: 'Gulab Jamun (2 pcs)',
    category: 'Desserts & Sweets',
    portionSize: 'Standard Bowl (2 pcs)',
    price: 240,
    costPrice: 90,
    stock: 40,
    icon: '🧁',
    dietaryTag: 'Veg',
    isAvailable: true,
    description: 'Warm fried milk-solid dumplings soaked in rosewater and saffron sugar syrup.'
  }
];

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'DinePos',
  subTitle: 'Restaurant Suite',
  stationName: 'Station 1 (Admin)',
  cashierName: 'John Doe',
  taxRate: 0.08, // 8% matching Stitch screen calculation
  currencySymbol: '$',
  address: '124 Market Street, Suite 400',
  phone: '+1 (555) 234-5678',
  receiptHeader: 'Thank you for dining with DinePos!',
  receiptFooter: 'Please retain receipt for returns or exchanges within 7 days.',
  printerEnabled: true,
  offlineSyncStatus: 'synced'
};

import { INITIAL_TRANSACTIONS, INITIAL_EXPENSES, INITIAL_BOOKING_SHEETS } from './seedData';

export async function initializeDatabase() {
  const productCount = await db.products.count();
  const sampleProduct = await db.products.get('p1');
  if (productCount === 0 || (sampleProduct && sampleProduct.name === 'Cappuccino')) {
    await db.products.clear();
    await db.products.bulkAdd(INITIAL_PRODUCTS);
  }

  const transactionCount = await db.transactions.count();
  if (transactionCount === 0) {
    await db.transactions.bulkAdd(INITIAL_TRANSACTIONS);
  }

  const expenseCount = await db.expenses.count();
  if (expenseCount === 0) {
    await db.expenses.bulkAdd(INITIAL_EXPENSES);
  }

  const bookingSheetsCount = await db.bookingSheets.count();
  if (bookingSheetsCount === 0) {
    await db.bookingSheets.bulkAdd(INITIAL_BOOKING_SHEETS);
  }

  const settingsSaved = await db.settings.get('storeConfig');
  if (!settingsSaved) {
    await db.settings.put({ key: 'storeConfig', value: DEFAULT_SETTINGS });
  }
}

