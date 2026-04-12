'use client';

import Cookies from 'js-cookie';

/**
 * Remove a cookie from the browser by name.
 *
 * @param name
 */
export function ciRemoveCookie(name: string): void {
  Cookies.remove(name);
}
