import { create } from 'zustand';
import type { CartItem, Product } from '../types';

interface CartState {
  cart: CartItem[];
  orderNote: string;
  taxRate: number;
  addToCart: (product: Product, variation?: string) => void;
  updateQty: (itemId: string, delta: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  setOrderNote: (note: string) => void;
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  // Initial cart items preloaded matching Stitch design demo
  cart: [
    { id: 'cart-1', productId: 'p1', name: 'Cappuccino', price: 3.50, qty: 1, icon: '☕' },
    { id: 'cart-2', productId: 'p5', name: 'Bagel', price: 2.80, qty: 2, icon: '🥯' },
    { id: 'cart-3', productId: 'p7', name: 'Caesar Salad', price: 6.50, qty: 1, icon: '🥗' },
    { id: 'cart-4', productId: 'p9', name: 'Orange Juice', price: 2.90, qty: 1, icon: '🍊' },
  ],
  orderNote: '',
  taxRate: 0.08, // 8% tax

  addToCart: (product: Product, variation?: string) => {
    set((state) => {
      const existing = state.cart.find(
        (item) => item.productId === product.id && item.variation === variation
      );
      if (existing) {
        return {
          cart: state.cart.map((item) =>
            item.id === existing.id ? { ...item, qty: item.qty + 1 } : item
          ),
        };
      }
      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        qty: 1,
        icon: product.icon,
        variation,
      };
      return { cart: [...state.cart, newItem] };
    });
  },

  updateQty: (itemId: string, delta: number) => {
    set((state) => {
      const updated = state.cart
        .map((item) => (item.id === itemId ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0);
      return { cart: updated };
    });
  },

  removeFromCart: (itemId: string) => {
    set((state) => ({ cart: state.cart.filter((item) => item.id !== itemId) }));
  },

  clearCart: () => {
    set({ cart: [], orderNote: '' });
  },

  setOrderNote: (note: string) => {
    set({ orderNote: note });
  },

  getSubtotal: () => {
    return get().cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  },

  getTax: () => {
    const subtotal = get().getSubtotal();
    return subtotal * get().taxRate;
  },

  getTotal: () => {
    return get().getSubtotal() + get().getTax();
  },
}));
