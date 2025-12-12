'use client';

import React from 'react';
import { useOrders } from '../../hooks/use-orders';
import { useProducts } from '../../hooks/use-products';
import { useInventoryStore } from '../../store/inventory-store';
import { DollarSign, TrendingUp, AlertTriangle, Package, ShoppingCart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { orders, loading: ordersLoading } = useOrders();
  const { products, loading: productsLoading } = useProducts();
  const { inventory, fetchInventory, loading: inventoryLoading } = useInventoryStore();

  // Initialize inventory on mount
  React.useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const loading = ordersLoading || productsLoading || inventoryLoading;

  if (loading) return <div className="p-8 text-coffee-600">Loading dashboard...</div>;

  // Calculate Stats
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalOrders = orders.length;
  const lowStockCount = inventory ? inventory.filter(i => {
    const reorderPoint = i.reorderPoint || 10;
    return i.quantity < reorderPoint;
  }).length : 0;
  
  // Prepare Chart Data
  const chartData = orders.slice(0, 10).map(order => ({
    name: new Date(order.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    amount: order.totalAmount
  })).reverse();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-coffee-900">Dashboard Overview</h2>
        <span className="text-sm text-coffee-600">{new Date().toLocaleDateString()}</span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`$${totalRevenue.toFixed(2)}`} 
          icon={<DollarSign className="text-coffee-600" />} 
          trend="+12% from last week"
        />
        <StatCard 
          title="Total Orders" 
          value={totalOrders.toString()} 
          icon={<TrendingUp className="text-coffee-600" />} 
          trend="+5 new today"
        />
        <StatCard 
          title="Low Stock Items" 
          value={lowStockCount.toString()} 
          icon={<AlertTriangle className="text-coffee-600" />} 
          alert={lowStockCount > 0}
        />
        <StatCard 
          title="Total Products" 
          value={products.length.toString()} 
          icon={<Package className="text-coffee-600" />} 
        />
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-coffee-100">
          <h3 className="text-lg font-semibold text-coffee-800 mb-4">Recent Sales Trend</h3>
          <div className="h-64">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-8">
                <TrendingUp className="mx-auto text-coffee-300 mb-2" size={32} />
                <p className="text-coffee-400 text-sm">No sales data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2e8e5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#816154', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#816154', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: '#fff', color: '#523c36' }}
                    itemStyle={{ color: '#816154' }}
                    formatter={(value: number) => `$${value.toFixed(2)}`}
                  />
                  <Bar dataKey="amount" fill="#a07e6f" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Orders List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-coffee-100">
          <h3 className="text-lg font-semibold text-coffee-800 mb-4">Recent Transactions</h3>
          <div className="space-y-4">
            {orders.slice(0, 5).map(order => (
              <div key={order.orderID} className="flex justify-between items-center p-3 hover:bg-coffee-50 rounded-lg transition-colors border border-transparent hover:border-coffee-100">
                <div>
                  <p className="font-medium text-coffee-900">Order #{order.orderID.slice(-4)}</p>
                  <p className="text-xs text-coffee-500">{new Date(order.orderDate).toLocaleTimeString()}</p>
                </div>
                <span className="font-semibold text-coffee-700">+${order.totalAmount.toFixed(2)}</span>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="text-center py-8">
                <ShoppingCart className="mx-auto text-coffee-300 mb-2" size={32} />
                <p className="text-coffee-400 text-sm">No recent orders</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ title, value, icon, trend, alert }: any) => (
  <div className={`bg-white p-6 rounded-xl shadow-sm border ${alert ? 'border-coffee-300 bg-coffee-50' : 'border-coffee-100'}`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-coffee-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-coffee-900">{value}</h3>
      </div>
      <div className="p-2 bg-coffee-50 rounded-lg">{icon}</div>
    </div>
    {trend && <p className="text-xs text-coffee-600 mt-2 font-medium">{trend}</p>}
    {alert && <p className="text-xs text-coffee-700 mt-2 font-medium">Action Needed</p>}
  </div>
);

