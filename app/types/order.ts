// Order-related types

export interface OrderItem {
  productID: string;
  quantity: number;
  priceAtSale: number;
}

export interface Order {
  orderID: string;
  orderDate: string; // ISO String
  customerID: string; // Optional in anonymous cafe setting
  employeeID: string;
  items: OrderItem[]; 
  
  // Financials
  subtotal: number;
  discountType: 'none' | 'pwd' | 'senior';
  discountAmount: number;
  totalAmount: number; // Final amount after discount
  
  // Payment
  paymentMethod: 'cash' | 'card' | 'e-wallet';
  transactionReference?: string; // For card/e-wallet
  amountTendered?: number; // For cash
  change?: number; // For cash

  status: 'pending' | 'completed' | 'cancelled';
}

