'use client';

/**
 * Check if an item exists in localStorage.
 * @param key The key to check.
 * @returns True if the key exists, otherwise false.
 */
export function ciLocalStorageHasItem(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null;
  } catch (error) {
    console.error('Error checking existence of item in localStorage', error);
    return false;
  }
}
