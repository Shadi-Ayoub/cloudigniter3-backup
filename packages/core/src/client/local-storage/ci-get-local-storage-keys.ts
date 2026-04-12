'use client';

/**
 * Get all keys in localStorage.
 * @returns An array of all keys.
 */
export function ciGetLocalStorageKeys(): string[] {
  try {
    return Object.keys(localStorage);
  } catch (error) {
    console.error('Error getting all keys from localStorage', error);
    return [];
  }
}
