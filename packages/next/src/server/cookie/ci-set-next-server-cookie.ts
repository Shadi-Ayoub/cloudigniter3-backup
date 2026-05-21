import { cookies } from 'next/headers';

/**
 * Set a server-side cookie in Next.js.
 * @param name The name of the cookie.
 * @param value The value of the cookie.
 * @param options Additional options for the cookie (e.g., expires, path, etc.).
 */
export async function ciSetNextServerCookie(
  name: string,
  value: string,
  options?: {
    expires?: Date;
    maxAge?: number; // seconds
    path?: string;
    domain?: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'lax' | 'strict' | 'none';
  }
) {
  (await cookies()).set(name, value, options);
}
