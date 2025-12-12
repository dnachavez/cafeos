'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useProducts } from '../../hooks/use-products';
import { useCartStore } from '../../store/cart-store';
import { useOrders } from '../../hooks/use-orders';
import { useAuth } from '../../hooks/use-auth';
import { Product } from '../../types/product';
import { Order } from '../../types/order';
import { Search, Plus, Minus, CreditCard, X, Wallet, Banknote, Coffee, ShoppingCart, AlertCircle } from 'lucide-react';

export default function POSPage() {
  const searchParams = useSearchParams();
  const { products, categories, isProductAvailable } = useProducts();
  const { items: cart, addItem, updateQuantity, clearCart, getTotal, setTerminalId, syncToFirebase, unsubscribeFromCart } = useCartStore();
  const { createOrder } = useOrders();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Initialize cart sync on mount
  useEffect(() => {
    // Get terminal ID from URL parameter (same as customer display) or use default
    const terminalId = searchParams.get('terminal') || process.env.NEXT_PUBLIC_TERMINAL_ID || 'default';
    setTerminalId(terminalId);
    
    // Initial sync of current cart to Firebase
    syncToFirebase(terminalId);
    
    // Cleanup on unmount
    return () => {
      unsubscribeFromCart();
    };
  }, [searchParams, setTerminalId, syncToFirebase, unsubscribeFromCart]);
  
  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [discountType, setDiscountType] = useState<'none' | 'pwd' | 'senior'>('none');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'e-wallet'>('cash');
  const [transactionRef, setTransactionRef] = useState('');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const openPaymentModal = () => {
    if (cart.length === 0) return;
    setDiscountType('none');
    setPaymentMethod('cash');
    setTransactionRef('');
    setAmountTendered('');
    setIsPaymentModalOpen(true);
  };

  const calculateTotals = () => {
    const subtotal = getTotal();
    const tax = subtotal * 0.08; // 8% Tax
    const preDiscountTotal = subtotal + tax;
    
    // Discount Logic (20% for PWD/Senior on total)
    const discountAmount = discountType !== 'none' ? preDiscountTotal * 0.20 : 0;
    const totalAmount = preDiscountTotal - discountAmount;

    return { subtotal, tax, discountAmount, totalAmount };
  };

  const handleFinalizePayment = async () => {
    const { subtotal, discountAmount, totalAmount } = calculateTotals();
    const tendered = parseFloat(amountTendered);
    
    // Validation
    if (paymentMethod === 'cash') {
      if (isNaN(tendered) || tendered < totalAmount) {
        alert('Insufficient cash tendered.');
        return;
      }
    } else {
      if (!transactionRef) {
        alert('Please enter a transaction ID/Reference.');
        return;
      }
    }

    setIsProcessing(true);
    
    const newOrder: Order = {
      orderID: `ord_${Date.now()}`,
      orderDate: new Date().toISOString(),
      customerID: 'guest',
      employeeID: user?.id || 'unknown',
      items: cart,
      subtotal,
      discountType,
      discountAmount,
      totalAmount,
      paymentMethod,
      transactionReference: paymentMethod !== 'cash' ? transactionRef : undefined,
      amountTendered: paymentMethod === 'cash' ? tendered : undefined,
      change: paymentMethod === 'cash' ? tendered - totalAmount : undefined,
      status: 'completed'
    };

    await createOrder(newOrder);
    clearCart();
    // Sync cleared cart to Firebase
    syncToFirebase();
    setIsProcessing(false);
    setIsPaymentModalOpen(false);
    // Simple notification
    alert(`Order ${newOrder.orderID} processed successfully!`);
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.categoryID === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const { subtotal, tax, discountAmount, totalAmount } = calculateTotals();

  return (
    <div className="h-full flex gap-6">
      {/* Product Grid Area */}
      <div className="flex-1 flex flex-col">
        {/* Filters */}
        <div className="mb-6 flex gap-4 overflow-x-auto pb-2">
          <button 
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === 'all' ? 'bg-coffee-600 text-white' : 'bg-white text-coffee-600 hover:bg-coffee-50'}`}
          >
            All Items
          </button>
          {categories.map(cat => (
            <button 
              key={cat.categoryID}
              onClick={() => setSelectedCategory(cat.categoryID)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat.categoryID ? 'bg-coffee-600 text-white' : 'bg-white text-coffee-600 hover:bg-coffee-50'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-coffee-400" size={20} />
          <input 
            type="text"
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-coffee-200 focus:outline-none focus:ring-2 focus:ring-coffee-500 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-20">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <Coffee className="mx-auto text-coffee-300 mb-2" size={32} />
              <p className="text-coffee-400 text-sm">No products found</p>
            </div>
          ) : (
            filteredProducts.map(product => {
              const available = isProductAvailable(product);
              return (
              <div 
                key={product.productID}
                onClick={() => {
                  if (available) {
                    addItem(product);
                  } else {
                    alert(`${product.name} is currently out of stock. Please check inventory.`);
                  }
                }}
                className={`bg-white p-4 rounded-xl shadow-sm border transition-all group ${
                  available 
                    ? 'border-coffee-100 hover:border-coffee-400 hover:shadow-md cursor-pointer' 
                    : 'border-red-200 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className={`h-32 bg-coffee-50 rounded-lg mb-4 flex items-center justify-center text-4xl overflow-hidden relative ${
                  !available ? 'bg-red-50' : ''
                }`}>
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className={`w-full h-full object-cover transition-opacity ${
                        available ? 'opacity-80 group-hover:opacity-100' : 'opacity-50'
                      }`} 
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${
                      available ? 'bg-coffee-100' : 'bg-red-50'
                    }`}>
                      <span className={`text-2xl ${available ? 'text-coffee-400' : 'text-red-300'}`}>📦</span>
                    </div>
                  )}
                  {!available && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                      <AlertCircle className="text-red-600" size={24} />
                    </div>
                  )}
                </div>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={`font-semibold ${available ? 'text-coffee-900' : 'text-coffee-500'}`}>
                      {product.name}
                    </h3>
                    <p className={`font-bold mt-1 ${available ? 'text-coffee-600' : 'text-coffee-400'}`}>
                      ${product.price.toFixed(2)}
                    </p>
                  </div>
                  {!available && (
                    <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-200">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>
              );
            })
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-96 bg-white rounded-2xl shadow-xl flex flex-col border border-coffee-200 h-[calc(100vh-6rem)] sticky top-6">
        <div className="p-6 border-b border-coffee-100">
          <h2 className="text-xl font-bold text-coffee-900 flex items-center gap-2">
            Current Order
            <span className="bg-coffee-100 text-coffee-700 text-xs px-2 py-1 rounded-full">{cart.length} items</span>
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-8">
              <ShoppingCart className="mx-auto text-coffee-300 mb-2" size={32} />
              <p className="text-coffee-400 text-sm">Cart is empty</p>
            </div>
          ) : (
            cart.map(item => {
              const product = products.find(p => p.productID === item.productID);
              if (!product) return null;
              return (
                <div key={item.productID} className="flex items-center justify-between p-3 bg-coffee-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-coffee-900 text-sm">{product.name}</p>
                    <p className="text-xs text-coffee-500">${product.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); updateQuantity(item.productID, -1); }}
                      className="w-6 h-6 rounded-full bg-white border border-coffee-200 flex items-center justify-center text-coffee-600 hover:bg-coffee-200"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-medium w-4 text-center text-coffee-900">{item.quantity}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); updateQuantity(item.productID, 1); }}
                      className="w-6 h-6 rounded-full bg-white border border-coffee-200 flex items-center justify-center text-coffee-600 hover:bg-coffee-200"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="w-16 text-right font-medium text-sm text-coffee-900">
                    ${(item.quantity * item.priceAtSale).toFixed(2)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-6 bg-coffee-50 border-t border-coffee-200 rounded-b-2xl">
          <div className="flex justify-between mb-2 text-coffee-600">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-6 text-xl font-bold text-coffee-900">
            <span>Total</span>
            <span>${(subtotal * 1.08).toFixed(2)}</span>
          </div>
          <button 
            disabled={cart.length === 0 || isProcessing}
            onClick={openPaymentModal}
            className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-lg transition-all
              ${cart.length === 0 
                ? 'bg-coffee-200 text-coffee-400 cursor-not-allowed' 
                : 'bg-coffee-600 text-white hover:bg-coffee-700 shadow-lg hover:shadow-xl active:scale-[0.98]'
              }`}
          >
             Charge
          </button>
        </div>
      </div>

      {/* Payment & Receipt Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in flex">
            {/* Left Side: Receipt Preview */}
            <div className="w-1/2 bg-coffee-50 p-6 border-r border-coffee-100 flex flex-col">
              <h3 className="text-center font-bold text-coffee-900 text-xl mb-1">CafeOS Receipt</h3>
              <p className="text-center text-xs text-coffee-500 mb-6">{new Date().toLocaleString()}</p>
              
              <div className="flex-1 overflow-y-auto space-y-2 mb-4 font-mono text-sm text-coffee-800">
                {cart.map(item => {
                  const p = products.find(prod => prod.productID === item.productID);
                  return (
                    <div key={item.productID} className="flex justify-between border-b border-coffee-200 pb-1">
                      <span>{p?.name} x{item.quantity}</span>
                      <span>${(item.priceAtSale * item.quantity).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 text-sm text-coffee-800 font-mono border-t border-dashed border-coffee-300 pt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                {discountType !== 'none' && (
                  <div className="flex justify-between text-green-700">
                    <span>Discount ({discountType.toUpperCase()})</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold mt-2 pt-2 border-t border-coffee-300">
                  <span>Total</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Right Side: Payment Controls */}
            <div className="w-1/2 p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-coffee-900">Payment Details</h3>
                <button onClick={() => setIsPaymentModalOpen(false)} className="text-coffee-400 hover:text-coffee-600">
                  <X size={20} />
                </button>
              </div>

              {/* Discounts */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-coffee-600 uppercase mb-2">Apply Discount</label>
                <div className="flex gap-2">
                  {['none', 'pwd', 'senior'].map(type => (
                    <button
                      key={type}
                      onClick={() => setDiscountType(type as any)}
                      className={`flex-1 py-2 text-sm rounded-lg border font-medium transition-colors capitalize ${
                        discountType === type 
                          ? 'bg-coffee-600 text-white border-coffee-600' 
                          : 'bg-white text-coffee-600 border-coffee-200 hover:bg-coffee-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-coffee-600 uppercase mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setPaymentMethod('cash')} className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-colors ${paymentMethod === 'cash' ? 'bg-coffee-600 text-white border-coffee-600' : 'bg-white text-coffee-600 border-coffee-200'}`}>
                    <Banknote size={20} className="mb-1" />
                    <span className="text-xs font-bold">Cash</span>
                  </button>
                  <button onClick={() => setPaymentMethod('card')} className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-colors ${paymentMethod === 'card' ? 'bg-coffee-600 text-white border-coffee-600' : 'bg-white text-coffee-600 border-coffee-200'}`}>
                    <CreditCard size={20} className="mb-1" />
                    <span className="text-xs font-bold">Card</span>
                  </button>
                  <button onClick={() => setPaymentMethod('e-wallet')} className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-colors ${paymentMethod === 'e-wallet' ? 'bg-coffee-600 text-white border-coffee-600' : 'bg-white text-coffee-600 border-coffee-200'}`}>
                    <Wallet size={20} className="mb-1" />
                    <span className="text-xs font-bold">E-Wallet</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Inputs */}
              <div className="flex-1">
                {paymentMethod === 'cash' ? (
                  <div>
                    <label className="block text-xs font-semibold text-coffee-600 uppercase mb-2">Amount Tendered</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400">$</span>
                      <input 
                        type="number" 
                        value={amountTendered}
                        onChange={(e) => setAmountTendered(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 border border-coffee-200 rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none font-mono text-lg"
                        placeholder="0.00"
                      />
                    </div>
                    {amountTendered && !isNaN(parseFloat(amountTendered)) && (
                      <div className="mt-4 p-3 bg-coffee-50 rounded-lg flex justify-between items-center">
                        <span className="text-coffee-600 font-medium">Change Due:</span>
                        <span className="text-xl font-bold text-coffee-900">
                          ${Math.max(0, parseFloat(amountTendered) - totalAmount).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-coffee-600 uppercase mb-2">Transaction ID / Reference</label>
                    <input 
                      type="text" 
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="w-full px-4 py-3 border border-coffee-200 rounded-lg focus:ring-2 focus:ring-coffee-500 outline-none"
                      placeholder={`Enter ${paymentMethod === 'card' ? 'Card Auth Code' : 'E-Wallet Ref No.'}`}
                    />
                  </div>
                )}
              </div>

              <button 
                onClick={handleFinalizePayment}
                disabled={isProcessing}
                className="w-full mt-6 bg-coffee-800 text-white py-4 rounded-lg font-bold text-lg hover:bg-coffee-900 transition-colors shadow-lg disabled:opacity-70"
              >
                {isProcessing ? 'Processing...' : `Confirm Payment ($${totalAmount.toFixed(2)})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


