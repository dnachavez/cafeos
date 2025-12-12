import { create } from 'zustand';
import { OrderItem } from '../types/order';
import { Product } from '../types/product';
import { setPath, subscribeToPath } from '../utils/db-helpers';
import { Unsubscribe } from 'firebase/database';

interface CartState {
  items: OrderItem[];
  terminalId: string;
  isSyncing: boolean;
  unsubscribe: Unsubscribe | null;
  addItem: (product: Product) => void;
  removeItem: (productID: string) => void;
  updateQuantity: (productID: string, delta: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  setTerminalId: (terminalId: string) => void;
  syncToFirebase: (terminalId?: string) => Promise<void>;
  subscribeToCart: (terminalId: string, callback?: (items: OrderItem[]) => void) => Unsubscribe;
  unsubscribeFromCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  terminalId: 'default',
  isSyncing: false,
  unsubscribe: null,

  addItem: (product: Product) => {
    set(state => {
      const existing = state.items.find(item => item.productID === product.productID);
      const newItems = existing
        ? state.items.map(item =>
            item.productID === product.productID
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...state.items, {
            productID: product.productID,
            quantity: 1,
            priceAtSale: product.price
          }];
      
      return { items: newItems };
    });
    
    // Sync to Firebase after state update
    const { terminalId, isSyncing } = get();
    if (!isSyncing && terminalId) {
      const { items } = get();
      setPath(`carts/${terminalId}`, {
        items,
        lastUpdated: new Date().toISOString()
      }).catch(error => {
        console.error('Error syncing cart to Firebase:', error);
      });
    }
  },

  removeItem: (productID: string) => {
    set(state => {
      const newItems = state.items.filter(item => item.productID !== productID);
      return { items: newItems };
    });
    
    // Sync to Firebase after state update
    const { terminalId, isSyncing } = get();
    if (!isSyncing && terminalId) {
      const { items } = get();
      setPath(`carts/${terminalId}`, {
        items,
        lastUpdated: new Date().toISOString()
      }).catch(error => {
        console.error('Error syncing cart to Firebase:', error);
      });
    }
  },

  updateQuantity: (productID: string, delta: number) => {
    set(state => {
      const newItems = state.items
        .map(item => {
          if (item.productID === productID) {
            const newQty = Math.max(0, item.quantity + delta);
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(item => item.quantity > 0);
      
      return { items: newItems };
    });
    
    // Sync to Firebase after state update
    const { terminalId, isSyncing } = get();
    if (!isSyncing && terminalId) {
      const { items } = get();
      setPath(`carts/${terminalId}`, {
        items,
        lastUpdated: new Date().toISOString()
      }).catch(error => {
        console.error('Error syncing cart to Firebase:', error);
      });
    }
  },

  clearCart: () => {
    set({ items: [] });
    
    // Sync to Firebase after state update
    const { terminalId, isSyncing } = get();
    if (!isSyncing && terminalId) {
      setPath(`carts/${terminalId}`, {
        items: [],
        lastUpdated: new Date().toISOString()
      }).catch(error => {
        console.error('Error syncing cart to Firebase:', error);
      });
    }
  },

  getTotal: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + (item.priceAtSale * item.quantity), 0);
  },

  getItemCount: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },

  setTerminalId: (terminalId: string) => {
    set({ terminalId });
  },

  syncToFirebase: async (terminalId?: string) => {
    const { items, terminalId: currentTerminalId } = get();
    const targetTerminalId = terminalId || currentTerminalId;
    
    if (typeof window === 'undefined') return;
    
    set({ isSyncing: true });
    try {
      await setPath(`carts/${targetTerminalId}`, {
        items,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error syncing cart to Firebase:', error);
    } finally {
      set({ isSyncing: false });
    }
  },

  subscribeToCart: (terminalId: string, callback?: (items: OrderItem[]) => void) => {
    // Unsubscribe from previous listener if exists
    const { unsubscribe: prevUnsubscribe } = get();
    if (prevUnsubscribe) {
      prevUnsubscribe();
    }

    const unsubscribe = subscribeToPath<{ items: OrderItem[]; lastUpdated?: string }>(
      `carts/${terminalId}`,
      (data) => {
        if (data && data.items) {
          set({ items: data.items, isSyncing: true });
          if (callback) {
            callback(data.items);
          }
          // Reset syncing flag after a brief delay to allow UI updates
          setTimeout(() => set({ isSyncing: false }), 100);
        } else {
          set({ items: [], isSyncing: false });
          if (callback) {
            callback([]);
          }
        }
      }
    );

    set({ unsubscribe, terminalId });
    return unsubscribe;
  },

  unsubscribeFromCart: () => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
      set({ unsubscribe: null });
    }
  }
}));
