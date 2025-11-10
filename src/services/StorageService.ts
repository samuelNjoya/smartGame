// src/services/StorageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const StorageService = {
  async set(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.error('Failed to save data to storage', e);
    }
  },

  async get(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.error('Failed to get data from storage', e);
      return null;
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('Failed to remove data from storage', e);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error('Failed to clear storage', e);
    }
  },
};

export default StorageService;