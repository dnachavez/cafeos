import { create } from 'zustand';
import { Product, Category, RecipeItem } from '../types/product';
import { getAllFromPath, addToPath } from '../utils/db-helpers';
import { sanitizeError } from '../utils/error-handler';
import { useInventoryStore } from './inventory-store';
import { ref, get as firebaseGet, remove, set as firebaseSet } from 'firebase/database';
import { database } from '../lib/firebase';

interface ProductsState {
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  addProduct: (product: Product, recipe?: RecipeItem[]) => Promise<void>;
  updateProduct: (product: Product, recipe?: RecipeItem[]) => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  deleteProduct: (productID: string) => Promise<void>;
  isProductAvailable: (product: Product) => boolean;
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  categories: [],
  loading: false,
  error: null,

  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const products = await getAllFromPath<Product>('products', 'productID');
      set({ products, loading: false });
    } catch (error: any) {
      set({ error: sanitizeError(error), loading: false });
    }
  },

  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      const categories = await getAllFromPath<Category>('categories', 'categoryID');
      set({ categories, loading: false });
    } catch (error: any) {
      set({ error: sanitizeError(error), loading: false });
    }
  },

  addProduct: async (product: Product, recipe: RecipeItem[] = []) => {
    try {
      const productWithRecipe = { ...product, recipe };
      await addToPath('products', productWithRecipe, 'productID');
      
      // Update local state
      set(state => ({
        products: [...state.products, productWithRecipe]
      }));
    } catch (error: any) {
      set({ error: sanitizeError(error) });
      throw error;
    }
  },

  updateProduct: async (product: Product, recipe: RecipeItem[] = []) => {
    if (typeof window === 'undefined') return;
    try {
      const snapshot = await firebaseGet(ref(database, 'products'));
      if (!snapshot.exists()) return;
      
      const products = snapshot.val();
      if (!products) return;
      
      const productKey = Object.keys(products).find(
        key => products[key].productID === product.productID
      );
      
      if (productKey) {
        const productWithRecipe = { ...product, recipe };
        // Remove undefined values before saving to Firebase
        const cleanedProduct: { [key: string]: any } = {};
        for (const key in productWithRecipe) {
          if (productWithRecipe[key as keyof typeof productWithRecipe] !== undefined) {
            cleanedProduct[key] = productWithRecipe[key as keyof typeof productWithRecipe];
          }
        }
        await firebaseSet(ref(database, `products/${productKey}`), cleanedProduct);
        
        // Update local state
        set(state => ({
          products: state.products.map(p => 
            p.productID === product.productID ? productWithRecipe : p
          )
        }));
      }
    } catch (error: any) {
      console.error('Error updating product:', error);
      set({ error: sanitizeError(error) });
      throw error;
    }
  },

  isProductAvailable: (product: Product): boolean => {
    if (!product.recipe || product.recipe.length === 0) {
      return true; // Products without recipes are always available
    }

    const { inventory, convertRecipeToInventoryUnit } = useInventoryStore.getState();
    
    // Check if all recipe items have sufficient stock
    return product.recipe.every(recipeItem => {
      const inventoryItem = inventory.find(inv => inv.inventoryID === recipeItem.inventoryID);
      if (!inventoryItem) return false;
      
      // Convert recipe quantity to inventory unit
      const convertedQuantity = convertRecipeToInventoryUnit(recipeItem);
      
      // If conversion fails, consider product unavailable
      if (convertedQuantity === null) {
        return false;
      }
      
      // Compare converted quantity with available inventory
      return inventoryItem.quantity >= convertedQuantity;
    });
  },

  addCategory: async (category: Category) => {
    try {
      await addToPath('categories', category, 'categoryID');
      set(state => ({
        categories: [...state.categories, category]
      }));
    } catch (error: any) {
      set({ error: sanitizeError(error) });
      throw error;
    }
  },

  deleteProduct: async (productID: string) => {
    if (typeof window === 'undefined') return;
    try {
      const snapshot = await firebaseGet(ref(database, 'products'));
      if (!snapshot.exists()) return;
      
      const products = snapshot.val();
      const productKey = Object.keys(products).find(
        key => products[key].productID === productID
      );
      
      if (productKey) {
        await remove(ref(database, `products/${productKey}`));
        
        // Update local state
        set(state => ({
          products: state.products.filter(product => product.productID !== productID)
        }));
      }
    } catch (error: any) {
      console.error('Error deleting product:', error);
      set({ error: sanitizeError(error) });
      throw error;
    }
  }
}));
