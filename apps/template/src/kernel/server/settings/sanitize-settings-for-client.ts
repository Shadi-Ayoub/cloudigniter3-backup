/**
 * Sanitize settings before sending them to the browser.
 *
 * Why this exists:
 * - Server-side `getSettings()` resolves BOTH public + private layers (and user layer).
 * - The client should receive only what it needs and what is safe to expose.
 *
 * What we do:
 * - Keep UI-safe sections: general, i18n, theme (and optionally other explicitly-allowed keys)
 * - Remove sensitive/admin/internal sections: security, email, aws, mainMenu, etc.
 * - Optionally expose "derived flags" (safe summaries) instead of raw private config.
 */

import type {
  MainMenuItem,
  CiSettings,
  JsonObject,
  CiJsonValue,
} from '@cloudigniter/next/types';
// import type { MainMenuItem } from '@/ui/filter-main-menu';

export type SanitizeOptions = {
  /**
   * Explicit allow-list of top-level keys.
   * If provided, only these keys will be kept (plus `derived` when enabled).
   */
  allowTopLevelKeys?: string[];

  /**
   * Explicit deny-list of top-level keys.
   * Applied after allow-list logic.
   */
  denyTopLevelKeys?: string[];

  /**
   * Whether to add safe derived flags.
   * Default: true
   */
  includeDerived?: boolean;

  /**
   * If you already computed a filtered menu, you may choose to attach it
   * outside settings (recommended) or include it here under a safe key.
   * Default: false
   */
  includeMenuInSettings?: boolean;

  /**
   * The filtered menu to include if includeMenuInSettings is true.
   */
  filteredMenu?: MainMenuItem[];
};

function isPlainObject(v: unknown): v is JsonObject {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function pickTopLevel(obj: CiSettings, keys: string[]): CiSettings {
  const out: JsonObject = {};
  for (const k of keys) {
    if (k in obj) out[k] = obj[k] as CiJsonValue;
  }
  return out;
}

function dropTopLevel(obj: CiSettings, keys: string[]): CiSettings {
  const out: JsonObject = { ...(obj as JsonObject) };
  for (const k of keys) delete out[k];
  return out;
}

function safeGetBool(
  obj: CiSettings | undefined,
  path: string[]
): boolean | undefined {
  let cur: unknown = obj;
  for (const p of path) {
    if (!isPlainObject(cur) || !(p in cur)) return undefined;
    cur = (cur as JsonObject)[p];
  }
  return typeof cur === 'boolean' ? cur : undefined;
}

/**
 * ✅ sanitizeSettingsForClient()
 *
 * Default behavior:
 * - allow: general, i18n, theme
 * - deny: security, email, aws, mainMenu (and anything else you add)
 * - derived flags:
 *    - derived.auth.mfaEnabled (from security.enable2FA)
 *
 * Return:
 * - a CiSettings safe for client
 */
export function sanitizeSettingsForClient(
  raw: CiSettings | undefined,
  opts?: SanitizeOptions
): CiSettings {
  if (!raw) return {};

  const includeDerived = opts?.includeDerived ?? true;

  // Default allow-list (safe UI keys)
  const defaultAllow = ['general', 'i18n', 'theme'];

  // Default deny-list (sensitive/internal keys)
  const defaultDeny = ['security', 'email', 'aws', 'mainMenu'];

  // 1) Allow-list selection
  const allow = opts?.allowTopLevelKeys?.length
    ? opts.allowTopLevelKeys
    : defaultAllow;
  let out = pickTopLevel(raw, allow);

  // 2) Deny-list stripping (defense-in-depth)
  const deny = opts?.denyTopLevelKeys?.length
    ? opts.denyTopLevelKeys
    : defaultDeny;
  out = dropTopLevel(out, deny);

  // 3) Derived safe flags (optional)
  if (includeDerived) {
    const mfaEnabled = safeGetBool(raw, ['security', 'enable2FA']);

    // Keep derived under a dedicated key to avoid mixing with user-defined structures
    (out as JsonObject).derived = {
      ...(isPlainObject((out as JsonObject).derived)
        ? ((out as JsonObject).derived as JsonObject)
        : {}),
      auth: {
        mfaEnabled: mfaEnabled ?? false,
      },
    };
  }

  // 4) Optionally embed menu (I still recommend passing menu separately in PageConfig)
  if (opts?.includeMenuInSettings) {
    (out as JsonObject).menu = (opts.filteredMenu ??
      []) as unknown as CiJsonValue;
  }

  return out;
}
