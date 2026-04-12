'use client';

import Cookies from 'js-cookie';

/**
 * Get a cookie by name.
 * @param name The name of the cookie.
 * @returns The value of the cookie or null if not found.
 */
export function ciGetCookie(name: string): string | undefined {
  return Cookies.get(name);
}
