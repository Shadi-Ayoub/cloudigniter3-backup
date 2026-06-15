const RTL_LANGS = new Set([
  "ar", // Arabic
  "he", // Hebrew
  "fa", // Persian (Farsi)
  "ur", // Urdu
  "ps", // Pashto
  "ks", // Kashmiri
  "ku", // Kurdish
  "syr", // Syriac
  "dv", // Divehi
]);

export function ciGetLangDir(locale?: string | null): "rtl" | "ltr" {
  if (!locale) return "ltr";
  // throw new Error(`ciGetLangDir locale = ${locale}, ${typeof locale}`);
  const lang = locale.split(/[-_]/, 1)[0]?.toLowerCase() ?? "";
  return RTL_LANGS.has(lang) ? "rtl" : "ltr";
}
