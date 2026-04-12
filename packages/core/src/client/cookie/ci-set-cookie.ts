'use client';

import Cookies from 'js-cookie';

/**
 * Set a cookie.
 * @param name The name of the cookie.
 * @param value The value of the cookie.
 * @param days The number of days until the cookie expires.
 * @param path The path where the cookie is accessible.
 */
export function ciSetCookie(name: string, value: string, options?: Cookies.CookieAttributes): string | undefined {
  return Cookies.set(name, value, options);
}
