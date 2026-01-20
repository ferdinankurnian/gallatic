import * as FileSystem from 'expo-file-system';

const CACHE_FILE_PATH = `${FileSystem.cacheDirectory}image_scan_cache.json`;
const CACHE_VERSION = 2; // Incremented version because of structure change

export interface CacheData {
  version: number;
  timestamp: number;
  images: any[];
}

export class ImageCache {
  async saveCache(images: any[]): Promise<void> {
    try {
      const cacheData: CacheData = {
        version: CACHE_VERSION,
        timestamp: Date.now(),
        images: images.map((img: any) => ({
          ...img,
          // Ensure modificationDate is stored as ISO string or timestamp
          modificationDate: img.modificationDate instanceof Date 
            ? img.modificationDate.toISOString() 
            : img.modificationDate,
          creationDate: img.creationDate instanceof Date 
            ? img.creationDate.toISOString() 
            : img.creationDate,
        })),
      };

      await FileSystem.writeAsStringAsync(CACHE_FILE_PATH, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving cache:', error);
    }
  }

  async loadCache(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<any[] | null> {
    try {
      const info = await FileSystem.getInfoAsync(CACHE_FILE_PATH);
      
      if (!info.exists) {
        return null;
      }

      const content = await FileSystem.readAsStringAsync(CACHE_FILE_PATH);
      const cacheData: CacheData = JSON.parse(content);
      
      if (cacheData.version !== CACHE_VERSION) {
        await this.clearCache();
        return null;
      }

      const age = Date.now() - cacheData.timestamp;
      
      if (age > maxAge) {
        // Cache too old, but maybe we can still return it while refreshing
        // For now let's just clear it if it's too old
        await this.clearCache();
        return null;
      }

      return cacheData.images.map((img: any) => ({
        ...img,
        modificationDate: new Date(img.modificationDate),
        creationDate: new Date(img.creationDate),
      }));
    } catch (error) {
      console.error('Error loading cache:', error);
      return null;
    }
  }

  async clearCache(): Promise<void> {
    try {
      const info = await FileSystem.getInfoAsync(CACHE_FILE_PATH);
      if (info.exists) {
        await FileSystem.deleteAsync(CACHE_FILE_PATH);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  async getCacheTimestamp(): Promise<number | null> {
    try {
      const content = await FileSystem.readAsStringAsync(CACHE_FILE_PATH);
      const cacheData: CacheData = JSON.parse(content);
      return cacheData.timestamp;
    } catch {
      return null;
    }
  }
}

export const imageCache = new ImageCache();