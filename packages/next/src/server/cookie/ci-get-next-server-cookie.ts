import { cookies } from 'next/headers';

/**
 * Get a server-side cookie in Next.js.
 * @param name The name of the cookie.
 * @returns The value of the cookie or null if not found.
 */
export async function ciGetNextServerCookie(name: string) {
  return (await cookies()).get(name)?.value;
}
