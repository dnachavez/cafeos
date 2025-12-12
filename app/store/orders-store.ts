import { create } from 'zustand';
import { Order } from '../types/order';
import { getAllFromPath, addToPath } from '../utils/db-helpers';
import { useInventoryStore } from './inventory-store';
import { useProductsStore } from './products-store';
import { sanitizeError } from '../utils/error-handler';

interface OrdersState {
  orders: Order[];
  loading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  createOrder: (order: Order) => Promise<void>;
}

export const useOrdersStore = create<OrdersState>((set) => ({
  orders: [],
  loading: false,
  error: null,

  fetchOrders: async () => {
    set({ loading: true, error: null });
    try {
      const orders = await getAllFromPath<Order>('orders', 'orderID');
      // Sort by date (newest first)
      const sortedOrders = orders.sort(
        (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
      );
      set({ orders: sortedOrders, loading: false });
    } catch (error: any) {
      set({ error: sanitizeError(error), loading: false });
    }
  },

  createOrder: async (order: Order) => {
    try {
      await addToPath('orders', order, 'orderID');
      
      // Consume inventory based on product recipes
      const { updateStock, getInventoryItem, convertRecipeToInventoryUnit } = useInventoryStore.getState();
      const { products } = useProductsStore.getState();
      
      for (const orderItem of order.items) {
        const product = products.find(p => p.productID === orderItem.productID);
        
        if (product && product.recipe && product.recipe.length > 0) {
          // For each recipe item, consume inventory
          for (const recipeItem of product.recipe) {
            const inventoryItem = getInventoryItem(recipeItem.inventoryID);
            
            if (!inventoryItem) {
              console.warn(`Inventory item ${recipeItem.inventoryID} not found`);
              continue;
            }
            
            // Convert recipe quantity/unit to inventory unit
            const convertedQuantity = convertRecipeToInventoryUnit(recipeItem);
            
            if (convertedQuantity === null) {
              const recipeUnit = recipeItem.unit || 'units';
              const inventoryUnit = inventoryItem.unit || 'units';
              throw new Error(
                `Cannot convert units: recipe uses "${recipeUnit}" but inventory uses "${inventoryUnit}". ` +
                `Units must be compatible (same category: count, volume, or weight).`
              );
            }
            
            // Consume: converted quantity * order quantity
            const totalConsumption = convertedQuantity * orderItem.quantity;
            
            // Round to reasonable precision (6 decimal places)
            const roundedConsumption = Math.round(totalConsumption * 1000000) / 1000000;
            
            await updateStock(recipeItem.inventoryID, -roundedConsumption);
          }
        }
      }
      
      // Update local state
      set(state => ({
        orders: [order, ...state.orders]
      }));
    } catch (error: any) {
      set({ error: sanitizeError(error) });
      throw error;
    }
  }
}));
