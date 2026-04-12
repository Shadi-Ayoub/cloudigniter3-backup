"use client";

/**
 * Get all cookies.
 * @returns An object containing all cookies as key-value pairs.
 */
export function ciGetAllCookies(): Record<string, string> {
  const cookies: Record<string, string> = {};

  document.cookie.split("; ").forEach((cookie) => {
    const parts = cookie.split("=");

    const key = parts[0];
    const value = parts[1];

    if (!key) return; // type guard → ensures key is string

    cookies[key] = value ? decodeURIComponent(value) : "";
  });

  return cookies;
}
