/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ExtractedRow } from '../../types/extraction/ExtractionTypes';

export class IndexedDBService {
  private dbName = 'ClothingExtractor';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create extraction results store
        if (!db.objectStoreNames.contains('extractions')) {
          const extractionStore = db.createObjectStore('extractions', { keyPath: 'id' });
          extractionStore.createIndex('createdAt', 'createdAt');
          extractionStore.createIndex('status', 'status');
          extractionStore.createIndex('category', 'category');
        }
        
        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  async saveExtraction(extraction: ExtractedRow): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['extractions'], 'readwrite');
      const store = transaction.objectStore('extractions');
      const request = store.put({
        ...extraction,
        // Convert File to serializable format
        file: null, // Don't store actual file
        fileInfo: {
          name: extraction.file.name,
          size: extraction.file.size,
          type: extraction.file.type,
          lastModified: extraction.file.lastModified
        }
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getExtractions(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['extractions'], 'readonly');
      const store = transaction.objectStore('extractions');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const results = request.result.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined
        }));
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteExtraction(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['extractions'], 'readwrite');
      const store = transaction.objectStore('extractions');
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['extractions'], 'readwrite');
      const store = transaction.objectStore('extractions');
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveSetting(key: string, value: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ key, value });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSetting(key: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }
}

// Global instance
export const indexedDBService = new IndexedDBService();
