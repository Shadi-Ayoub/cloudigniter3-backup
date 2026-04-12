'use client';

export function ciIsCookie(name: string) {
  return document.cookie.includes(name);
}
