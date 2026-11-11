import { create } from 'zustand';
import type { CartItem, Product } from '../types';

interface CartState {
  cart: CartItem[];
  orderNote: string;
  taxRate: number;
  addToCart: (product: Product, variation?: string, maxStock?: number) => boolean;
  updateQty: (itemId: string, delta: number, maxStock?: number) => boolean;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  setOrderNote: (note: string) => void;
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  // Clean cart initialized on launch
  cart: [],
  orderNote: '',
  taxRate: 0.08, // 8% tax

  addToCart: (product: Product, variation?: string, maxStock?: number) => {
    const stockLimit = maxStock !== undefined ? maxStock : (product.stock ?? 9999);
    if (stockLimit <= 0) {
      alert(`"${product.name}" is currently out of stock.`);
      return false;
    }

    let success = true;
    set((state) => {
      const existing = state.cart.find(
        (item) => item.productId === product.id && item.variation === variation
      );
      if (existing) {
        if (existing.qty >= stockLimit) {
          alert(`Cannot add more. Available stock limit is ${stockLimit} units for "${product.name}".`);
          success = false;
          return state;
        }
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
    return success;
  },

  updateQty: (itemId: string, delta: number, maxStock?: number) => {
    let success = true;
    set((state) => {
      const itemToUpdate = state.cart.find((i) => i.id === itemId);
      if (itemToUpdate && delta > 0 && maxStock !== undefined) {
        if (itemToUpdate.qty >= maxStock) {
          alert(`Cannot exceed available inventory of ${maxStock} units.`);
          success = false;
          return state;
        }
      }
      const updated = state.cart
        .map((item) => (item.id === itemId ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0);
      return { cart: updated };
    });
    return success;
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
