'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User } from '../types/user';
import { LayoutDashboard, Coffee, Package, Users, ShoppingCart, LogOut, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../hooks/use-auth';

const menuItems: { path: string; label: string; icon: React.ReactNode }[] = [
  { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { path: '/pos', label: 'Point of Sale', icon: <Coffee size={20} /> },
  { path: '/orders', label: 'Orders History', icon: <ShoppingCart size={20} /> },
  { path: '/inventory', label: 'Inventory', icon: <Package size={20} /> },
  { path: '/products', label: 'Products', icon: <UtensilsCrossed size={20} /> },
  { path: '/suppliers', label: 'Suppliers', icon: <Users size={20} /> },
];

export const Sidebar: React.FC<{ user: User }> = ({ user }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="w-64 bg-coffee-900 text-white h-screen flex flex-col fixed left-0 top-0 shadow-xl z-20">
      <div className="p-6 border-b border-coffee-800">
        <h1 className="text-2xl font-bold tracking-tight text-coffee-100">CafeOS</h1>
        <p className="text-xs text-coffee-400 mt-1">Brewing Success Daily</p>
      </div>
      
      <nav className="flex-1 py-6">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`w-full flex items-center px-6 py-3 transition-colors duration-200 ${
                    isActive
                      ? 'bg-coffee-800 text-white border-r-4 border-coffee-400'
                      : 'text-coffee-300 hover:bg-coffee-800 hover:text-white'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-6 border-t border-coffee-800">
        <button 
          onClick={handleLogout}
          className="flex items-center text-coffee-400 hover:text-white transition-colors w-full"
        >
          <LogOut size={18} className="mr-2" />
          Logout
        </button>
      </div>
    </div>
  );
};

