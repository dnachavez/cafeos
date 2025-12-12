import { useEffect } from 'react';
import { useOrdersStore } from '../store/orders-store';

export const useOrders = () => {
  const { orders, loading, error, fetchOrders, createOrder } = useOrdersStore();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    createOrder,
    refetch: fetchOrders
  };
};
