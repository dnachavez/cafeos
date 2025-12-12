'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useProducts } from '../hooks/use-products';
import { useCartStore } from '../store/cart-store';
import { OrderItem } from '../types/order';
import { ShoppingCart, Coffee } from 'lucide-react';

export default function CustomerDisplayPage() {
  const searchParams = useSearchParams();
  const terminalId = searchParams.get('terminal') || 'default';
  const { products } = useProducts();
  const { subscribeToCart, unsubscribeFromCart } = useCartStore();
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    // Subscribe to cart updates
    const unsubscribe = subscribeToCart(terminalId, (items) => {
      setCartItems(items);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      unsubscribeFromCart();
    };
  }, [terminalId, subscribeToCart, unsubscribeFromCart]);

  // Calculate totals
  const { subtotal, tax, total } = useMemo(() => {
    const sub = cartItems.reduce((sum, item) => sum + (item.priceAtSale * item.quantity), 0);
    const taxAmount = sub * 0.08; // 8% tax
    const totalAmount = sub + taxAmount;
    return {
      subtotal: sub,
      tax: taxAmount,
      total: totalAmount
    };
  }, [cartItems]);

  // Get product details for each cart item
  const itemsWithProducts = useMemo(() => {
    return cartItems.map(item => {
      const product = products.find(p => p.productID === item.productID);
      return {
        ...item,
        product
      };
    }).filter(item => item.product); // Filter out items with missing products
  }, [cartItems, products]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-coffee-50 to-coffee-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-coffee-900 mb-2">Your Order</h1>
          <p className="text-xl text-coffee-600">Thank you for your order!</p>
        </div>

        {/* Cart Items */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-6">
          {itemsWithProducts.length === 0 ? (
            <div className="p-16 text-center">
              <ShoppingCart className="mx-auto text-coffee-300 mb-4" size={64} />
              <p className="text-2xl text-coffee-400 font-medium">Cart is empty</p>
              <p className="text-lg text-coffee-500 mt-2">Items will appear here as they are added</p>
            </div>
          ) : (
            <div className="divide-y divide-coffee-100">
              {itemsWithProducts.map((item) => {
                const product = item.product!;
                const itemTotal = item.quantity * item.priceAtSale;
                
                return (
                  <div 
                    key={item.productID} 
                    className="p-6 hover:bg-coffee-50 transition-colors"
                  >
                    <div className="flex items-center gap-6">
                      {/* Product Image */}
                      <div className="w-24 h-24 bg-coffee-100 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Coffee className="text-coffee-400" size={40} />
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-2xl font-bold text-coffee-900 mb-1">
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="text-lg text-coffee-600 mb-2 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4">
                          <span className="text-xl font-semibold text-coffee-700">
                            ${item.priceAtSale.toFixed(2)} each
                          </span>
                          <span className="text-xl text-coffee-500">
                            × {item.quantity}
                          </span>
                        </div>
                      </div>

                      {/* Item Total */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-3xl font-bold text-coffee-900">
                          ${itemTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Totals Section */}
        {itemsWithProducts.length > 0 && (
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-2xl">
                <span className="text-coffee-600 font-medium">Subtotal</span>
                <span className="text-coffee-900 font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-2xl">
                <span className="text-coffee-600 font-medium">Tax (8%)</span>
                <span className="text-coffee-900 font-semibold">${tax.toFixed(2)}</span>
              </div>
              <div className="border-t-2 border-coffee-200 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-3xl font-bold text-coffee-900">Total</span>
                  <span className="text-4xl font-bold text-coffee-900">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-lg text-coffee-500">
            Terminal: {terminalId}
          </p>
        </div>
      </div>
    </div>
  );
}
