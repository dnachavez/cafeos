// Legacy auth service - now uses Zustand store internally
// Kept for backward compatibility during migration
import { useAuthStore } from '../store/auth-store';

export const auth = {
  getCurrentUser: async () => {
    const state = useAuthStore.getState();
    return state.user;
  },

  onAuthStateChanged: (callback: (user: any) => void) => {
    const unsubscribe = useAuthStore.subscribe(
      (state) => state.user,
      (user) => callback(user)
    );
    return unsubscribe;
  },

  login: async (email: string, password: string) => {
    const { login } = useAuthStore.getState();
    return login(email, password);
  },

  signup: async (email: string, password: string) => {
    const { signup } = useAuthStore.getState();
    return signup(email, password);
  },

  logout: async () => {
    const { logout } = useAuthStore.getState();
    return logout();
  }
};
