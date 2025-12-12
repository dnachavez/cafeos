import { useEffect } from 'react';
import { useAuthStore } from '../store/auth-store';

export const useAuth = () => {
  const { user, loading, initialized, login, signup, logout, initialize } = useAuthStore();

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout
  };
};
