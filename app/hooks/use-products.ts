import { useEffect } from 'react';
import { useProductsStore } from '../store/products-store';

export const useProducts = () => {
  const {
    products,
    categories,
    loading,
    error,
    fetchProducts,
    fetchCategories,
    addProduct,
    updateProduct,
    addCategory,
    deleteProduct,
    isProductAvailable
  } = useProductsStore();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  return {
    products,
    categories,
    loading,
    error,
    addProduct,
    updateProduct,
    addCategory,
    deleteProduct,
    isProductAvailable,
    refetch: () => {
      fetchProducts();
      fetchCategories();
    }
  };
};
