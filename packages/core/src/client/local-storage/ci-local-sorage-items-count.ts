'use client';

/**
 * Get the number of stored items in localStorage.
 * @returns The number of items.
 */
export function ciLocalStorageItemsCount(): number {
  try {
    return localStorage.length;
  } catch (error) {
    console.error('Error getting size of localStorage', error);
    return 0;
  }
}
