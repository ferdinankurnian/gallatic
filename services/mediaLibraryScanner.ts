import * as MediaLibrary from 'expo-media-library';
import { imageCache } from './imageCache';

export interface ImageFile {
  id: string;
  uri: string;
  name: string;
  album: string;
  modificationDate: Date;
  size: number;
  creationDate: Date;
  width: number;
  height: number;
}

export interface Album {
  name: string;
  id: string;
  count: number;
  images: ImageFile[];
  coverImage: string;
}

export interface DateGroup {
  date: string;
  count: number;
  images: ImageFile[];
}

export class MediaLibraryScanner {
  private hasPermission = false;
  private allAssets: MediaLibrary.Asset[] = [];
  private albums: Map<string, Album> = new Map();
  private isScanning = false;

  async requestPermission(): Promise<boolean> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      this.hasPermission = status === 'granted';
      
      if (!this.hasPermission) {
        console.warn('Media library permission not granted');
      }
      
      return this.hasPermission;
    } catch (error) {
      console.error('Error requesting media library permission:', error);
      return false;
    }
  }

  async loadFromCache(): Promise<ImageFile[]> {
    const cachedImages = await imageCache.loadCache();
    if (cachedImages) {
      // Convert plain objects back to assets format if needed or just use as is
      // For now we assume the cache stores what we need
      return cachedImages;
    }
    return [];
  }

  async scanAllAssets(limit: number = 100, after?: string): Promise<{ images: ImageFile[]; hasNextPage: boolean; endCursor?: string }> {
    if (!this.hasPermission) {
      const granted = await this.requestPermission();
      if (!granted) {
        return { images: [], hasNextPage: false };
      }
    }

    if (this.isScanning && !after) return { images: [], hasNextPage: false };
    if (!after) this.isScanning = true;

    try {
      const options: MediaLibrary.AssetsOptions = {
        mediaType: ['photo', 'video'],
        sortBy: [['modificationTime', false]],
        first: limit,
        after: after,
      };

      const { assets, hasNextPage, endCursor } = await MediaLibrary.getAssetsAsync(options);
      
      if (!after) {
        this.allAssets = assets;
      } else {
        this.allAssets = [...this.allAssets, ...assets];
      }

      const images = this.convertToImageFiles(assets);
      
      // Save to cache if it's the first page
      if (!after) {
        imageCache.saveCache(this.convertToImageFiles(this.allAssets.slice(0, 500))); // Cache first 500
      }

      return { images, hasNextPage, endCursor };
    } catch (error) {
      console.error('Error scanning media library:', error);
      return { images: [], hasNextPage: false };
    } finally {
      if (!after) this.isScanning = false;
    }
  }

  async scanAlbum(albumId: string): Promise<ImageFile[]> {
    if (!this.hasPermission) {
      const granted = await this.requestPermission();
      if (!granted) {
        return [];
      }
    }

    try {
      const album = await MediaLibrary.getAlbumAsync(albumId);
      if (!album) {
        return [];
      }

      const assets = await MediaLibrary.getAssetsAsync({
        mediaType: ['photo', 'video'],
        sortBy: [['modificationTime', false]],
        album,
        first: 500, // Limit album scan for performance
      });

      return this.convertToImageFiles(assets.assets);
    } catch (error) {
      console.error(`Error scanning album ${albumId}:`, error);
      return [];
    }
  }

  async buildAlbums(): Promise<Album[]> {
    try {
      const userAlbums = await MediaLibrary.getAlbumsAsync({
        includeSmartAlbums: true,
      });

      const result: Album[] = [];

      for (const album of userAlbums) {
        // Just get the cover and count without full scan
        const assets = await MediaLibrary.getAssetsAsync({
          mediaType: ['photo', 'video'],
          sortBy: [['modificationTime', false]],
          album,
          first: 1,
        });

        if (assets.totalCount > 0) {
          result.push({
            name: album.title,
            id: album.id,
            count: assets.totalCount,
            images: [], // Don't load all images here
            coverImage: assets.assets[0]?.uri || '',
          });
        }
      }
      return result.sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Error building albums:', error);
      return [];
    }
  }

  private convertToImageFiles(assets: MediaLibrary.Asset[]): ImageFile[] {
    return assets.map(asset => ({
      id: asset.id,
      uri: asset.uri,
      name: asset.filename,
      album: '',
      modificationDate: new Date(asset.modificationTime || asset.creationTime || Date.now()),
      size: (asset.width * asset.height) || 0,
      creationDate: new Date(asset.creationTime || Date.now()),
      width: asset.width,
      height: asset.height,
    }));
  }

  groupByDate(images: ImageFile[]): DateGroup[] {
    const dateGroups: Map<string, ImageFile[]> = new Map();

    for (const image of images) {
      const dateKey = this.formatDate(image.modificationDate);
      if (!dateGroups.has(dateKey)) {
        dateGroups.set(dateKey, []);
      }
      dateGroups.get(dateKey)!.push(image);
    }

    return Array.from(dateGroups.entries())
      .map(([date, images]) => ({
        date,
        count: images.length,
        images: images, // Already sorted by scanner
      }))
      .sort((a, b) => {
        const dateA = this.parseDate(a.date);
        const dateB = this.parseDate(b.date);
        return dateB.getTime() - dateA.getTime();
      });
  }

  private formatDate(date: Date): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }

    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  private parseDate(dateStr: string): Date {
    if (dateStr === 'Today') return new Date();
    if (dateStr === 'Yesterday') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d;
    }
    try {
      return new Date(dateStr);
    } catch {
      return new Date(0);
    }
  }

  getImages(): ImageFile[] {
    return this.convertToImageFiles(this.allAssets);
  }

  async rescan(): Promise<{ images: ImageFile[]; hasNextPage: boolean; endCursor?: string }> {
    return await this.scanAllAssets(100);
  }

  async clearCache(): Promise<void> {
    this.allAssets = [];
    this.albums.clear();
    await imageCache.clearCache();
  }
}

export const mediaLibraryScanner = new MediaLibraryScanner();
