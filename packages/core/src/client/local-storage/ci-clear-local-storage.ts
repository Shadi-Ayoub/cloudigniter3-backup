'use client';

/**
 * Clear all items from localStorage.
 */
export function ciClearLocalStorage(): void {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing localStorage', error);
  }
}
