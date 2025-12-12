import { ref, get, set, push, update, onValue, off, Unsubscribe } from 'firebase/database';
import { database } from '../lib/firebase';

// Helper function to get all items from a path
export const getAllFromPath = async <T extends { [key: string]: any }>(
  path: string, 
  idField: string
): Promise<T[]> => {
  if (typeof window === 'undefined') return [];
  try {
    const snapshot = await get(ref(database, path));
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.keys(data).map(key => ({ 
      ...data[key], 
      [idField]: data[key][idField] || key 
    }));
  } catch (error) {
    console.error(`Error fetching from ${path}:`, error);
    return [];
  }
};

// Helper function to remove undefined values from an object
const removeUndefined = (obj: { [key: string]: any }): { [key: string]: any } => {
  const cleaned: { [key: string]: any } = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
};

// Helper function to add item to a path
export const addToPath = async <T extends { [key: string]: any }>(
  path: string, 
  item: T, 
  idField: string
): Promise<void> => {
  if (typeof window === 'undefined') return;
  try {
    const itemId = item[idField] || push(ref(database, path)).key;
    // Remove undefined values before saving to Firebase
    const cleanedItem = removeUndefined({ ...item, [idField]: itemId });
    await set(ref(database, `${path}/${itemId}`), cleanedItem);
  } catch (error) {
    console.error(`Error adding to ${path}:`, error);
    throw error;
  }
};

// Helper function to update item in a path
export const updateInPath = async (
  path: string,
  updates: Record<string, any>
): Promise<void> => {
  if (typeof window === 'undefined') return;
  try {
    // Remove undefined values before updating Firebase
    const cleanedUpdates = removeUndefined(updates);
    await update(ref(database, path), cleanedUpdates);
  } catch (error) {
    console.error(`Error updating ${path}:`, error);
    throw error;
  }
};

// Helper function to set data at a path
export const setPath = async <T extends { [key: string]: any }>(
  path: string,
  data: T
): Promise<void> => {
  if (typeof window === 'undefined') return;
  try {
    // Remove undefined values before setting Firebase
    const cleanedData = removeUndefined(data);
    await set(ref(database, path), cleanedData);
  } catch (error) {
    console.error(`Error setting ${path}:`, error);
    throw error;
  }
};

// Helper function to subscribe to real-time updates from a path
export const subscribeToPath = <T>(
  path: string,
  callback: (data: T | null) => void
): Unsubscribe => {
  if (typeof window === 'undefined') {
    return () => {}; // Return no-op unsubscribe function for SSR
  }
  try {
    const dbRef = ref(database, path);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val() as T);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error(`Error subscribing to ${path}:`, error);
      callback(null);
    });
    return unsubscribe;
  } catch (error) {
    console.error(`Error subscribing to ${path}:`, error);
    return () => {}; // Return no-op unsubscribe function on error
  }
};
