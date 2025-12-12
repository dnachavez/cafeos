import { create } from 'zustand';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth as firebaseAuth, database } from '../lib/firebase';
import { User } from '../types/user';
import { sanitizeError } from '../utils/error-handler';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => void;
}

// Convert Firebase user to app User type
const convertFirebaseUser = async (firebaseUser: FirebaseUser | null): Promise<User | null> => {
  if (!firebaseUser) return null;
  
  try {
    const userRef = ref(database, `users/${firebaseUser.uid}`);
    const snapshot = await get(userRef);
    const userData = snapshot.val();
    
    return {
      id: firebaseUser.uid,
      username: firebaseUser.email?.split('@')[0] || firebaseUser.displayName || 'User',
      role: userData?.role || 'staff'
    };
  } catch (error) {
    return {
      id: firebaseUser.uid,
      username: firebaseUser.email?.split('@')[0] || firebaseUser.displayName || 'User',
      role: 'staff'
    };
  }
};

export const useAuthStore = create<AuthState>((set) => {
  // Initialize auth state listener
  let unsubscribe: (() => void) | null = null;

  const initialize = () => {
    if (typeof window === 'undefined') return;
    
    set({ loading: true });
    
    unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      const user = await convertFirebaseUser(firebaseUser);
      set({ user, loading: false, initialized: true });
    });
  };

  return {
    user: null,
    loading: true,
    initialized: false,
    
    initialize,
    
    login: async (email: string, password: string) => {
      try {
        const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        const user = await convertFirebaseUser(userCredential.user);
        if (!user) throw new Error('Failed to get user data');
        set({ user });
      } catch (error: any) {
        throw new Error(sanitizeError(error));
      }
    },
    
    signup: async (email: string, password: string) => {
      try {
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        const user = await convertFirebaseUser(userCredential.user);
        if (!user) throw new Error('Failed to create user');
        set({ user });
      } catch (error: any) {
        throw new Error(sanitizeError(error));
      }
    },
    
    logout: async () => {
      await signOut(firebaseAuth);
      set({ user: null });
      if (unsubscribe) unsubscribe();
    }
  };
});
