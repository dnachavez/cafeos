import { create } from 'zustand';
import { Supplier } from '../types/supplier';
import { getAllFromPath, addToPath } from '../utils/db-helpers';
import { sanitizeError } from '../utils/error-handler';
import { ref, get as firebaseGet, remove, set as firebaseSet } from 'firebase/database';
import { database } from '../lib/firebase';

interface SuppliersState {
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
  fetchSuppliers: () => Promise<void>;
  addSupplier: (supplier: Supplier) => Promise<void>;
  updateSupplier: (supplier: Supplier) => Promise<void>;
  deleteSupplier: (supplierID: string) => Promise<void>;
}

export const useSuppliersStore = create<SuppliersState>((set) => ({
  suppliers: [],
  loading: false,
  error: null,

  fetchSuppliers: async () => {
    set({ loading: true, error: null });
    try {
      const suppliers = await getAllFromPath<Supplier>('suppliers', 'supplierID');
      set({ suppliers, loading: false });
    } catch (error: any) {
      set({ error: sanitizeError(error), loading: false });
    }
  },

  addSupplier: async (supplier: Supplier) => {
    try {
      await addToPath('suppliers', supplier, 'supplierID');
      set(state => ({
        suppliers: [...state.suppliers, supplier]
      }));
    } catch (error: any) {
      set({ error: sanitizeError(error) });
      throw error;
    }
  },

  updateSupplier: async (supplier: Supplier) => {
    if (typeof window === 'undefined') return;
    try {
      const snapshot = await firebaseGet(ref(database, 'suppliers'));
      if (!snapshot.exists()) return;
      
      const suppliers = snapshot.val();
      const supplierKey = Object.keys(suppliers).find(
        key => suppliers[key].supplierID === supplier.supplierID
      );
      
      if (supplierKey) {
        // Remove undefined values before saving to Firebase
        const cleanedSupplier: { [key: string]: any } = {};
        for (const key in supplier) {
          if (supplier[key as keyof typeof supplier] !== undefined) {
            cleanedSupplier[key] = supplier[key as keyof typeof supplier];
          }
        }
        await firebaseSet(ref(database, `suppliers/${supplierKey}`), cleanedSupplier);
        
        // Update local state
        set(state => ({
          suppliers: state.suppliers.map(s => 
            s.supplierID === supplier.supplierID ? supplier : s
          )
        }));
      }
    } catch (error: any) {
      console.error('Error updating supplier:', error);
      set({ error: sanitizeError(error) });
      throw error;
    }
  },

  deleteSupplier: async (supplierID: string) => {
    if (typeof window === 'undefined') return;
    try {
      const snapshot = await firebaseGet(ref(database, 'suppliers'));
      if (!snapshot.exists()) return;
      
      const suppliers = snapshot.val();
      const supplierKey = Object.keys(suppliers).find(
        key => suppliers[key].supplierID === supplierID
      );
      
      if (supplierKey) {
        await remove(ref(database, `suppliers/${supplierKey}`));
        
        // Update local state
        set(state => ({
          suppliers: state.suppliers.filter(supplier => supplier.supplierID !== supplierID)
        }));
      }
    } catch (error: any) {
      console.error('Error deleting supplier:', error);
      set({ error: sanitizeError(error) });
      throw error;
    }
  }
}));
