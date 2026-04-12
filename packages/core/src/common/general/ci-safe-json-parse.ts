// small helper: tolerant JSON parse
export function ciSafeJsonParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
