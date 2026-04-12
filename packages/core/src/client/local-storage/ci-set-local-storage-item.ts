'use client';

/**
 * Save an item to localStorage.
 * @param key The key under which the value is stored.
 * @param value The value to store. It will be stringified if it's an object.
 */
export function ciSetLocalStorageItem<T = string>(key: string, value: T): void {
  try {
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error('Error setting item to localStorage', error);
  }
}
