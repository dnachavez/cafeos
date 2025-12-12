import { useEffect } from 'react';
import { useSuppliersStore } from '../store/suppliers-store';

export const useSuppliers = () => {
  const { suppliers, loading, error, fetchSuppliers, addSupplier, updateSupplier, deleteSupplier } = useSuppliersStore();

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  return {
    suppliers,
    loading,
    error,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    refetch: fetchSuppliers
  };
};
