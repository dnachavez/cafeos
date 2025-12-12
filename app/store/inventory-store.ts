import { create } from 'zustand';
import { InventoryItem, RecipeItem } from '../types/product';
import { getAllFromPath, addToPath } from '../utils/db-helpers';
import { ref, get as firebaseGet, update, remove } from 'firebase/database';
import { database } from '../lib/firebase';
import { sanitizeError } from '../utils/error-handler';
import { convertToInventoryUnit } from '../utils/unit-converter';

interface InventoryState {
  inventory: InventoryItem[];
  loading: boolean;
  error: string | null;
  fetchInventory: () => Promise<void>;
  addInventoryItem: (item: InventoryItem) => Promise<void>;
  updateStock: (inventoryID: string, change: number) => Promise<void>;
  setStock: (inventoryID: string, quantity: number, reason?: string) => Promise<void>;
  deleteInventoryItem: (inventoryID: string) => Promise<void>;
  getStockLevel: (inventoryID: string) => number;
  getInventoryItem: (inventoryID: string) => InventoryItem | undefined;
  getInventoryItemByName: (name: string) => InventoryItem | undefined;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  inventory: [],
  loading: false,
  error: null,

  fetchInventory: async () => {
    set({ loading: true, error: null });
    try {
      const inventory = await getAllFromPath<InventoryItem>('inventory', 'inventoryID');
      set({ inventory, loading: false });
    } catch (error: any) {
      set({ error: sanitizeError(error), loading: false });
    }
  },

  addInventoryItem: async (item: InventoryItem) => {
    try {
      await addToPath('inventory', item, 'inventoryID');
      
      // Update local state
      set(state => ({
        inventory: [...state.inventory, item]
      }));
    } catch (error: any) {
      set({ error: sanitizeError(error) });
      throw error;
    }
  },

  updateStock: async (inventoryID: string, change: number) => {
    if (typeof window === 'undefined') return;
    try {
      const snapshot = await firebaseGet(ref(database, 'inventory'));
      if (!snapshot.exists()) return;
      
      const inventory = snapshot.val();
      const inventoryKey = Object.keys(inventory).find(
        key => inventory[key].inventoryID === inventoryID
      );
      
      if (inventoryKey) {
        const currentQuantity = inventory[inventoryKey].quantity || 0;
        const newQuantity = Math.max(0, currentQuantity + change); // Prevent negative stock
        // Round to 2 decimal places to avoid floating point precision issues
        const roundedQuantity = Math.round(newQuantity * 100) / 100;
        await update(ref(database, `inventory/${inventoryKey}`), {
          quantity: roundedQuantity,
          lastUpdated: new Date().toISOString()
        });
        
        // Update local state
        set(state => ({
          inventory: state.inventory.map(item =>
            item.inventoryID === inventoryID
              ? { ...item, quantity: roundedQuantity, lastUpdated: new Date().toISOString() }
              : item
          )
        }));
      }
    } catch (error: any) {
      console.error('Error updating stock:', error);
      set({ error: sanitizeError(error) });
      throw error;
    }
  },

  setStock: async (inventoryID: string, quantity: number, reason?: string) => {
    if (typeof window === 'undefined') return;
    try {
      const snapshot = await firebaseGet(ref(database, 'inventory'));
      if (!snapshot.exists()) return;
      
      const inventory = snapshot.val();
      const inventoryKey = Object.keys(inventory).find(
        key => inventory[key].inventoryID === inventoryID
      );
      
      if (inventoryKey) {
        const newQuantity = Math.max(0, quantity); // Prevent negative stock
        // Round to 2 decimal places to avoid floating point precision issues
        const roundedQuantity = Math.round(newQuantity * 100) / 100;
        await update(ref(database, `inventory/${inventoryKey}`), {
          quantity: roundedQuantity,
          lastUpdated: new Date().toISOString()
        });
        
        // Update local state
        set(state => ({
          inventory: state.inventory.map(item =>
            item.inventoryID === inventoryID
              ? { ...item, quantity: roundedQuantity, lastUpdated: new Date().toISOString() }
              : item
          )
        }));
      }
    } catch (error: any) {
      console.error('Error setting stock:', error);
      set({ error: sanitizeError(error) });
      throw error;
    }
  },

  deleteInventoryItem: async (inventoryID: string) => {
    if (typeof window === 'undefined') return;
    try {
      const snapshot = await firebaseGet(ref(database, 'inventory'));
      if (!snapshot.exists()) return;
      
      const inventory = snapshot.val();
      const inventoryKey = Object.keys(inventory).find(
        key => inventory[key].inventoryID === inventoryID
      );
      
      if (inventoryKey) {
        await remove(ref(database, `inventory/${inventoryKey}`));
        
        // Update local state
        set(state => ({
          inventory: state.inventory.filter(item => item.inventoryID !== inventoryID)
        }));
      }
    } catch (error: any) {
      console.error('Error deleting inventory item:', error);
      set({ error: sanitizeError(error) });
      throw error;
    }
  },

  getStockLevel: (inventoryID: string) => {
    const { inventory } = get();
    const item = inventory.find(i => i.inventoryID === inventoryID);
    return item?.quantity || 0;
  },

  getInventoryItem: (inventoryID: string) => {
    const { inventory } = get();
    return inventory.find(i => i.inventoryID === inventoryID);
  },

  getInventoryItemByName: (name: string) => {
    const { inventory } = get();
    return inventory.find(i => i.name.toLowerCase() === name.toLowerCase());
  },

  convertRecipeToInventoryUnit: (recipeItem: RecipeItem): number | null => {
    const { inventory } = get();
    const inventoryItem = inventory.find(i => i.inventoryID === recipeItem.inventoryID);
    
    if (!inventoryItem) {
      return null;
    }
    
    return convertToInventoryUnit(
      recipeItem.quantity,
      recipeItem.unit,
      inventoryItem
    );
  }
}));
