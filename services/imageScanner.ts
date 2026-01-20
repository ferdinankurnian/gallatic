import * as FileSystem from 'expo-file-system';
import { Image as ExpoImage } from 'expo-image';
import { imageCache } from './imageCache';

export interface ImageFile {
  id: string;
  uri: string;
  name: string;
  path: string;
  album: string;
  modificationDate: Date;
  size: number;
}

export interface Album {
  name: string;
  path: string;
  count: number;
  images: ImageFile[];
  coverImage: string;
}

export interface DateGroup {
  date: string;
  count: number;
  images: ImageFile[];
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.heic', '.webp', '.gif', '.bmp'];

export class ImageScanner {
  private scannedImages: Map<string, ImageFile> = new Map();
  private albums: Map<string, Album> = new Map();

  async scanAllDirectories(forceRescan: boolean = false): Promise<ImageFile[]> {
    if (!forceRescan) {
      const cachedImages = await imageCache.loadCache();
      if (cachedImages) {
        this.scannedImages = new Map(cachedImages.map((img: any) => [img.id, img]));
        this.buildAlbums();
        return cachedImages;
      }
    }

    // Since custom Paths aren't available, we use standard Expo directories
    const directories = [
      FileSystem.documentDirectory,
      FileSystem.cacheDirectory,
    ];

    const allImages: ImageFile[] = [];

    for (const dir of directories) {
      if (dir) {
        const images = await this.scanDirectory(dir);
        allImages.push(...images);
      }
    }

    this.scannedImages = new Map(allImages.map(img => [img.id, img]));
    this.buildAlbums();
    
    await imageCache.saveCache(allImages);

    return allImages;
  }

  async scanDirectory(directoryUri: string): Promise<ImageFile[]> {
    const images: ImageFile[] = [];

    try {
      const contents = await FileSystem.readDirectoryAsync(directoryUri);

      for (const item of contents) {
        const itemUri = `${directoryUri}${item}`;
        const info = await FileSystem.getInfoAsync(itemUri);
        
        if (info.isDirectory) {
          const subImages = await this.scanDirectory(`${itemUri}/`);
          images.push(...subImages);
        } else if (this.isImageFile(item)) {
          const imageFile = await this.createImageFile(item, itemUri, directoryUri);
          if (imageFile) {
            images.push(imageFile);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${directoryUri}:`, error);
    }

    return images;
  }

  private async createImageFile(name: string, uri: string, baseDirectory: string): Promise<ImageFile | null> {
    try {
      const relativePath = uri.replace(baseDirectory, '');
      const albumName = relativePath.split('/')[0] || 'Uncategorized';

      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists) {
        return null;
      }
      
      return {
        id: this.generateId(uri),
        uri: uri,
        name: name,
        path: relativePath,
        album: albumName,
        modificationDate: info.modificationTime ? new Date(info.modificationTime * 1000) : new Date(),
        size: info.size || 0,
      };
    } catch (error) {
      console.error(`Error creating image file for ${uri}:`, error);
      return null;
    }
  }

  private isImageFile(filename: string): boolean {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return IMAGE_EXTENSIONS.includes(ext);
  }

  private generateId(path: string): string {
    // Basic hash function since btoa might not be available or suitable
    let hash = 0;
    for (let i = 0; i < path.length; i++) {
      const char = path.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private buildAlbums(): void {
    this.albums.clear();

    for (const image of this.scannedImages.values()) {
      if (!this.albums.has(image.album)) {
        this.albums.set(image.album, {
          name: image.album,
          path: image.path.split('/')[0],
          count: 0,
          images: [],
          coverImage: image.uri,
        });
      }

      const album = this.albums.get(image.album)!;
      album.images.push(image);
      album.count = album.images.length;
    }
  }

  getAlbums(): Album[] {
    return Array.from(this.albums.values()).sort((a, b) => b.count - a.count);
  }

  groupByDate(): DateGroup[] {
    const dateGroups: Map<string, ImageFile[]> = new Map();

    for (const image of this.scannedImages.values()) {
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
        images: images.sort((a, b) => b.modificationDate.getTime() - a.modificationDate.getTime()),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

  getImages(): ImageFile[] {
    return Array.from(this.scannedImages.values());
  }

  getImagesByAlbum(albumName: string): ImageFile[] {
    return this.albums.get(albumName)?.images || [];
  }

  async rescan(): Promise<ImageFile[]> {
    this.scannedImages.clear();
    this.albums.clear();
    return await this.scanAllDirectories(true);
  }
}

export const imageScanner = new ImageScanner();