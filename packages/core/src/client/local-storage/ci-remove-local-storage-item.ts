'use client';

/**
 * Remove an item from localStorage.
 * @param key The key to remove.
 */
export function ciRemoveLocalStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing item from localStorage', error);
  }
}
