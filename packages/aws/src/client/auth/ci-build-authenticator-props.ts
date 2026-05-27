import type { AuthenticatorProps } from '@aws-amplify/ui-react';
import { deepmerge } from 'deepmerge-ts';

import { defaultCiAuthenticatorProps } from './default-authenticator-props';

export type AuthenticatorPropsOverride = Partial<AuthenticatorProps>;

/**
 * Build the final AWS Amplify Authenticator props by merging the
 * CloudIgniter default props with an optional consumer override.
 *
 * Key behaviors:
 * - Deep merges nested objects like `formFields`.
 * - Gives override precedence over defaults.
 * - Handles `components` carefully because it contains React components
 *   (functions), and deep-merge semantics for functions can be unpredictable.
 *
 * Precedence:
 * - For all non-component props: override wins (deep merge).
 * - For `components`: override wins per-key.
 *   - If override provides `components.Header`, it replaces the default header.
 *
 * @param override Optional partial props provided by the consumer.
 * @returns Fully merged `AuthenticatorProps` safe to pass to `<Authenticator {...props} />`.
 */
export function ciBuildAuthenticatorProps(override?: AuthenticatorPropsOverride): AuthenticatorProps {
  const base = defaultCiAuthenticatorProps();

  if (!override) return base;

  // 1) Deep merge everything (including formFields)
  const merged = deepmerge(base, override) as AuthenticatorProps;

  // 2) Re-apply a deterministic merge for `components` to avoid any surprises
  //    when merging React component functions.
  const baseComponents = base.components ?? {};
  const overrideComponents = override.components ?? {};

  merged.components = {
    ...baseComponents,
    ...overrideComponents, // override per component key
  };

  return merged;
}
