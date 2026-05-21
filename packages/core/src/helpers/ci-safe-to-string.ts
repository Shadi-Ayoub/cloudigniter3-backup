export function ciSafeToString(x: unknown) {
  if (typeof x === 'string') return x;
  try {
    return JSON.stringify(x);
  } catch {
    return String(x);
  }
}
