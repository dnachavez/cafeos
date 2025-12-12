// Legacy database service - now uses Zustand stores internally
// Kept for backward compatibility during migration
import { useProductsStore } from '../store/products-store';
import { useOrdersStore } from '../store/orders-store';
import { useSuppliersStore } from '../store/suppliers-store';
import { useInventoryStore } from '../store/inventory-store';
import { Product, Category, InventoryItem } from '../types/product';
import { Supplier } from '../types/supplier';
import { Order } from '../types/order';

export const db = {
  categories: {
    getAll: async (): Promise<Category[]> => {
      const { categories } = useProductsStore.getState();
      if (categories.length === 0) {
        await useProductsStore.getState().fetchCategories();
        return useProductsStore.getState().categories;
      }
      return categories;
    },
    add: async (item: Category) => {
      await useProductsStore.getState().addCategory(item);
    }
  },

  products: {
    getAll: async (): Promise<Product[]> => {
      const { products } = useProductsStore.getState();
      if (products.length === 0) {
        await useProductsStore.getState().fetchProducts();
        return useProductsStore.getState().products;
      }
      return products;
    },
    add: async (item: Product) => {
      await useProductsStore.getState().addProduct(item);
    }
  },

  suppliers: {
    getAll: async (): Promise<Supplier[]> => {
      const { suppliers } = useSuppliersStore.getState();
      if (suppliers.length === 0) {
        await useSuppliersStore.getState().fetchSuppliers();
        return useSuppliersStore.getState().suppliers;
      }
      return suppliers;
    },
    add: async (item: Supplier) => {
      await useSuppliersStore.getState().addSupplier(item);
    }
  },

  inventory: {
    getAll: async (): Promise<InventoryItem[]> => {
      const { inventory } = useInventoryStore.getState();
      if (inventory.length === 0) {
        await useInventoryStore.getState().fetchInventory();
        return useInventoryStore.getState().inventory;
      }
      return inventory;
    },
    updateStock: async (productID: string, change: number) => {
      await useInventoryStore.getState().updateStock(productID, change);
    }
  },

  orders: {
    getAll: async (): Promise<Order[]> => {
      const { orders } = useOrdersStore.getState();
      if (orders.length === 0) {
        await useOrdersStore.getState().fetchOrders();
        return useOrdersStore.getState().orders;
      }
      return orders;
    },
    create: async (order: Order) => {
      await useOrdersStore.getState().createOrder(order);
    }
  }
};
