'use client';

/**
 * Retrieve an item from localStorage.
 * @param key The key under which the value is stored.
 * @returns The parsed value or null if the key does not exist.
 */
export function ciGetLocalStorageItem(key: string, json: boolean = false) {
  if (typeof window === 'undefined') {
    // we're on the server—no localStorage here
    return null;
  }

  try {
    const serializedValue = localStorage.getItem(key);
    if (json) {
      return serializedValue ? JSON.parse(serializedValue) : null;
    }
    return serializedValue ? serializedValue : null;
  } catch (error) {
    console.error('Error getting item from localStorage', error);
    return null;
  }
}
