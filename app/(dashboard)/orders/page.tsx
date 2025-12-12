'use client';

import React from 'react';
import { useOrders } from '../../hooks/use-orders';
import { ShoppingCart } from 'lucide-react';

export default function OrdersPage() {
  const { orders } = useOrders();

  return (
    <div>
      <h2 className="text-2xl font-bold text-coffee-900 mb-6">Order History</h2>
      <div className="bg-white rounded-xl shadow-sm border border-coffee-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-coffee-50 border-b border-coffee-200 text-xs uppercase text-coffee-500 font-semibold tracking-wider">
              <th className="p-4">Order ID</th>
              <th className="p-4">Date</th>
              <th className="p-4">Items</th>
              <th className="p-4">Payment</th>
              <th className="p-4 text-right">Total</th>
              <th className="p-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-coffee-100">
            {orders.map(order => (
              <tr key={order.orderID} className="hover:bg-coffee-50 transition-colors">
                <td className="p-4 font-mono text-sm text-coffee-600">{order.orderID}</td>
                <td className="p-4 text-sm text-coffee-800">{new Date(order.orderDate).toLocaleString()}</td>
                <td className="p-4 text-sm text-coffee-600">{order.items.length} items</td>
                <td className="p-4 text-sm text-coffee-700">
                  <div className="flex flex-col">
                    <span className="capitalize font-medium">{order.paymentMethod}</span>
                    {order.transactionReference && (
                      <span className="text-xs text-coffee-400 font-mono">Ref: {order.transactionReference}</span>
                    )}
                    {order.discountType !== 'none' && order.discountType && (
                      <span className="text-xs text-green-700 font-medium">Disc: {order.discountType.toUpperCase()}</span>
                    )}
                  </div>
                </td>
                <td className="p-4 text-sm font-bold text-coffee-900 text-right">${order.totalAmount.toFixed(2)}</td>
                <td className="p-4 text-center">
                  <span className="inline-block px-2 py-1 rounded-full bg-coffee-100 text-coffee-800 text-xs font-bold uppercase tracking-wide">
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="text-center py-8">
            <ShoppingCart className="mx-auto text-coffee-300 mb-2" size={32} />
            <p className="text-coffee-400 text-sm">No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}

