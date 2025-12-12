// Product-related types

export interface Category {
  categoryID: string;
  name: string;
  description: string;
}

export interface RecipeItem {
  inventoryID: string; // Reference to inventory item
  quantity: number;     // Amount needed per product unit
  unit?: string;        // Unit of measurement for this recipe item (e.g., "cups", "tbsp", "oz", "g")
}

export interface Product {
  productID: string;
  name: string;
  description: string;
  price: number;
  categoryID: string;
  recipe?: RecipeItem[]; // Array of inventory requirements
  image?: string; // Base64 encoded image
}

export interface InventoryItem {
  inventoryID: string;
  name: string; // Name of the inventory item (e.g., "Milk", "Sugar", "Coffee Beans")
  description?: string;
  supplierID: string; // Supplier for this inventory item
  categoryID?: string; // Category for inventory (Coffee Beans, Dairy, Sweeteners, etc.)
  quantity: number;
  unit?: string; // e.g., "cups", "bags", "lbs", "kg", "units"
  baseUnit?: string; // Smallest/base unit (e.g., "pieces", "ml", "g")
  piecesPerUnit?: number; // Conversion factor (e.g., 100 pieces per bag, 1000 ml per liter)
  reorderPoint?: number; // Threshold for low stock alerts
  lastUpdated?: string; // ISO timestamp
}

