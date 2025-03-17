/**
 * Utility functions for handling offline data storage using IndexedDB
 */

// IndexedDB database name and version
const DB_NAME = 'nestTaskOfflineDB';
const DB_VERSION = 1;

// Store names for different types of data
const STORES = {
  TASKS: 'tasks',
  ROUTINES: 'routines',
  USER_DATA: 'userData',
};

/**
 * Initialize the IndexedDB database
 */
export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Error opening IndexedDB:', (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.TASKS)) {
        db.createObjectStore(STORES.TASKS, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.ROUTINES)) {
        db.createObjectStore(STORES.ROUTINES, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
        db.createObjectStore(STORES.USER_DATA, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Save data to IndexedDB
 * @param storeName The name of the store to save data to
 * @param data The data to save
 */
export async function saveToIndexedDB(storeName: string, data: any): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // If data is an array, add each item individually
      if (Array.isArray(data)) {
        data.forEach(item => {
          store.put(item);
        });
      } else {
        // Otherwise, add the single item
        store.put(data);
      }
      
      transaction.oncomplete = () => {
        resolve();
      };
      
      transaction.onerror = (event) => {
        console.error(`Error saving to ${storeName}:`, (event.target as IDBTransaction).error);
        reject((event.target as IDBTransaction).error);
      };
    });
  } catch (error) {
    console.error('IndexedDB save error:', error);
    throw error;
  }
}

/**
 * Get all data from a store in IndexedDB
 * @param storeName The name of the store to get data from
 */
export async function getAllFromIndexedDB(storeName: string): Promise<any[]> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error(`Error getting data from ${storeName}:`, (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  } catch (error) {
    console.error('IndexedDB get error:', error);
    return [];
  }
}

/**
 * Get a specific item by ID from IndexedDB
 * @param storeName The name of the store to get data from
 * @param id The ID of the item to get
 */
export async function getByIdFromIndexedDB(storeName: string, id: string): Promise<any> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error(`Error getting item from ${storeName}:`, (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  } catch (error) {
    console.error('IndexedDB get by ID error:', error);
    return null;
  }
}

/**
 * Delete data from IndexedDB
 * @param storeName The name of the store to delete data from
 * @param id The ID of the item to delete
 */
export async function deleteFromIndexedDB(storeName: string, id: string): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        console.error(`Error deleting from ${storeName}:`, (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  } catch (error) {
    console.error('IndexedDB delete error:', error);
    throw error;
  }
}

/**
 * Clear all data from a store in IndexedDB
 * @param storeName The name of the store to clear
 */
export async function clearIndexedDBStore(storeName: string): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        console.error(`Error clearing ${storeName}:`, (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  } catch (error) {
    console.error('IndexedDB clear error:', error);
    throw error;
  }
}

// Export store names for easy reference
export { STORES }; 